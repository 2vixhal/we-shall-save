import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { DepositAccount } from "@/models/DepositAccount";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const accounts = await DepositAccount.find({ userId: session.user.id }).sort({
    createdAt: -1,
  });

  return NextResponse.json(accounts);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, balance } = await req.json();

  if (!name) {
    return NextResponse.json(
      { error: "Account name is required" },
      { status: 400 }
    );
  }

  await connectDB();

  const account = await DepositAccount.create({
    userId: session.user.id,
    name,
    balance: balance || 0,
  });

  return NextResponse.json(account, { status: 201 });
}
