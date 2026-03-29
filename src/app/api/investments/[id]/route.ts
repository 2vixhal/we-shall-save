import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Investment } from "@/models/Investment";
import { DepositAccount } from "@/models/DepositAccount";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await connectDB();

  const investment = await Investment.findOne({
    _id: id,
    userId: session.user.id,
  });
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
