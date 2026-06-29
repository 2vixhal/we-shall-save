import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Transaction } from "@/models/Transaction";
import { Lending } from "@/models/Lending";
import { DepositAccount } from "@/models/DepositAccount";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();

  const { searchParams } = new URL(req.url);
  const monthParam = searchParams.get("month");
  const yearParam = searchParams.get("year");
  const accountIdParam = searchParams.get("accountId");

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

  const txQuery: Record<string, unknown> = { userId: session.user.id, type: "debit", ...txDateFilter };
  const lentQuery: Record<string, unknown> = { userId: session.user.id, type: "lent", date: dateRange };
  const gotBackQuery: Record<string, unknown> = { userId: session.user.id, type: "gotback", date: dateRange };

  if (accountIdParam) {
    txQuery.accountId = accountIdParam;
    lentQuery.accountId = accountIdParam;
    gotBackQuery.accountId = accountIdParam;
  }

  const [monthlyDebits, monthlyLent, monthlyGotBack, accounts] =
    await Promise.all([
      Transaction.find(txQuery),
      Lending.find(lentQuery),
      Lending.find(gotBackQuery),
      DepositAccount.find({ userId: session.user.id }),
    ]);

  const totalBalance = accountIdParam
    ? (accounts.find((a) => a._id.toString() === accountIdParam)?.balance ?? 0)
    : accounts.reduce((sum, acc) => sum + acc.balance, 0);

  const categoryBreakdown: Record<string, number> = {};

  for (const tx of monthlyDebits) {
    const cat = tx.category || "Other";
    categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + tx.amount;
  }

  const totalLent = monthlyLent.reduce((s, l) => s + l.amount, 0);
  const totalGotBack = monthlyGotBack.reduce((s, l) => s + l.amount, 0);
  const netLending = totalLent - totalGotBack;
  if (netLending > 0) categoryBreakdown["Lent"] = netLending;

  const totalSpent = Object.values(categoryBreakdown).reduce((s, v) => s + v, 0);

  const categories = Object.entries(categoryBreakdown)
    .map(([name, amount]) => ({
      name,
      amount,
      percentage: totalSpent > 0 ? Math.round((amount / totalSpent) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  return NextResponse.json({
    totalSpent,
    totalLeft: totalBalance,
    categories,
    month: m,
    year: y,
  });
}
