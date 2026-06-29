import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Transaction } from "@/models/Transaction";

const PRESET = [
  "Transport", "Recharges", "Outday", "Health & Fitness", "Skincare",
  "Travel", "Shopping", "Education", "UPI Lite", "Grocery", "EMI", "Misc",
];

export async function GET() {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();

  const allCats = await Transaction.distinct("category", {
    userId: session.user.id,
    type: "debit",
    category: { $nin: [...PRESET, null, ""] },
  });

  const subPrefixes = PRESET.map((p) => `${p} - `);
  const custom = allCats.filter((c) => !subPrefixes.some((pre) => c.startsWith(pre)));

  return NextResponse.json(custom);
}
