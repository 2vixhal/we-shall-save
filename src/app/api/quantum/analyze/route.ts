import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Transaction } from "@/models/Transaction";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const quantumUrl = process.env.QUANTUM_API_URL;
  if (!quantumUrl)
    return NextResponse.json(
      { error: "Quantum backend not configured" },
      { status: 503 }
    );

  await connectDB();

  const allTx = await Transaction.find({ userId: session.user.id })
    .select("type amount category date createdAt")
    .sort({ date: -1, createdAt: -1 })
    .lean();

  const buckets: Record<string, typeof allTx> = {};
  for (const tx of allTx) {
    const d = new Date((tx.date as Date) || (tx.createdAt as Date));
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (!buckets[key]) buckets[key] = [];
    buckets[key].push(tx);
  }

  const sortedKeys = Object.keys(buckets).sort();
  if (sortedKeys.length < 3) {
    return NextResponse.json(
      { error: "Need at least 3 months of transaction history for QSVM analysis." },
      { status: 400 }
    );
  }

  const currentKey = sortedKeys[sortedKeys.length - 1];
  const historicalKeys = sortedKeys.slice(0, -1);

  const toPayload = (txs: typeof allTx) =>
    txs.map((t) => ({
      type: t.type,
      amount: t.amount,
      category: t.category || "Other",
      date: ((t.date as Date) || (t.createdAt as Date)).toISOString(),
    }));

  const parseKey = (k: string) => {
    const [y, m] = k.split("-").map(Number);
    return { month: m, year: y };
  };

  const body = {
    userId: session.user.id,
    monthlyData: historicalKeys.map((k) => ({
      ...parseKey(k),
      transactions: toPayload(buckets[k]),
    })),
    currentMonth: {
      ...parseKey(currentKey),
      transactions: toPayload(buckets[currentKey]),
    },
  };

  try {
    const res = await fetch(`${quantumUrl}/api/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Quantum backend error" }));
      return NextResponse.json(
        { error: err.detail || "Quantum analysis failed" },
        { status: res.status }
      );
    }

    return NextResponse.json(await res.json());
  } catch (e) {
    return NextResponse.json(
      { error: `Cannot reach quantum backend: ${(e as Error).message}` },
      { status: 503 }
    );
  }
}
