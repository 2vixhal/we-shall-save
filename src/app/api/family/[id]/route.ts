import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { FamilyTransaction } from "@/models/FamilyTransaction";
import { DepositAccount } from "@/models/DepositAccount";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const updates = await req.json();

  await connectDB();

  const txn = await FamilyTransaction.findOne({
    _id: id,
    userId: session.user.id,
  });
  if (!txn)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const oldAccount = await DepositAccount.findById(txn.accountId);
  if (oldAccount) {
    if (txn.type === "debit") oldAccount.balance += txn.amount;
    else oldAccount.balance -= txn.amount;
    await oldAccount.save();
  }

  const newAccountId = updates.accountId || txn.accountId;
  const newType = updates.type || txn.type;
  const newAmount = updates.amount ?? txn.amount;

  const newAccount =
    newAccountId.toString() === txn.accountId.toString()
      ? oldAccount
      : await DepositAccount.findById(newAccountId);

  if (newAccount) {
    if (newType === "debit") {
      if (newAccount.balance < newAmount)
        return NextResponse.json(
          { error: "Insufficient balance in target account" },
          { status: 400 }
        );
      newAccount.balance -= newAmount;
    } else {
      newAccount.balance += newAmount;
    }
    await newAccount.save();
  }

  txn.type = newType;
  txn.amount = newAmount;
  txn.member = updates.member?.trim() || txn.member;
  txn.accountId = newAccountId;
  txn.note = updates.note?.trim() || txn.note;
  if (updates.date) txn.date = new Date(updates.date);
  await txn.save();

  return NextResponse.json(txn);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  await connectDB();

  const txn = await FamilyTransaction.findOne({
    _id: id,
    userId: session.user.id,
  });
  if (!txn)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const account = await DepositAccount.findById(txn.accountId);
  if (account) {
    if (txn.type === "debit") account.balance += txn.amount;
    else account.balance -= txn.amount;
    await account.save();
  }

  await FamilyTransaction.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}
