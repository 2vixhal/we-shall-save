import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Transaction } from "@/models/Transaction";
import { DepositAccount } from "@/models/DepositAccount";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  const { searchParams } = new URL(req.url);
  const monthParam = searchParams.get("month");
  const yearParam = searchParams.get("year");

  const query: Record<string, unknown> = { userId: session.user.id };

  if (monthParam !== null && yearParam !== null) {
    const m = parseInt(monthParam);
    const y = parseInt(yearParam);
    const start = new Date(y, m, 1);
    const end = new Date(y, m + 1, 1);
    const dateRange = { $gte: start, $lt: end };
    query.$or = [
      { date: dateRange },
      { date: { $exists: false }, createdAt: dateRange },
      { date: null, createdAt: dateRange },
    ];
  }

  const transactions = await Transaction.find(query)
    .populate("accountId", "name")
    .sort({ date: -1, createdAt: -1 });

  return NextResponse.json(transactions);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { type, amount, category, receivedFrom, accountId, date, note } =
    await req.json();

  if (!type || !amount || !accountId) {
    return NextResponse.json(
      { error: "Type, amount, and account are required" },
      { status: 400 }
    );
  }

  if (type === "debit" && !category) {
    return NextResponse.json(
      { error: "Category is required for debit transactions" },
      { status: 400 }
    );
  }

  if (type === "credit" && !receivedFrom) {
    return NextResponse.json(
      { error: "Received from is required for credit transactions" },
      { status: 400 }
    );
  }

  await connectDB();

  const account = await DepositAccount.findOne({
    _id: accountId,
    userId: session.user.id,
  });

  if (!account) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  if (type === "debit" && account.balance < amount) {
    return NextResponse.json(
      { error: "Insufficient balance in this account" },
      { status: 400 }
    );
  }

  const transaction = await Transaction.create({
    userId: session.user.id,
    type,
    amount,
    category: type === "debit" ? category : undefined,
    receivedFrom: type === "credit" ? receivedFrom : undefined,
    accountId,
    date: date ? new Date(date) : new Date(),
    note: note?.trim() || undefined,
  });

  if (type === "debit") {
    account.balance -= amount;
  } else {
    account.balance += amount;
  }
  await account.save();

  return NextResponse.json(transaction, { status: 201 });
}
