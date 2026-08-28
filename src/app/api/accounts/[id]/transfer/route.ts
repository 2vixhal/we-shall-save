import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { DepositAccount } from "@/models/DepositAccount";
import { Transaction } from "@/models/Transaction";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: fromAccountId } = await params;
  const { toAccountId, note } = await req.json();

  if (!toAccountId)
    return NextResponse.json({ error: "Target account is required" }, { status: 400 });

  if (fromAccountId === toAccountId)
    return NextResponse.json({ error: "Cannot transfer to the same account" }, { status: 400 });

  await connectDB();

  const [fromAccount, toAccount] = await Promise.all([
    DepositAccount.findOne({ _id: fromAccountId, userId: session.user.id }),
    DepositAccount.findOne({ _id: toAccountId, userId: session.user.id }),
  ]);

  if (!fromAccount)
    return NextResponse.json({ error: "Source account not found" }, { status: 404 });
  if (!toAccount)
    return NextResponse.json({ error: "Target account not found" }, { status: 404 });

  const amount = fromAccount.balance;
  if (amount <= 0)
    return NextResponse.json({ error: "No balance to transfer" }, { status: 400 });

  const transferNote = note?.trim() || `Month-end transfer`;
  const now = new Date();

  await Transaction.create({
    userId: session.user.id,
    type: "debit",
    amount,
    category: "Transfer",
    accountId: fromAccount._id,
    note: `${transferNote} → ${toAccount.name}`,
    date: now,
  });

  await Transaction.create({
    userId: session.user.id,
    type: "credit",
    amount,
    receivedFrom: "Transfer",
    accountId: toAccount._id,
    note: `${transferNote} ← ${fromAccount.name}`,
    date: now,
  });

  fromAccount.balance = 0;
  toAccount.balance += amount;
  await Promise.all([fromAccount.save(), toAccount.save()]);

  return NextResponse.json({
    success: true,
    amount,
    fromAccount: { _id: fromAccount._id, name: fromAccount.name, balance: fromAccount.balance },
    toAccount: { _id: toAccount._id, name: toAccount.name, balance: toAccount.balance },
  });
}
