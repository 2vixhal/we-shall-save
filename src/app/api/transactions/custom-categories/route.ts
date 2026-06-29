import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Transaction } from "@/models/Transaction";

const PRESET = [
  "Transport", "Petrol", "Recharges", "Outside Eating", "Lent", "Protein",
  "Recreational Activity", "Food", "Shopping", "Bills",
  "Entertainment", "Health", "Education", "Clothing", "UPI Lite", "Misc",
];

export async function GET() {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();

  const categories = await Transaction.distinct("category", {
    userId: session.user.id,
    type: "debit",
    category: { $nin: [...PRESET, null, ""] },
  });

  return NextResponse.json(categories);
}
