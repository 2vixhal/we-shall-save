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
  const view = searchParams.get("view") || "month";

  const txQuery: Record<string, unknown> = { userId: session.user.id, type: "debit" };
  const lentQuery: Record<string, unknown> = { userId: session.user.id, type: "lent" };
  const gotBackQuery: Record<string, unknown> = { userId: session.user.id, type: "gotback" };

  if (view === "month" && monthParam !== null && yearParam !== null) {
    const m = parseInt(monthParam);
    const y = parseInt(yearParam);
    const dateRange = { $gte: new Date(y, m, 1), $lt: new Date(y, m + 1, 1) };
    txQuery.$or = [
      { date: dateRange },
      { date: { $exists: false }, createdAt: dateRange },
      { date: null, createdAt: dateRange },
    ];
    lentQuery.date = dateRange;
    gotBackQuery.date = dateRange;
  } else if (view === "year" && yearParam !== null) {
    const y = parseInt(yearParam);
    const dateRange = { $gte: new Date(y, 0, 1), $lt: new Date(y + 1, 0, 1) };
    txQuery.$or = [
      { date: dateRange },
      { date: { $exists: false }, createdAt: dateRange },
      { date: null, createdAt: dateRange },
    ];
    lentQuery.date = dateRange;
    gotBackQuery.date = dateRange;
  }

  if (accountIdParam) {
    txQuery.accountId = accountIdParam;
    lentQuery.accountId = accountIdParam;
    gotBackQuery.accountId = accountIdParam;
  }

  const [debits, lent, gotBack, accounts] = await Promise.all([
    Transaction.find(txQuery),
    Lending.find(lentQuery),
    Lending.find(gotBackQuery),
    DepositAccount.find({ userId: session.user.id }),
  ]);

  const totalBalance = accountIdParam
    ? (accounts.find((a) => a._id.toString() === accountIdParam)?.balance ?? 0)
    : accounts.reduce((sum, acc) => sum + acc.balance, 0);

  const categoryBreakdown: Record<string, number> = {};

  for (const tx of debits) {
    const cat = tx.category || "Other";
    categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + tx.amount;
  }

  const totalLent = lent.reduce((s, l) => s + l.amount, 0);
  const totalGotBack = gotBack.reduce((s, l) => s + l.amount, 0);
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

  return NextResponse.json({ totalSpent, totalLeft: totalBalance, categories, view });
}
