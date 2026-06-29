import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { FamilyTransaction } from "@/models/FamilyTransaction";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();

  const members = await FamilyTransaction.distinct("member", {
    userId: session.user.id,
  });

  return NextResponse.json(members);
}
