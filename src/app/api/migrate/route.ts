import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Transaction } from "@/models/Transaction";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();

  const result = await Transaction.updateMany(
    { date: { $exists: false } },
    [{ $set: { date: "$createdAt" } }]
  );

  const resultNull = await Transaction.updateMany(
    { date: null },
    [{ $set: { date: "$createdAt" } }]
  );

  return NextResponse.json({
    message: "Migration complete",
    updatedMissing: result.modifiedCount,
    updatedNull: resultNull.modifiedCount,
  });
}
