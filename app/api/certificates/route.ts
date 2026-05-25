import { NextResponse } from 'next/server';
import { prisma } from '@/db/prisma';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs/promises';
import path from 'path';

export async function POST(req: Request) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "Missing Submission ID" }, { status: 400 });

    const submission = await prisma.submission.findUnique({ where: { id } });
    if (!submission) return NextResponse.json({ error: "Submission not found" }, { status: 404 });

    // 1. Dynamic Template Routing
    const templateMap: Record<string, string> = {
      'VOLUNTEER': 'volunteer.png',
      'INTERN': 'intern.png',
      'DONOR': 'donor.png',
      'HOST': 'host.png',
      'VISITOR': 'visitor.png',
    };

    const typeKey = submission.certificateType?.toUpperCase();
    const fileName = templateMap[typeKey];

    if (!fileName) {
      return NextResponse.json({ error: `Unsupported certificate type: ${typeKey}` }, { status: 400 });
    }

    // 2. Load the specific blank template
    const templatePath = path.join(process.cwd(), 'public', 'templates', fileName);
    const templateBytes = await fs.readFile(templatePath);

    // 3. Initialize PDF and embed the main background image
    const pdfDoc = await PDFDocument.create();
    const bgImage = await pdfDoc.embedPng(templateBytes);
    
    // Make the PDF page exactly the size of your JPG/PNG (2000 x 1414)
    const page = pdfDoc.addPage([bgImage.width, bgImage.height]);
    page.drawImage(bgImage, { x: 0, y: 0, width: bgImage.width, height: bgImage.height });

    // 4. Embed Bold Font & Prepare Text Data
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const { applicantName, postRole, startDate, endDate } = submission;
    const textColor = rgb(0.1, 0.1, 0.1);
    
    const formatDt = (dt: Date | null) => dt ? new Date(dt).toLocaleDateString('en-IN') : 'N/A';
    
    // Current date for PDF generation
    const generationDate = new Date().toLocaleDateString('en-IN');
    
    // Center point of a 2000px wide image
    const center = 1000;

    switch (typeKey) {
      case 'VOLUNTEER':
        // Top Left Date
        page.drawText(generationDate, { x: 160, y: 1137, size: 28, font: boldFont, color: textColor });

        // Center the Name
        const volNameText = applicantName || "Unknown Name";
        const volNameWidth = boldFont.widthOfTextAtSize(volNameText, 56);
        page.drawText(volNameText, { x: center - (volNameWidth / 2), y: 787, size: 56, font: boldFont, color: textColor });

        // Center the Role
        const volRoleText = postRole || "Volunteer";
        const volRoleWidth = boldFont.widthOfTextAtSize(volRoleText, 36);
        page.drawText(volRoleText, { x: center - (volRoleWidth / 2), y: 532, size: 36, font: boldFont, color: textColor });

        // From and To Dates
        page.drawText(formatDt(startDate), { x: 554, y: 427, size: 32, font: boldFont, color: textColor });
        page.drawText(formatDt(endDate), { x: 1205, y: 427, size: 32, font: boldFont, color: textColor });
        break;

      case 'INTERN':
        // Middle Left Date 
        page.drawText(generationDate, { x: 182, y: 870, size: 28, font: boldFont, color: textColor });

        // Center the Name
        const internNameText = applicantName || "Unknown Name";
        const internNameWidth = boldFont.widthOfTextAtSize(internNameText, 56);
        page.drawText(internNameText, { x: center - (internNameWidth / 2), y: 773, size: 56, font: boldFont, color: textColor });

        // Center the Role
        const internRoleText = postRole || "Intern";
        const internRoleWidth = boldFont.widthOfTextAtSize(internRoleText, 36);
        page.drawText(internRoleText, { x: center - (internRoleWidth / 2), y: 565, size: 36, font: boldFont, color: textColor });

        // From and To Dates (Y synced to 477)
        page.drawText(formatDt(startDate), { x: 727, y: 477, size: 32, font: boldFont, color: textColor });
        page.drawText(formatDt(endDate), { x: 1296, y: 477, size: 32, font: boldFont, color: textColor });
        break;

      case 'DONOR':
        page.drawText(formatDt(submission.createdAt), { x: 250, y: 920, size: 28, color: textColor });
        page.drawText(applicantName || "Unknown Name", { x: 800, y: 720, size: 56, color: textColor });
        const donationItems = submission.itemsDonated ? "Donation in Kind" : "Financial Support";
        page.drawText(donationItems, { x: 650, y: 580, size: 32, color: textColor });
        break;

      case 'HOST':
        page.drawText(formatDt(submission.createdAt), { x: 200, y: 1020, size: 28, color: textColor });
        page.drawText(applicantName || "Unknown Name", { x: 1000, y: 880, size: 48, color: textColor });
        page.drawText(submission.facilityLocation || "Our Center", { x: 800, y: 740, size: 36, color: textColor });
        break;

      case 'VISITOR':
        page.drawText(applicantName || "Unknown Name", { x: 1050, y: 900, size: 48, color: textColor });
        page.drawText(submission.facilityLocation || "Our Center", { x: 950, y: 760, size: 36, color: textColor });
        break;
    }

    // 5. Save and convert to Buffer
    const pdfBytes = await pdfDoc.save();
    const pdfBuffer = Buffer.from(pdfBytes);

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${applicantName}_Certificate.pdf"`,
      },
    });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("PDF Generation Error:", error);
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}