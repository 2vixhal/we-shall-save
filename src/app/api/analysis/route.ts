import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Transaction } from "@/models/Transaction";
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

  const txQuery: Record<string, unknown> = {
    userId: session.user.id,
    type: "debit",
    category: { $ne: "Transfer" },
  };

  if (view === "month" && monthParam !== null && yearParam !== null) {
    const m = parseInt(monthParam);
    const y = parseInt(yearParam);
    const dateRange = { $gte: new Date(y, m, 1), $lt: new Date(y, m + 1, 1) };
    txQuery.$or = [
      { date: dateRange },
      { date: { $exists: false }, createdAt: dateRange },
      { date: null, createdAt: dateRange },
    ];
  } else if (view === "year" && yearParam !== null) {
    const y = parseInt(yearParam);
    const dateRange = { $gte: new Date(y, 0, 1), $lt: new Date(y + 1, 0, 1) };
    txQuery.$or = [
      { date: dateRange },
      { date: { $exists: false }, createdAt: dateRange },
      { date: null, createdAt: dateRange },
    ];
  }

  if (accountIdParam) txQuery.accountId = accountIdParam;

  const [debits, accounts] = await Promise.all([
    Transaction.find(txQuery),
    DepositAccount.find({ userId: session.user.id }),
  ]);

  const totalBalance = accountIdParam
    ? (accounts.find((a) => a._id.toString() === accountIdParam)?.balance ?? 0)
    : accounts.reduce((sum, acc) => sum + acc.balance, 0);

  const parentBreakdown: Record<string, { total: number; subs: Record<string, number> }> = {};

  for (const tx of debits) {
    const fullCat = tx.category || "Other";
    const parts = fullCat.split(" - ");
    const parent = parts[0].trim();
    const sub = parts.length > 1 ? parts.slice(1).join(" - ").trim() : null;

    if (!parentBreakdown[parent]) parentBreakdown[parent] = { total: 0, subs: {} };
    parentBreakdown[parent].total += tx.amount;
    if (sub) {
      parentBreakdown[parent].subs[sub] = (parentBreakdown[parent].subs[sub] || 0) + tx.amount;
    }
  }

  const totalSpent = Object.values(parentBreakdown).reduce((s, v) => s + v.total, 0);

  const categories = Object.entries(parentBreakdown)
    .map(([name, data]) => ({
      name,
      amount: data.total,
      percentage: totalSpent > 0 ? Math.round((data.total / totalSpent) * 100) : 0,
      subs: Object.entries(data.subs)
        .map(([subName, subAmount]) => ({
          name: subName,
          amount: subAmount,
          percentage: data.total > 0 ? Math.round((subAmount / data.total) * 100) : 0,
        }))
        .sort((a, b) => b.amount - a.amount),
    }))
    .sort((a, b) => b.amount - a.amount);

  return NextResponse.json({ totalSpent, totalLeft: totalBalance, categories, view });
}
