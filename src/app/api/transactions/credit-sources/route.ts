import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Transaction } from "@/models/Transaction";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();

  const sources = await Transaction.distinct("receivedFrom", {
    userId: session.user.id,
    type: "credit",
    receivedFrom: { $nin: [null, ""] },
  });

  return NextResponse.json(sources);
}
