import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Lending } from "@/models/Lending";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();

  const friends = await Lending.distinct("friend", {
    userId: session.user.id,
  });

  return NextResponse.json(friends);
}
