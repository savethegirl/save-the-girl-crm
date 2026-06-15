import { NextResponse } from 'next/server';
import { prisma } from '@/db/prisma';
import { PDFDocument, rgb, StandardFonts, PDFFont } from 'pdf-lib';
import fs from 'fs/promises';
import path from 'path';
import { google } from 'googleapis';
import { Readable } from 'stream';
import nodemailer from 'nodemailer';
import { revalidatePath } from "next/cache";

// --- GOOGLE DRIVE UPLOAD ---
async function uploadToDrive(pdfBuffer: Buffer, fileName: string) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    "https://developers.google.com/oauthplayground"
  );

  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN
  });

  const drive = google.drive({ version: 'v3', auth: oauth2Client });

  const fileMetadata = {
    name: fileName,
    parents: [process.env.GOOGLE_DRIVE_FOLDER_ID!],
  };

  const media = {
    mimeType: 'application/pdf',
    body: Readable.from(pdfBuffer),
  };

  const response = await drive.files.create({
    requestBody: fileMetadata,
    media: media,
    fields: 'id, webViewLink',
  });

  return response.data;
}

// --- TEXT WRAPPING ---
function wrapText(text: string, maxWidth: number, font: PDFFont, fontSize: number): string[] {
  const words = text.split(' ');
  // eslint-disable-next-line prefer-const
  let lines: string[] = [];
  let currentLine = words[0] || '';

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = font.widthOfTextAtSize(currentLine + ' ' + word, fontSize);
    if (width < maxWidth) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  lines.push(currentLine);
  return lines;
}

