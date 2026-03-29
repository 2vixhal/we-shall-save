import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Investment } from "@/models/Investment";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();

  const investments = await Investment.find({
    userId: session.user.id,
    subCategory: { $exists: true, $nin: [null, ""] },
  }).select("category subCategory");

  const grouped: Record<string, string[]> = {};
  for (const inv of investments) {
    if (!inv.subCategory) continue;
    if (!grouped[inv.category]) grouped[inv.category] = [];
    if (!grouped[inv.category].includes(inv.subCategory))
      grouped[inv.category].push(inv.subCategory);
  }

  return NextResponse.json(grouped);
}
