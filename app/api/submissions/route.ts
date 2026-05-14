import { NextResponse } from 'next/server';
import { prisma } from '@/db/prisma'; 

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const newSubmission = await prisma.submission.create({
      data: {
        // --- CORE FIELDS ---
        applicantName: body.applicantName,
        certificateType: body.certificateType,
        status: 'PENDING', 
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
        facilityLocation: body.facilityLocation || null, // 'address' in frontend
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
    
  }

  /* eslint-disable @typescript-eslint/no-explicit-any */
  catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create submission" }, 
      { status: 500 }
    );
  }
}