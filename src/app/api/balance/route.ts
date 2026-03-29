import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { DepositAccount } from "@/models/DepositAccount";
import { Transaction } from "@/models/Transaction";
import { Investment } from "@/models/Investment";
import { Lending } from "@/models/Lending";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();

  const { searchParams } = new URL(req.url);
  const monthParam = searchParams.get("month");
  const yearParam = searchParams.get("year");

  const now = new Date();
  const m = monthParam !== null ? parseInt(monthParam) : now.getMonth();
  const y = yearParam !== null ? parseInt(yearParam) : now.getFullYear();

  const startOfMonth = new Date(y, m, 1);
  const endOfMonth = new Date(y, m + 1, 1);
  const dateRange = { $gte: startOfMonth, $lt: endOfMonth };
  const txDateFilter = {
    $or: [
      { date: dateRange },
      { date: { $exists: false }, createdAt: dateRange },
      { date: null, createdAt: dateRange },
    ],
  };

  const [accounts, monthlyTransactions, monthlyInvestments, monthlyLendings] =
    await Promise.all([
      DepositAccount.find({ userId: session.user.id }),
      Transaction.find({ userId: session.user.id, ...txDateFilter }),
      Investment.find({ userId: session.user.id, date: dateRange }),
      Lending.find({ userId: session.user.id, date: dateRange }),
    ]);

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  let totalSpentThisMonth = 0;
  let totalCreditedThisMonth = 0;
  const perAccountSpending: Record<string, number> = {};
  const perAccountCredits: Record<string, number> = {};

  for (const tx of monthlyTransactions) {
    const accId = tx.accountId.toString();
    if (tx.type === "debit") {
      totalSpentThisMonth += tx.amount;
      perAccountSpending[accId] = (perAccountSpending[accId] || 0) + tx.amount;
    } else {
      totalCreditedThisMonth += tx.amount;
      perAccountCredits[accId] = (perAccountCredits[accId] || 0) + tx.amount;
    }
  }

  for (const inv of monthlyInvestments) {
    const accId = inv.accountId.toString();
    totalSpentThisMonth += inv.amount;
    perAccountSpending[accId] = (perAccountSpending[accId] || 0) + inv.amount;
  }

  for (const lend of monthlyLendings) {
    const accId = lend.accountId.toString();
    if (lend.type === "lent") {
      totalSpentThisMonth += lend.amount;
      perAccountSpending[accId] = (perAccountSpending[accId] || 0) + lend.amount;
    } else {
      totalCreditedThisMonth += lend.amount;
      perAccountCredits[accId] = (perAccountCredits[accId] || 0) + lend.amount;
    }
  }

  const accountDetails = accounts.map((acc) => {
    const spent = perAccountSpending[acc._id.toString()] || 0;
    const credited = perAccountCredits[acc._id.toString()] || 0;
    return {
      _id: acc._id,
      name: acc.name,
      balance: acc.balance,
      source: acc.source,
      sourceMonth: acc.sourceMonth,
      spentThisMonth: spent,
      creditedThisMonth: credited,
    };
  });

  return NextResponse.json({
    totalBalance,
    totalSpentThisMonth,
    totalCreditedThisMonth,
    accounts: accountDetails,
    month: m,
    year: y,
  });
}
