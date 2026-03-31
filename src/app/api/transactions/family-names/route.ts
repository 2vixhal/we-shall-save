import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Transaction } from "@/models/Transaction";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();

  const transactions = await Transaction.find({
    userId: session.user.id,
    category: "Family",
    note: { $exists: true, $nin: [null, ""] },
  }).select("note");

  const names = [...new Set(transactions.map((t) => t.note).filter(Boolean))];
  return NextResponse.json(names);
}
