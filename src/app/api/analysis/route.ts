import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Transaction } from "@/models/Transaction";
import { DepositAccount } from "@/models/DepositAccount";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const monthlyDebits = await Transaction.find({
    userId: session.user.id,
    type: "debit",
    createdAt: { $gte: startOfMonth },
  });

  const accounts = await DepositAccount.find({ userId: session.user.id });
  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  const totalSpent = monthlyDebits.reduce((sum, tx) => sum + tx.amount, 0);

  const categoryBreakdown: Record<string, number> = {};
  for (const tx of monthlyDebits) {
    const cat = tx.category || "Other";
    categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + tx.amount;
  }

  const categories = Object.entries(categoryBreakdown).map(
    ([name, amount]) => ({
      name,
      amount,
      percentage: totalSpent > 0 ? Math.round((amount / totalSpent) * 100) : 0,
    })
  );

  return NextResponse.json({
    totalSpent,
    totalLeft: totalBalance,
    categories,
  });
}
