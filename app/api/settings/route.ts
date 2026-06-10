/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { prisma } from '@/db/prisma';
import { revalidatePath } from 'next/cache'; 

export const dynamic = 'force-dynamic';

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { centers } = body;

    if (!centers || !Array.isArray(centers)) {
      return NextResponse.json({ success: false, error: "Invalid data format" }, { status: 400 });
    }

    const existingSettings = await prisma.settings.findFirst();

    if (!existingSettings) {
      return NextResponse.json({ success: false, error: "Settings not initialized" }, { status: 404 });
    }
    

    const updatedSettings = await prisma.settings.update({
      where: { id: existingSettings.id },
      data: { centers }
    });

    revalidatePath('/admin/settings'); 
    

    return NextResponse.json({ success: true, data: updatedSettings });
  } catch (error: any) {
    console.error("Settings Update Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const settings = await prisma.settings.findFirst();
    const centers = settings?.centers || [];
    
    return NextResponse.json({ success: true, data: centers });
  } catch (error: any) {
    console.error("Fetch Settings Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}