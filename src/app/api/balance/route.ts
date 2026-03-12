import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { DepositAccount } from "@/models/DepositAccount";
import { Transaction } from "@/models/Transaction";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  const accounts = await DepositAccount.find({ userId: session.user.id });

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const monthlyTransactions = await Transaction.find({
    userId: session.user.id,
    createdAt: { $gte: startOfMonth },
  });

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  let totalSpentThisMonth = 0;
  let totalCreditedThisMonth = 0;
  const perAccountSpending: Record<string, number> = {};

  for (const tx of monthlyTransactions) {
    if (tx.type === "debit") {
      totalSpentThisMonth += tx.amount;
      const accId = tx.accountId.toString();
      perAccountSpending[accId] = (perAccountSpending[accId] || 0) + tx.amount;
    } else {
      totalCreditedThisMonth += tx.amount;
    }
  }

  const accountDetails = accounts.map((acc) => {
    const spent = perAccountSpending[acc._id.toString()] || 0;
    return {
      _id: acc._id,
      name: acc.name,
      balance: acc.balance,
      startOfMonthBalance: acc.balance + spent,
      spentThisMonth: spent,
    };
  });

  return NextResponse.json({
    totalBalance,
    totalSpentThisMonth,
    totalCreditedThisMonth,
    startOfMonthTotal: totalBalance + totalSpentThisMonth,
    accounts: accountDetails,
  });
}
