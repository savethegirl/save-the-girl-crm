/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { prisma } from '@/db/prisma'; 
import { authOptions } from "@/lib/auth"; 

export async function POST(request: Request) {
  try {
    // 1. Get the session directly from the server, ignoring whatever the frontend claims
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;

    const body = await request.json();
    
    //  Only auto-approve if the server definitively knows this is an ADMIN
    const finalStatus = userRole === 'ADMIN' ? 'APPROVED' : 'PENDING';

    const newSubmission = await prisma.submission.create({
      data: {
        // --- CORE FIELDS ---
        applicantName: body.applicantName,
        certificateType: body.certificateType,
        status: finalStatus,
        emails: body.emails || (body.email ? [body.email] : []),
        phones: body.phones || (body.phone ? [body.phone] : []),
        socialLinks: body.socialLinks || null,
        itemsDonated: body.itemsDonated || null,

        // --- INTERN & VOLUNTEER FIELDS ---
        gender: body.gender || null,
        startDate: body.startDate ? new Date(body.startDate) : null,
        endDate: body.endDate ? new Date(body.endDate) : null,
        mode: body.mode || null,
        postRole: body.postRole || null,
        scheduleType: body.scheduleType || null,
        isUniversityRequirement: body.isUniversityRequirement === true || body.isUniversityRequirement === 'true',
        universityName: body.universityName || null,
        rating: body.rating ? parseInt(body.rating) : null,

        // --- VISITOR, HOST & DONOR FIELDS ---
        visitDate: body.visitDate ? new Date(body.visitDate) : null,
        eventDate: body.eventDate ? new Date(body.eventDate) : null,
        centerVisited: body.centerVisited || null,
        attendantName: body.attendantName || null,
        facilityLocation: body.facilityLocation || null, 
        purposeOfVisit: body.purposeOfVisit || null,

        // --- FINANCIALS & EXTRAS ---
        donationType: body.donationType || null,
        helpedFinancially: body.helpedFinancially === true || body.helpedFinancially === 'true',
        financialAmount: body.financialAmount ? parseFloat(body.financialAmount) : null,
        nextFollowUpDue: body.nextFollowUpDue ? new Date(body.nextFollowUpDue) : null,
        uploadPhotosLink: body.uploadPhotosLink || body.photosLink || null,
        additionalRemarks: body.additionalRemarks || body.remarks || null,

        // --- NEW HOST SPECIFIC FIELDS ---
        companyCoordinator: body.companyCoordinator || null,
        noOfChildren: body.noOfChildren ? parseInt(body.noOfChildren) : null,
        caretakers: body.caretakers || [],
        reportUploadLink: body.reportUploadLink || null,
        futurePartnershipRemarks: body.futurePartnershipRemarks || null,
        nextExpectedVisit: body.nextExpectedVisit ? new Date(body.nextExpectedVisit) : null,
      }
    });

    return NextResponse.json({ success: true, data: newSubmission }, { status: 201 });
    
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create submission" }, 
      { status: 500 }
    );
  }
}

export async function GET() {
  // HARD LOCK: Must be logged in (Staff or Admin) to view submissions
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }

  try {
    const submissions = await prisma.submission.findMany({
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, data: submissions }, { status: 200 });
  } catch (error: any) {
    console.error("Fetch Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch submissions" }, 
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  // HARD LOCK: Must be logged in
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ success: false, error: "Missing ID or Status" }, { status: 400 });
    }

    const updatedSubmission = await prisma.submission.update({
      where: { id },
      data: { status }
    });

    return NextResponse.json({ success: true, data: updatedSubmission });
  } catch (error: any) {
    console.error("Update Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  // HARD LOCK: Let's require ADMIN specifically to delete records, while STAFF can only view/update
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin privileges required to delete records" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: "Missing ID" }, { status: 400 });
    }

    await prisma.submission.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: "Deleted successfully" });
  } catch (error: any) {
    console.error("Delete Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}