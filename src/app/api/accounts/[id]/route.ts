import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { DepositAccount } from "@/models/DepositAccount";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { name, balance } = await req.json();

  await connectDB();

  const account = await DepositAccount.findOne({ _id: id, userId: session.user.id });
  if (!account)
    return NextResponse.json({ error: "Account not found" }, { status: 404 });

  if (name?.trim()) account.name = name.trim();

  if (balance !== undefined && balance !== null) {
    const newBal = parseFloat(balance);
    if (isNaN(newBal) || newBal < 0)
      return NextResponse.json({ error: "Balance must be a non-negative number" }, { status: 400 });
    account.balance = newBal;
  }

  await account.save();
  return NextResponse.json(account);
}
