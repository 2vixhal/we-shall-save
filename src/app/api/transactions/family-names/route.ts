import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Transaction } from "@/models/Transaction";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();

  const { searchParams } = new URL(req.url);
  const forCategory = searchParams.get("category");

  if (forCategory === "Travel") {
    const txns = await Transaction.find({
      userId: session.user.id,
      category: { $regex: /^Travel - /, $options: "i" },
    }).select("category");

    const tripNames = [
      ...new Set(
        txns
          .map((t) => t.category?.replace(/^Travel - /i, "").trim())
          .filter(Boolean)
      ),
    ];
    return NextResponse.json(tripNames);
  }

  const transactions = await Transaction.find({
    userId: session.user.id,
    category: forCategory || "Family",
    note: { $exists: true, $nin: [null, ""] },
  }).select("note");

  const names = [...new Set(transactions.map((t) => t.note).filter(Boolean))];
  return NextResponse.json(names);
}
