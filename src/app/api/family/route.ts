import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { FamilyTransaction } from "@/models/FamilyTransaction";
import { DepositAccount } from "@/models/DepositAccount";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();

  const { searchParams } = new URL(req.url);
  const monthParam = searchParams.get("month");
  const yearParam = searchParams.get("year");
  const accountParam = searchParams.get("accountId");
  const memberParam = searchParams.get("member");

  const query: Record<string, unknown> = { userId: session.user.id };
  if (accountParam) query.accountId = accountParam;
  if (memberParam) query.member = memberParam;

  if (monthParam !== null && yearParam !== null) {
    const m = parseInt(monthParam);
    const y = parseInt(yearParam);
    query.date = { $gte: new Date(y, m, 1), $lt: new Date(y, m + 1, 1) };
  }

  const txns = await FamilyTransaction.find(query)
    .populate("accountId", "name")
    .sort({ date: -1 });

  return NextResponse.json(txns);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { type, amount, member, accountId, note, date } = await req.json();

  if (!type || !amount || !member || !accountId)
    return NextResponse.json(
      { error: "Type, amount, member, and account are required" },
      { status: 400 }
    );

  await connectDB();

  const account = await DepositAccount.findOne({
    _id: accountId,
    userId: session.user.id,
  });
  if (!account)
    return NextResponse.json({ error: "Account not found" }, { status: 404 });

  if (type === "debit" && account.balance < amount)
    return NextResponse.json(
      { error: "Insufficient balance" },
      { status: 400 }
    );

  const txn = await FamilyTransaction.create({
    userId: session.user.id,
    type,
    amount,
    member: member.trim(),
    accountId,
    note: note?.trim() || undefined,
    date: date ? new Date(date) : new Date(),
  });

  if (type === "debit") account.balance -= amount;
  else account.balance += amount;
  await account.save();

  return NextResponse.json(txn, { status: 201 });
}
