import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, dateOfBirth, password } = await req.json();

  if (!name || !dateOfBirth || !password) {
    return NextResponse.json(
      { error: "All fields are required" },
      { status: 400 }
    );
  }

  if (password.length < 6) {
    return NextResponse.json(
      { error: "Password must be at least 6 characters" },
      { status: 400 }
    );
  }

  await connectDB();

  const hashedPassword = await bcrypt.hash(password, 12);

  await User.findByIdAndUpdate(session.user.id, {
    name,
    dateOfBirth: new Date(dateOfBirth),
    password: hashedPassword,
    profileComplete: true,
  });

  return NextResponse.json({ success: true });
}
