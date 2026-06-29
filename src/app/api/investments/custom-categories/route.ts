import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Investment } from "@/models/Investment";

const PRESET = ["Mutual Fund", "ETF", "Stock", "Gold", "Silver", "FD", "Debt Funds"];

export async function GET() {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();

  const categories = await Investment.distinct("category", {
    userId: session.user.id,
    category: { $nin: PRESET },
  });

  return NextResponse.json(categories);
}
