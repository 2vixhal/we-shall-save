import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Lending } from "@/models/Lending";
import { DepositAccount } from "@/models/DepositAccount";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();

  const { searchParams } = new URL(req.url);
  const friend = searchParams.get("friend");

  const query: Record<string, unknown> = { userId: session.user.id };
  if (friend) query.friend = friend;

  const lendings = await Lending.find(query)
    .populate("accountId", "name")
    .sort({ date: -1 });

  return NextResponse.json(lendings);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { amount, friend, type, accountId, date } = await req.json();

  if (!amount || !friend || !type || !accountId)
    return NextResponse.json(
      { error: "Amount, friend, type, and account are required" },
      { status: 400 }
    );

  await connectDB();

  const account = await DepositAccount.findOne({
    _id: accountId,
    userId: session.user.id,
  });
  if (!account)
    return NextResponse.json({ error: "Account not found" }, { status: 404 });

  if (type === "lent" && account.balance < amount)
    return NextResponse.json(
      { error: "Insufficient balance" },
      { status: 400 }
    );

  const lending = await Lending.create({
    userId: session.user.id,
    amount,
    friend,
    type,
    accountId,
    date: date ? new Date(date) : new Date(),
  });

  if (type === "lent") {
    account.balance -= amount;
  } else {
    account.balance += amount;
  }
  await account.save();

  return NextResponse.json(lending, { status: 201 });
}
