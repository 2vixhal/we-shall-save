import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { DepositAccount } from "@/models/DepositAccount";
import { Transaction } from "@/models/Transaction";
import { Investment } from "@/models/Investment";
import { Lending } from "@/models/Lending";
import { FamilyTransaction } from "@/models/FamilyTransaction";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();

  const { searchParams } = new URL(req.url);
  const detailed = searchParams.get("detailed");

  const accounts = await DepositAccount.find({ userId: session.user.id }).sort({
    createdAt: -1,
  });

  if (detailed !== "true") {
    return NextResponse.json(accounts);
  }

  const userId = session.user.id;
  const [transactions, investments, lendings, familyTxns] = await Promise.all([
    Transaction.find({ userId }),
    Investment.find({ userId }),
    Lending.find({ userId }),
    FamilyTransaction.find({ userId }),
  ]);

  const perAccountDebited: Record<string, number> = {};
  const perAccountCredited: Record<string, number> = {};

  for (const tx of transactions) {
    const accId = tx.accountId.toString();
    if (tx.type === "debit") {
      perAccountDebited[accId] = (perAccountDebited[accId] || 0) + tx.amount;
    } else {
      perAccountCredited[accId] = (perAccountCredited[accId] || 0) + tx.amount;
    }
  }

  for (const inv of investments) {
    const accId = inv.accountId.toString();
    perAccountDebited[accId] = (perAccountDebited[accId] || 0) + inv.amount;
  }

  for (const lend of lendings) {
    const accId = lend.accountId.toString();
    if (lend.type === "lent") {
      perAccountDebited[accId] = (perAccountDebited[accId] || 0) + lend.amount;
    } else {
      perAccountCredited[accId] = (perAccountCredited[accId] || 0) + lend.amount;
    }
  }

  for (const ft of familyTxns) {
    const accId = ft.accountId.toString();
    if (ft.type === "debit") {
      perAccountDebited[accId] = (perAccountDebited[accId] || 0) + ft.amount;
    } else {
      perAccountCredited[accId] = (perAccountCredited[accId] || 0) + ft.amount;
    }
  }

  const enriched = accounts.map((acc) => {
    const id = acc._id.toString();
    const totalDebited = perAccountDebited[id] || 0;
    const totalCredited = perAccountCredited[id] || 0;
    return {
      _id: acc._id,
      name: acc.name,
      balance: acc.balance,
      source: acc.source,
      sourceMonth: acc.sourceMonth,
      totalDebited,
      totalCredited,
      originalTotal: acc.balance + totalDebited - totalCredited,
    };
  });

  return NextResponse.json(enriched);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, balance, source, sourceMonth } = await req.json();

  if (!name)
    return NextResponse.json(
      { error: "Account name is required" },
      { status: 400 }
    );

  await connectDB();

  const account = await DepositAccount.create({
    userId: session.user.id,
    name,
    balance: balance || 0,
    source: source || undefined,
    sourceMonth: source === "Salary" && sourceMonth ? sourceMonth : undefined,
  });

  return NextResponse.json(account, { status: 201 });
}
