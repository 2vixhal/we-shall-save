import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Transaction } from "@/models/Transaction";
import { DepositAccount } from "@/models/DepositAccount";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { type, amount, category, receivedFrom, accountId } = await req.json();

  await connectDB();

  const existing = await Transaction.findOne({
    _id: id,
    userId: session.user.id,
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Transaction not found" },
      { status: 404 }
    );
  }

  // Reverse the old transaction's effect on its account
  const oldAccount = await DepositAccount.findById(existing.accountId);
  if (oldAccount) {
    if (existing.type === "debit") {
      oldAccount.balance += existing.amount;
    } else {
      oldAccount.balance -= existing.amount;
    }
    await oldAccount.save();
  }

  // Apply the new transaction's effect
  const newAccount = await DepositAccount.findOne({
    _id: accountId,
    userId: session.user.id,
  });

  if (!newAccount) {
    // Re-apply old effect if new account not found
    if (oldAccount) {
      if (existing.type === "debit") {
        oldAccount.balance -= existing.amount;
      } else {
        oldAccount.balance += existing.amount;
      }
      await oldAccount.save();
    }
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  if (type === "debit" && newAccount.balance < amount) {
    // Re-apply old effect if insufficient balance
    if (oldAccount) {
      if (existing.type === "debit") {
        oldAccount.balance -= existing.amount;
      } else {
        oldAccount.balance += existing.amount;
      }
      await oldAccount.save();
    }
    return NextResponse.json(
      { error: "Insufficient balance in this account" },
      { status: 400 }
    );
  }

  if (type === "debit") {
    newAccount.balance -= amount;
  } else {
    newAccount.balance += amount;
  }
  await newAccount.save();

  existing.type = type;
  existing.amount = amount;
  existing.category = type === "debit" ? category : undefined;
  existing.receivedFrom = type === "credit" ? receivedFrom : undefined;
  existing.accountId = accountId;
  await existing.save();

  const updated = await Transaction.findById(id).populate("accountId", "name");

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  await connectDB();

  const transaction = await Transaction.findOne({
    _id: id,
    userId: session.user.id,
  });

  if (!transaction) {
    return NextResponse.json(
      { error: "Transaction not found" },
      { status: 404 }
    );
  }

  // Reverse the transaction's effect on the account
  const account = await DepositAccount.findById(transaction.accountId);
  if (account) {
    if (transaction.type === "debit") {
      account.balance += transaction.amount;
    } else {
      account.balance -= transaction.amount;
    }
    await account.save();
  }

  await Transaction.deleteOne({ _id: id });

  return NextResponse.json({ success: true });
}
