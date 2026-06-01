import { NextResponse } from 'next/server';
import { prisma } from '@/db/prisma';
import { PDFDocument, rgb, StandardFonts, PDFFont } from 'pdf-lib';
import fs from 'fs/promises';
import path from 'path';
import { google } from 'googleapis';
import { Readable } from 'stream';
import nodemailer from 'nodemailer';

// --- GOOGLE DRIVE UPLOAD (OAUTH2) ---
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

// --- TEXT WRAPPING UTILITY ---
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

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, options } = body;

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

    // 2. Load Template
    const templatePath = path.join(process.cwd(), 'public', 'templates', fileName);
    const templateBytes = await fs.readFile(templatePath);

    // 3. Initialize PDF
    const pdfDoc = await PDFDocument.create();
    const bgImage = await pdfDoc.embedPng(templateBytes);
    const page = pdfDoc.addPage([bgImage.width, bgImage.height]);
    page.drawImage(bgImage, { x: 0, y: 0, width: bgImage.width, height: bgImage.height });

    // 4. Embed Bold Font & Prepare Text Data
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const { applicantName, postRole, startDate, endDate } = submission;
    const textColor = rgb(0.1, 0.1, 0.1);
    
    const formatDt = (dt: Date | null) => dt ? new Date(dt).toLocaleDateString('en-IN') : 'N/A';
    const generationDate = new Date().toLocaleDateString('en-IN');
    const center = 1000; 
    const rightMarginX = 1850; 

    switch (typeKey) {
      case 'VOLUNTEER':
        page.drawText(generationDate, { x: 160, y: 1137, size: 28, font: boldFont, color: textColor });
        const volNameText = applicantName || "Unknown Name";
        const volNameWidth = boldFont.widthOfTextAtSize(volNameText, 56);
        page.drawText(volNameText, { x: center - (volNameWidth / 2), y: 787, size: 56, font: boldFont, color: textColor });
        const volRoleText = postRole || "Volunteer";
        const volRoleWidth = boldFont.widthOfTextAtSize(volRoleText, 36);
        page.drawText(volRoleText, { x: center - (volRoleWidth / 2), y: 532, size: 36, font: boldFont, color: textColor });
        page.drawText(formatDt(startDate), { x: 554, y: 427, size: 32, font: boldFont, color: textColor });
        page.drawText(formatDt(endDate), { x: 1205, y: 427, size: 32, font: boldFont, color: textColor });
        break;

      case 'INTERN':
        page.drawText(generationDate, { x: 182, y: 870, size: 28, font: boldFont, color: textColor });
        const internNameText = applicantName || "Unknown Name";
        const internNameWidth = boldFont.widthOfTextAtSize(internNameText, 56);
        page.drawText(internNameText, { x: center - (internNameWidth / 2), y: 773, size: 56, font: boldFont, color: textColor });
        const internRoleText = postRole || "Intern";
        const internRoleWidth = boldFont.widthOfTextAtSize(internRoleText, 36);
        page.drawText(internRoleText, { x: center - (internRoleWidth / 2), y: 565, size: 36, font: boldFont, color: textColor });
        page.drawText(formatDt(startDate), { x: 727, y: 477, size: 32, font: boldFont, color: textColor });
        page.drawText(formatDt(endDate), { x: 1296, y: 477, size: 32, font: boldFont, color: textColor });
        break;

      case 'VISITOR':
        page.drawText(generationDate, { x: 291, y: 1108, size: 28, font: boldFont, color: textColor });
        
        const visName = applicantName || "Unknown Name";
        const visNameWidth = boldFont.widthOfTextAtSize(visName, 48);
        const nameLineCenter = 1165 + ((rightMarginX - 1165) / 2);
        page.drawText(visName, { x: nameLineCenter - (visNameWidth / 2), y: 935, size: 48, font: boldFont, color: textColor });

        const visitDateStr = formatDt(submission.visitDate);
        const facilityStr = submission.centerVisited || "Our Center";
        const centerAndDate = `${facilityStr.toUpperCase()} ON ${visitDateStr}`;
        const centerDateWidth = boldFont.widthOfTextAtSize(centerAndDate, 38);
        const facilityLineCenter = 468 + ((rightMarginX - 468) / 2);
        page.drawText(centerAndDate, { x: facilityLineCenter - (centerDateWidth / 2), y: 830, size: 38, font: boldFont, color: textColor });

        let donationStr = "N/A";
        const items = submission.itemsDonated as { item: string, quantity: number }[] | null;
        
        if (items && items.length > 0) {
            donationStr = options?.includeQuantity 
                ? items.map(i => `${i.item} x${i.quantity}`).join(', ')
                : items.map(i => i.item).join(', ');
        } else if (submission.helpedFinancially) {
            donationStr = `Financial Support (Rs. ${submission.financialAmount})`;
        }
        
        const donMaxWidth = 750; 
        const donLineCenter = 1133 + ((rightMarginX - 1133) / 2);
        const donationLines = wrapText(donationStr, donMaxWidth, boldFont, 38);
        
        let startY = 616;
        donationLines.forEach((line) => {
            const lineWidth = boldFont.widthOfTextAtSize(line, 38);
            page.drawText(line, { x: donLineCenter - (lineWidth / 2), y: startY, size: 38, font: boldFont, color: textColor });
            startY -= 45; 
        });
        break;

      case 'DONOR':
        page.drawText(formatDt(submission.createdAt), { x: 250, y: 920, size: 28, font: boldFont, color: textColor });

        const donorNameText = applicantName || "Unknown Name";
        const donorNameWidth = boldFont.widthOfTextAtSize(donorNameText, 64);
        const donorNameLineCenter = 496 + ((rightMarginX - 496) / 2);
        page.drawText(donorNameText, { x: donorNameLineCenter - (donorNameWidth / 2), y: 769, size: 64, font: boldFont, color: textColor });

        let donorDonationStr = "N/A";
        const donorItems = submission.itemsDonated as { item: string, quantity: number }[] | null;
        
        if (donorItems && donorItems.length > 0) {
            donorDonationStr = options?.includeQuantity 
                ? donorItems.map(i => `${i.item} x${i.quantity}`).join(', ')
                : donorItems.map(i => i.item).join(', ');
        } else if (submission.helpedFinancially) {
            donorDonationStr = `Financial Support (Rs. ${submission.financialAmount})`;
        }
        
        const donorDonMaxWidth = rightMarginX - 658; 
        const donorDonLineCenter = 658 + (donorDonMaxWidth / 2);
        const donorDonationLines = wrapText(donorDonationStr, donorDonMaxWidth - 40, boldFont, 38);
        
        let donorStartY = 637;
        donorDonationLines.forEach((line) => {
            const lineWidth = boldFont.widthOfTextAtSize(line, 38);
            page.drawText(line, { x: donorDonLineCenter - (lineWidth / 2), y: donorStartY, size: 38, font: boldFont, color: textColor });
            donorStartY -= 45; 
        });
        break;

      case 'HOST':
        const hostDate = submission.visitDate || submission.startDate || submission.createdAt;
        page.drawText(formatDt(hostDate), { x: 158, y: 1092, size: 34, font: boldFont, color: textColor });

        const hostName = applicantName || "Unknown Name";
        const hostNameWidth = boldFont.widthOfTextAtSize(hostName, 48);
        const hostNameLineCenter = 1064 + ((rightMarginX - 1064) / 2);
        page.drawText(hostName, { x: hostNameLineCenter - (hostNameWidth / 2), y: 898, size: 48, font: boldFont, color: textColor });

        const hostFacilityStr = (submission.facilityLocation || "Our Center").toUpperCase();
        const hostFacWidth = boldFont.widthOfTextAtSize(hostFacilityStr, 38);
        const hostFacLineCenter = 791 + ((rightMarginX - 791) / 2);
        page.drawText(hostFacilityStr, { x: hostFacLineCenter - (hostFacWidth / 2), y: 786, size: 38, font: boldFont, color: textColor });

        let hostDonationStr = "N/A";
        const hostItems = submission.itemsDonated as { item: string, quantity: number }[] | null;
        
        if (hostItems && hostItems.length > 0) {
            hostDonationStr = options?.includeQuantity 
                ? hostItems.map(i => `${i.item} x${i.quantity}`).join(', ')
                : hostItems.map(i => i.item).join(', ');
        } else if (submission.helpedFinancially) {
            hostDonationStr = `Financial Support (Rs. ${submission.financialAmount})`;
        }
        
        const hostDonMaxWidth = rightMarginX - 1129; 
        const hostDonLineCenter = 1129 + (hostDonMaxWidth / 2);
        const hostDonationLines = wrapText(hostDonationStr, hostDonMaxWidth - 20, boldFont, 38);
        
        let hostStartY = 580;
        hostDonationLines.forEach((line) => {
            const lineWidth = boldFont.widthOfTextAtSize(line, 38);
            page.drawText(line, { x: hostDonLineCenter - (lineWidth / 2), y: hostStartY, size: 38, font: boldFont, color: textColor });
            hostStartY -= 45; 
        });
        break;
    }

    // 5. Save Buffer
    const pdfBytes = await pdfDoc.save();
    const pdfBuffer = Buffer.from(pdfBytes);
    const safeName = applicantName ? applicantName.replace(/\s+/g, '_') : "Unknown";
    const finalFileName = `${typeKey}_${safeName}.pdf`;

    // --- EXECUTE DRIVE UPLOAD ---
    if (options?.saveToDrive) {
        try {
            await uploadToDrive(pdfBuffer, finalFileName);
            console.log(`Successfully uploaded ${finalFileName} to Google Drive.`);
        } catch (uploadError) {
            console.error("Google Drive Upload Failed:", uploadError);
        }
    }

    // --- EXECUTE EMAIL DELIVERY ---
    if (options?.sendEmail && options?.targetEmail) {
        try {
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS,
                },
            });

            // Format raw typeKey (e.g., 'VOLUNTEER' -> 'Volunteer')
            const displayActivity = submission.certificateType 
                ? submission.certificateType.charAt(0).toUpperCase() + submission.certificateType.slice(1).toLowerCase() 
                : "Contribution";

            const emailHtml = `
              <div style="font-family: 'Comic Sans MS', 'Comic Sans', cursive; font-size: 14px; line-height: 1.6; color: #105691;">
                <p>Dear <strong>${applicantName || 'Recipient'}</strong>,</p>
                
                <p>On behalf of the entire team at <strong>Save The Girl</strong>, we want to express our deepest gratitude for your recent association with us.</p>
                
                <p>Every hand that helps and every heart that gives brings us closer to a safer, brighter future for the girls we support. We are incredibly grateful for your time, generosity, and dedication.</p>
                
                <p>In recognition of your support, we are pleased to share your official certificate for your <strong>${displayActivity}</strong>.</p>
                
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
                subject: `Thank you from Save The Girl! 🌸 Your Certificate of ${displayActivity} Inside`,
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