// --- DYNAMIC FONT SCALING ---
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function drawScaledCenteredText(page: any, text: string, font: PDFFont, defaultSize: number, maxWidth: number, centerX: number, yPos: number, color: any) {
  let currentSize = defaultSize;
  let textWidth = font.widthOfTextAtSize(text, currentSize);

  // Shrink font size proportionally if it exceeds the line width
  if (textWidth > maxWidth) {
    currentSize = (maxWidth / textWidth) * defaultSize;
    textWidth = font.widthOfTextAtSize(text, currentSize);
  }

  const startX = centerX - (textWidth / 2);
  
  page.drawText(text, { 
    x: startX, 
    y: yPos, 
    size: currentSize, 
    font: font, 
    color: color 
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, options } = body;

    if (!id) return NextResponse.json({ error: "Missing Submission ID" }, { status: 400 });

    const submission = await prisma.submission.findUnique({ where: { id } });
    if (!submission) return NextResponse.json({ error: "Submission not found" }, { status: 404 });

    // Dynamic Template Routing
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

    // Load Template
    const templatePath = path.join(process.cwd(), 'public', 'templates', fileName);
    const templateBytes = await fs.readFile(templatePath);

    // Initialize PDF
    const pdfDoc = await PDFDocument.create();
    const bgImage = await pdfDoc.embedPng(templateBytes);
    const page = pdfDoc.addPage([bgImage.width, bgImage.height]);
    page.drawImage(bgImage, { x: 0, y: 0, width: bgImage.width, height: bgImage.height });

    // Embed Bold Font & Prepare Text Data
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const { applicantName, postRole, startDate, endDate } = submission;
    
    const pdfDisplayName = (applicantName || "Unknown Name").toUpperCase();

    const textColor = rgb(0.1, 0.1, 0.1);
    
    const paddedId = String(submission.serialNumber).padStart(7, '0');
    const refNumber = `STG/CMS/${paddedId}`;
    const refFontSize = 24; 
    // --------------------------------------------

    const formatDt = (dt: Date | null) => dt ? new Date(dt).toLocaleDateString('en-IN') : 'N/A';
    const generationDate = new Date().toLocaleDateString('en-IN');
    const center = 1030; 
    const rightMarginX = 1850; 

    switch (typeKey) {
      case 'VOLUNTEER':
        page.drawText(generationDate, { x: 160, y: 1137, size: 28, font: boldFont, color: textColor });
        drawScaledCenteredText(page, pdfDisplayName, boldFont, 56, 775, center, 770, textColor);
        
        page.drawText(refNumber, { x: 1380, y: 1137, size: refFontSize, font: boldFont, color: textColor });
        
        const volRoleText = postRole || "Volunteer";
        const volRoleWidth = boldFont.widthOfTextAtSize(volRoleText, 36);
        page.drawText(volRoleText, { x: center - (volRoleWidth / 2), y: 532, size: 36, font: boldFont, color: textColor });
        page.drawText(formatDt(startDate), { x: 554, y: 427, size: 32, font: boldFont, color: textColor });
        page.drawText(formatDt(endDate), { x: 1205, y: 427, size: 32, font: boldFont, color: textColor });
        break;

      case 'INTERN':
        page.drawText(generationDate, { x: 182, y: 870, size: 28, font: boldFont, color: textColor });
        drawScaledCenteredText(page, pdfDisplayName, boldFont, 56, 1200, center, 773, textColor);
        
        page.drawText(refNumber, { x: 1600, y: 870, size: refFontSize, font: boldFont, color: textColor });

        const internRoleText = postRole || "Intern";
        const internRoleWidth = boldFont.widthOfTextAtSize(internRoleText, 36);
        page.drawText(internRoleText, { x: center - (internRoleWidth / 2), y: 565, size: 36, font: boldFont, color: textColor });
        page.drawText(formatDt(startDate), { x: 727, y: 477, size: 32, font: boldFont, color: textColor });
        page.drawText(formatDt(endDate), { x: 1296, y: 477, size: 32, font: boldFont, color: textColor });
        break;

      case 'VISITOR':
        const visNameLineStartX = 1080; 
        const visNameLineEndX = 1750;
        const visNameMaxWidth = visNameLineEndX - visNameLineStartX;
        const visNameLineCenter = visNameLineStartX + (visNameMaxWidth / 2);
        
        drawScaledCenteredText(page, pdfDisplayName, boldFont, 48, visNameMaxWidth, visNameLineCenter, 910, textColor);

        page.drawText(refNumber, { x: 150, y: 1100, size: refFontSize, font: boldFont, color: textColor });

        const visitDateStr = formatDt(submission.visitDate);
        const facilityStr = submission.centerVisited || "Our Center";
        
        const centerAndDate = `${facilityStr.toUpperCase()}   |   ${visitDateStr}`;
        
        const facilityLineStartX = 400;
        const facilityLineEndX = 1550;
        const facilityMaxWidth = facilityLineEndX - facilityLineStartX;
        const facilityLineCenter = facilityLineStartX + (facilityMaxWidth / 2);
        
        drawScaledCenteredText(page, centerAndDate, boldFont, 38, facilityMaxWidth, facilityLineCenter, 820, textColor);

        let visDonationStr = "N/A";
        const visItems = submission.itemsDonated as { item: string, quantity: number }[] | null;
        
        if (visItems && visItems.length > 0) {
            visDonationStr = options?.includeQuantity 
                ? visItems.map(i => `${i.item.toUpperCase()} x${i.quantity}`).join(', ')
                : visItems.map(i => i.item.toUpperCase()).join(', ');
        } else if (submission.helpedFinancially) {
            visDonationStr = `Financial Support (Rs. ${submission.financialAmount})`;
        }
        
        const visDonLineStartX = 1100; 
        const visDonLineEndX = 1780; 
        const visDonMaxWidth = visDonLineEndX - visDonLineStartX; 
        const visDonLineCenterItems = visDonLineStartX + (visDonMaxWidth / 2); 
        const visBaselineY = 610; 
        
        const visMaxItemFontSize = 38;
        const visWrapItemFontSize = 28;
        const visWidthAtMaxSize = boldFont.widthOfTextAtSize(visDonationStr, visMaxItemFontSize);
        
        if (visWidthAtMaxSize <= visDonMaxWidth) {
            page.drawText(visDonationStr, {
                x: visDonLineCenterItems - (visWidthAtMaxSize / 2),
                y: visBaselineY,
                size: visMaxItemFontSize,
                font: boldFont,
                color: textColor
            });
        } else {
            const visDonationLines = wrapText(visDonationStr, visDonMaxWidth, boldFont, visWrapItemFontSize);
            const visLineHeight = 35; 
            let currentY = visBaselineY + ((visDonationLines.length - 1) * visLineHeight);
            
            visDonationLines.forEach((line) => {
                const lineWidth = boldFont.widthOfTextAtSize(line, visWrapItemFontSize);
                page.drawText(line, { 
                    x: visDonLineCenterItems - (lineWidth / 2), 
                    y: currentY, 
                    size: visWrapItemFontSize, 
                    font: boldFont, 
                    color: textColor 
                });
                currentY -= visLineHeight; 
            });
        }
        break;
      
      case 'DONOR':
        const donorDateStr = formatDt(submission.createdAt);
        drawScaledCenteredText(page, donorDateStr, boldFont, 28, 260, 370, 1000, textColor);

        drawScaledCenteredText(page, pdfDisplayName, boldFont, 64, 1200, 1075, 755, textColor);

        page.drawText(refNumber, { x: 1600, y: 1000, size: refFontSize, font: boldFont, color: textColor });

        let donorDonationStr = "N/A";
        const donorItems = submission.itemsDonated as { item: string, quantity: number }[] | null;
        
        if (donorItems && donorItems.length > 0) {
            donorDonationStr = options?.includeQuantity 
                ? donorItems.map(i => `${i.item.toUpperCase()} x${i.quantity}`).join(', ')
                : donorItems.map(i => i.item.toUpperCase()).join(', ');
        } else if (submission.helpedFinancially) {
            donorDonationStr = `Financial Support (Rs. ${submission.financialAmount})`;
        }
        
        const donorDonLineStartX = 680; 
        const donorDonLineEndX = 1700; 
        const donorDonMaxWidth = donorDonLineEndX - donorDonLineStartX; 
        const donorDonLineCenterItems = donorDonLineStartX + (donorDonMaxWidth / 2); 
        const baselineY = 630; 
        
        const maxItemFontSize = 38; 
        const wrapItemFontSize = 28; 
        
        const widthAtMaxSize = boldFont.widthOfTextAtSize(donorDonationStr, maxItemFontSize);
        
        if (widthAtMaxSize <= donorDonMaxWidth) {
            page.drawText(donorDonationStr, {
                x: donorDonLineCenterItems - (widthAtMaxSize / 2),
                y: baselineY,
                size: maxItemFontSize,
                font: boldFont,
                color: textColor
            });
        } else {
            const donorDonationLines = wrapText(donorDonationStr, donorDonMaxWidth, boldFont, wrapItemFontSize);
            const lineHeight = 35; 
            let currentY = baselineY + ((donorDonationLines.length - 1) * lineHeight);
            
            donorDonationLines.forEach((line) => {
                const lineWidth = boldFont.widthOfTextAtSize(line, wrapItemFontSize);
                page.drawText(line, { 
                    x: donorDonLineCenterItems - (lineWidth / 2), 
                    y: currentY, 
                    size: wrapItemFontSize, 
                    font: boldFont, 
                    color: textColor 
                });
                currentY -= lineHeight; 
            });
        }
        break;
        
      case 'HOST':
        const hostDate = submission.visitDate || submission.startDate || submission.createdAt;
        page.drawText(formatDt(hostDate), { x: 158, y: 1050, size: 34, font: boldFont, color: textColor });

        const hostNameLineCenter = 1064 + ((rightMarginX - 1064) / 2);
        drawScaledCenteredText(page, pdfDisplayName, boldFont, 48, 750, hostNameLineCenter, 872, textColor);

        page.drawText(refNumber, { x: 1390, y: 1050, size: refFontSize, font: boldFont, color: textColor });

        const hostFacilityStr = (submission.facilityLocation || "Our Center").toUpperCase();
        const hostFacWidth = boldFont.widthOfTextAtSize(hostFacilityStr, 38);
        const hostFacLineCenter = 791 + ((rightMarginX - 791) / 2);
        page.drawText(hostFacilityStr, { x: hostFacLineCenter - (hostFacWidth / 2), y: 760, size: 38, font: boldFont, color: textColor });

        let hostDonationStr = "N/A";
        const hostItems = submission.itemsDonated as { item: string, quantity: number }[] | null;
        
        if (hostItems && hostItems.length > 0) {
            hostDonationStr = options?.includeQuantity 
                ? hostItems.map(i => `${i.item.toUpperCase()} x${i.quantity}`).join(', ')
                : hostItems.map(i => i.item.toUpperCase()).join(', ');
        } else if (submission.helpedFinancially) {
            hostDonationStr = `Financial Support (Rs. ${submission.financialAmount})`;
        }
        
        const hostDonLineStartX = 1129; 
        const hostDonLineEndX = 1800; 
        const hostDonMaxWidth = hostDonLineEndX - hostDonLineStartX; 
        const hostDonLineCenterItems = hostDonLineStartX + (hostDonMaxWidth / 2); 
        const hostBaselineY = 555; 
        
        const hostMaxItemFontSize = 38;
        const hostWrapItemFontSize = 28;
        
        const hostWidthAtMaxSize = boldFont.widthOfTextAtSize(hostDonationStr, hostMaxItemFontSize);
        
        if (hostWidthAtMaxSize <= hostDonMaxWidth) {
            page.drawText(hostDonationStr, {
                x: hostDonLineCenterItems - (hostWidthAtMaxSize / 2),
                y: hostBaselineY,
                size: hostMaxItemFontSize,
                font: boldFont,
                color: textColor
            });
        } else {
            const hostDonationLines = wrapText(hostDonationStr, hostDonMaxWidth, boldFont, hostWrapItemFontSize);
            const hostLineHeight = 35; 
            let currentY = hostBaselineY + ((hostDonationLines.length - 1) * hostLineHeight);
            
            hostDonationLines.forEach((line) => {
                const lineWidth = boldFont.widthOfTextAtSize(line, hostWrapItemFontSize);
                page.drawText(line, { 
                    x: hostDonLineCenterItems - (lineWidth / 2), 
                    y: currentY, 
                    size: hostWrapItemFontSize, 
                    font: boldFont, 
                    color: textColor 
                });
                currentY -= hostLineHeight; 
            });
        }
        break;
    }

    // Save Buffer
    const pdfBytes = await pdfDoc.save();
    const pdfBuffer = Buffer.from(pdfBytes);
    const safeName = applicantName ? applicantName.replace(/\s+/g, '_') : "Unknown";

    // --- FILE PREFIX MAPPER ---
    const filePrefixMap: Record<string, string> = {
        'DONOR': 'DONATION',
        'VISITOR': 'VISIT',
        'INTERN': 'INTERNSHIP',
        'VOLUNTEER': 'VOLUNTEER',
        'HOST': 'HOST'
    };
    const filePrefix = filePrefixMap[typeKey] || typeKey;
    const finalFileName = `${filePrefix}_${safeName}.pdf`;

    // --- EXECUTE DRIVE UPLOAD ---
    if (options?.saveToDrive) {
        try {
            await uploadToDrive(pdfBuffer, finalFileName);
            console.log(`Successfully uploaded ${finalFileName} to Google Drive.`);
        } catch (uploadError) {
            console.error("Google Drive Upload Failed:", uploadError);
        }
    }

    // --- EMAIL DELIVERY ---
    if (options?.sendEmail && options?.targetEmail) {
        try {
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS,
                },
            });

            // --- EMAIL DICTIONARY ---
            let emailDisplayActivity = "Contribution";
            let customSubject = "Thank you from Save The Girl! 🌸 Your Certificate Inside";

            switch (typeKey) {
                case 'DONOR':
                    emailDisplayActivity = "Donation";
                    customSubject = "Thank you from Save The Girl! 🌸 Your Certificate of Donation Inside";
                    break;
                case 'HOST':
                    emailDisplayActivity = "Hosting Partner";
                    customSubject = "Thank you from Save The Girl! 🌸 Your Certificate of Hosting Partner Inside";
                    break;
                case 'VISITOR':
                    emailDisplayActivity = "Visit";
                    customSubject = "Thank you from Save The Girl! 🌸 Your Certificate of Visit Inside";
                    break;
                case 'INTERN':
                    emailDisplayActivity = "Internship";
                    customSubject = "Thank you from Save The Girl! 🌸 Your Certificate of Internship Inside";
                    break;
                case 'VOLUNTEER':
                    emailDisplayActivity = "Volunteering";
                    customSubject = "Thank you from Save The Girl! 🌸 Your Certificate of Volunteering Inside";
                    break;
            }

            const emailHtml = `
                <div style="font-family: Arial, Helvetica, sans-serif; font-size: 15px; line-height: 1.6; color: #105691;">
                <p>Dear <strong>${applicantName || 'Recipient'}</strong>,</p>
                
                <p>On behalf of the entire team at <strong>Save The Girl</strong>, we want to express our deepest gratitude for your recent association with us.</p>
                
                <p>Every hand that helps and every heart that gives brings us closer to a safer, brighter future for the girls we support. We are incredibly grateful for your time, generosity, and dedication.</p>
                
                <p>In recognition of your support, we are pleased to share your official certificate for your <strong>${emailDisplayActivity}</strong>.</p>
                
                <p><strong>Want to multiply your impact?</strong> Please consider sharing your certificate on your social media channels and tagging <strong>@ngosavethegirl</strong>. Inspiring others to join our cause is one of the greatest gifts you can give us!</p>
                
                <p>Thank you once again for being a champion for change.</p>
                
                <p style="margin-bottom: 20px;">Warm regards,</p>
                
                <p style="margin-bottom: 0;"><strong>Save The Girl Team</strong></p>
                <p style="margin: 0;">+91-9990507028</p>
                <p style="margin: 0;"><a href="https://www.savegirl.org" style="color: #105691; text-decoration: underline;">www.savegirl.org</a></p>
                <p style="font-style: italic; font-size: 12px; margin-top: 12px; color: #555555;">if you want a better future then give a better present to a child</p>
              </div>
            `;
            
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const mailOptions: any = {
                from: process.env.EMAIL_USER,
                to: options.targetEmail, 
                replyTo: "info@savegirl.org", 
                subject: customSubject,
                html: emailHtml,
                attachments: [
                    {
                        filename: finalFileName,
                        content: pdfBuffer,
                        contentType: 'application/pdf',
                    }
                ]
            };

            // Dynamically attach the CC email if the user typed one in the frontend
            if (options.ccEmail) {
                mailOptions.cc = options.ccEmail;
            }

            await transporter.sendMail(mailOptions);
            console.log(`Successfully emailed certificate to ${options.targetEmail}`);

            try {
                await prisma.submission.update({
                    where: { id: id },
                    data: { lastSentEmail: new Date() }
                });
                revalidatePath(`/submissions/${id}`);
                console.log(`Successfully updated lastSentEmail for submission ${id}`);
            } catch (dbError) {
                console.error("Failed to update lastSentEmail in database:", dbError);
            }

        } catch (emailError) {
            console.error("Email Delivery Failed:", emailError);
        }
    }

    // --- FINAL RESPONSE ---
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${finalFileName}"`,
      },
    });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("PDF Generation Error:", error);
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}