import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Lending } from "@/models/Lending";
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

  const lending = await Lending.findOne({ _id: id, userId: session.user.id });
  if (!lending)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const account = await DepositAccount.findById(lending.accountId);
  if (account) {
    if (lending.type === "lent") {
      account.balance += lending.amount;
    } else {
      account.balance -= lending.amount;
    }
    await account.save();
  }

  await Lending.deleteOne({ _id: id });
  return NextResponse.json({ success: true });
}
