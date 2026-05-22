import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/db/prisma"; // Adjust this path if your prisma client is somewhere else

export async function GET() {
  try {
    // 1. Hash a secure default password
    const hashedPassword = await bcrypt.hash("carcar", 10);

    // 2. Use upsert so it doesn't crash if the user already exists
    const admin = await prisma.user.upsert({
      where: { username: "car" },
      update: {},
      create: {
        name: "Master Admin",
        username: "car",
        password: hashedPassword,
        role: "ADMIN", // Grants you full access
      },
    });

    return NextResponse.json({ 
      success: true, 
      message: "Admin seeded successfully. DELETE THIS FILE IMMEDIATELY.",
      user: { username: admin.username, role: admin.role }
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to seed admin" }, { status: 500 });
  }
}