import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Transaction } from "@/models/Transaction";
import { FamilyTransaction } from "@/models/FamilyTransaction";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();

  const familyTxns = await Transaction.find({
    userId: session.user.id,
    category: "Family",
  });

  let migrated = 0;
  for (const tx of familyTxns) {
    await FamilyTransaction.create({
      userId: tx.userId,
      type: tx.type,
      amount: tx.amount,
      member: tx.note || "Family",
      accountId: tx.accountId,
      note: tx.note || undefined,
      date: tx.date || tx.createdAt,
    });
    await Transaction.findByIdAndDelete(tx._id);
    migrated++;
  }

  return NextResponse.json({
    message: "Migration complete",
    migrated,
  });
}
