import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Investment } from "@/models/Investment";
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

  const query: Record<string, unknown> = { userId: session.user.id };
  if (accountParam) query.accountId = accountParam;

  if (monthParam !== null && yearParam !== null) {
    const m = parseInt(monthParam);
    const y = parseInt(yearParam);
    query.date = { $gte: new Date(y, m, 1), $lt: new Date(y, m + 1, 1) };
  }

  const investments = await Investment.find(query)
    .populate("accountId", "name")
    .sort({ date: -1 });

  return NextResponse.json(investments);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { amount, category, subCategory, accountId, date } = await req.json();

  if (!amount || !category || !accountId)
    return NextResponse.json(
      { error: "Amount, category, and account are required" },
      { status: 400 }
    );

  await connectDB();

  const account = await DepositAccount.findOne({
    _id: accountId,
    userId: session.user.id,
  });
  if (!account)
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  if (account.balance < amount)
    return NextResponse.json(
      { error: "Insufficient balance" },
      { status: 400 }
    );

  const investment = await Investment.create({
    userId: session.user.id,
    amount,
    category,
    subCategory: subCategory || undefined,
    accountId,
    date: date ? new Date(date) : new Date(),
  });

  account.balance -= amount;
  await account.save();

  return NextResponse.json(investment, { status: 201 });
}
