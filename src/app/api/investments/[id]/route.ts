import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Investment } from "@/models/Investment";
import { DepositAccount } from "@/models/DepositAccount";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { amount, category, subCategory, accountId, date } = await req.json();

  await connectDB();

  const existing = await Investment.findOne({ _id: id, userId: session.user.id });
  if (!existing)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const oldAccount = await DepositAccount.findById(existing.accountId);
  if (oldAccount) {
    oldAccount.balance += existing.amount;
    await oldAccount.save();
  }

  const newAccount = await DepositAccount.findOne({ _id: accountId, userId: session.user.id });
  if (!newAccount) {
    if (oldAccount) { oldAccount.balance -= existing.amount; await oldAccount.save(); }
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  if (newAccount.balance < amount) {
    if (oldAccount) { oldAccount.balance -= existing.amount; await oldAccount.save(); }
    return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
  }

  newAccount.balance -= amount;
  await newAccount.save();

  existing.amount = amount;
  existing.category = category;
  existing.subCategory = subCategory?.trim() || undefined;
  existing.accountId = accountId;
  if (date) existing.date = new Date(date);
  await existing.save();

  const updated = await Investment.findById(id).populate("accountId", "name");
  return NextResponse.json(updated);
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

  const investment = await Investment.findOne({ _id: id, userId: session.user.id });
  if (!investment)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const account = await DepositAccount.findById(investment.accountId);
  if (account) {
    account.balance += investment.amount;
    await account.save();
  }

  await Investment.deleteOne({ _id: id });
  return NextResponse.json({ success: true });
}
