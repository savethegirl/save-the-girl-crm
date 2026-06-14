/* eslint-disable @typescript-eslint/no-explicit-any */

import { prisma } from "@/db/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, Mail, Phone, Calendar, MapPin, Building, Briefcase, 
  UserCircle, Link as LinkIcon, Baby, Users, FileText, CheckCircle, 
  Clock, Map, HeartHandshake, Image as ImageIcon, Star, Check, Copy 
} from "lucide-react";
import SubmissionControls from "@/modules/submissions/SubmissionControls";

export const dynamic = 'force-dynamic';

// --- HELPER  ---
const DetailItem = ({ icon: Icon, label, value }: { icon: any, label: string, value: any }) => {
  if (value === null || value === undefined || value === '') return null;
  if (Array.isArray(value) && value.length === 0) return null;
  if (typeof value === 'boolean' && !value) return null;

  return (
    <div className="space-y-1.5 p-4 bg-slate-50 border border-slate-100 rounded-lg">
      <span className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
        <Icon className="h-4 w-4 text-blue-500" />
        {label}
      </span>
      <div className="text-slate-900 font-medium">
        {typeof value === 'boolean' ? 'Yes' : value}
      </div>
    </div>
  );
};

export default async function SubmissionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const submissionId = resolvedParams.id;

  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
  });

  if (!submission) return notFound(); 

  const itemsDonated = submission.itemsDonated as { item: string, quantity: number }[] | null;
  const socialLinks = submission.socialLinks as Record<string, string> | null;
  const formatDate = (date: Date | null) => date ? new Date(date).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : null;

  // --- THE COPY URL ---
  const routeMap: Record<string, string> = {
    'DONOR': '/donation',
    'HOST': '/host',
    'VISITOR': '/visitor',
    'INTERN': '/internship',
    'VOLUNTEER': '/volunteer'
  };
  const targetRoute = routeMap[submission.certificateType] || '/';
  
  const queryParams = new URLSearchParams();
  if (submission.applicantName) queryParams.set('name', submission.applicantName);
  if (submission.emails?.[0]) queryParams.set('email', submission.emails[0]);
  if (submission.phones?.[0]) queryParams.set('phone', submission.phones[0]);
  if (submission.gender) queryParams.set('gender', submission.gender);
  if (submission.universityName) queryParams.set('university', submission.universityName);
  
  if (submission.facilityLocation) queryParams.set('address', submission.facilityLocation);
  if (socialLinks?.facebook) queryParams.set('facebook', socialLinks.facebook);
  if (socialLinks?.instagram) queryParams.set('instagram', socialLinks.instagram);
  if (socialLinks?.linkedin) queryParams.set('linkedin', socialLinks.linkedin);
  if (socialLinks?.twitter) queryParams.set('twitter', socialLinks.twitter);

  if (itemsDonated && itemsDonated.length > 0) {
    queryParams.set('items', JSON.stringify(itemsDonated));
  }
  // ----------------------------

  const copyUrl = `${targetRoute}?${queryParams.toString()}`;

  return (
    <div className="min-h-screen bg-slate-100 p-6 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/" className="flex items-center text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm w-fit">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>

            {submission.lastSentEmail && (
              <div className="flex items-center gap-1.5 px-3 py-2 bg-green-50 border border-green-200 text-green-700 text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm">
                <Check className="h-4 w-4" />
                Last Sent: {new Date(submission.lastSentEmail).toLocaleString('en-IN', {
                  day: '2-digit', month: 'short', year: 'numeric',
                  hour: '2-digit', minute: '2-digit'
                })}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link href={copyUrl} className="flex items-center gap-2 px-4 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-md text-xs font-black uppercase tracking-widest shadow-sm transition-colors">
              <Copy className="h-3.5 w-3.5" />
              Copy Record
            </Link>

            <span className={`px-4 py-1.5 rounded-md text-xs font-black uppercase tracking-widest shadow-sm ${
              submission.status === 'APPROVED' ? 'bg-green-100 text-green-700 border border-green-200' :
              submission.status === 'REJECTED' ? 'bg-red-100 text-red-700 border border-red-200' :
              'bg-amber-100 text-amber-700 border border-amber-200'
            }`}>
              {submission.status}
            </span>
            <span className="px-4 py-1.5 bg-slate-800 text-white border border-slate-700 rounded-md text-xs font-black uppercase tracking-widest shadow-sm">
              {submission.certificateType}
            </span>
          </div>
        </div>

        <SubmissionControls 
          id={submission.id} 
          currentStatus={submission.status} 
          applicantName={submission.applicantName}
          certificateType={submission.certificateType}
          applicantEmail={submission.emails?.[0]} 
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Identity & Contact */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="h-16 w-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
                <UserCircle className="h-8 w-8" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-1">{submission.applicantName}</h1>
              <p className="text-sm text-slate-500 mb-6 flex items-center gap-2">
                <Calendar className="h-4 w-4" /> Submitted {formatDate(submission.createdAt)}
              </p>

              <div className="space-y-4">
                {submission.phones.length > 0 && (
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Phone Numbers</span>
                    {submission.phones.map((phone, i) => (
                      <a key={i} href={`tel:${phone}`} className="flex items-center gap-2 text-slate-700 hover:text-blue-600 font-medium py-1">
                        <Phone className="h-4 w-4 text-slate-400" /> {phone}
                      </a>
                    ))}
                  </div>
                )}
                
                {submission.emails.length > 0 && (
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Email Addresses</span>
                    {submission.emails.map((email, i) => (
                      <a key={i} href={`mailto:${email}`} className="flex items-center gap-2 text-slate-700 hover:text-blue-600 font-medium py-1 break-all">
                        <Mail className="h-4 w-4 text-slate-400" /> {email}
                      </a>
                    ))}
                  </div>
                )}

                {socialLinks && Object.keys(socialLinks).length > 0 && (
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Social Profiles</span>
                    {Object.entries(socialLinks).map(([platform, url], i) => (
                      <a key={i} href={url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-blue-600 hover:underline font-medium py-1 capitalize">
                        <LinkIcon className="h-4 w-4" /> {platform}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {submission.helpedFinancially && (
              <div className="bg-linear-to-br from-green-50 to-emerald-50 rounded-xl shadow-sm border border-green-200 p-6">
                <h3 className="text-sm font-bold text-green-800 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <HeartHandshake className="h-5 w-5" /> Financial Contribution
                </h3>
                <p className="text-3xl font-black text-green-700">₹{submission.financialAmount?.toLocaleString()}</p>
                {submission.donationType && <p className="text-green-600 text-sm font-medium mt-1">Via {submission.donationType}</p>}
              </div>
            )}
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4 border-b pb-2">Engagement Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <DetailItem icon={Briefcase} label="Post / Role" value={submission.postRole} />
                <DetailItem icon={Building} label="University Name" value={submission.universityName} />
                <DetailItem icon={CheckCircle} label="Univ. Requirement" value={submission.isUniversityRequirement} />
                <DetailItem icon={MapPin} label="Center Visited" value={submission.centerVisited} />
                <DetailItem icon={Map} label={submission.certificateType === 'VISITOR' ? 'Address' : 'Facility Location'} value={submission.facilityLocation} />
                <DetailItem icon={UserCircle} label="Attendant Name" value={submission.attendantName} />
                <DetailItem icon={Users} label="Company Coordinator" value={submission.companyCoordinator} />
                <DetailItem icon={Baby} label="No. of Children" value={submission.noOfChildren} />
                <DetailItem icon={FileText} label="Purpose of Visit" value={submission.purposeOfVisit} />
                <DetailItem icon={Star} label="Rating" value={submission.rating ? `${submission.rating} / 5` : null} />
                <DetailItem icon={UserCircle} label="Gender" value={submission.gender} />
                <DetailItem icon={Users} label="Mode" value={submission.mode} />
                <DetailItem icon={Clock} label="Schedule Type" value={submission.scheduleType} />
                <DetailItem icon={Calendar} label="Start Date" value={formatDate(submission.startDate)} />
                <DetailItem icon={Calendar} label="End Date" value={formatDate(submission.endDate)} />
                <DetailItem icon={Calendar} label="Visit Date" value={formatDate(submission.visitDate)} />
                <DetailItem icon={Calendar} label="Event Date" value={formatDate(submission.eventDate)} />
                <DetailItem icon={Calendar} label="Next Visit Exp." value={formatDate(submission.nextExpectedVisit)} />
                <DetailItem icon={Calendar} label="Follow-up Due" value={formatDate(submission.nextFollowUpDue)} />
              </div>

              {submission.caretakers && submission.caretakers.length > 0 && (
                <div className="mt-4 p-4 bg-slate-50 border border-slate-100 rounded-lg">
                  <span className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    <Users className="h-4 w-4 text-blue-500" /> Caretakers Present
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {submission.caretakers.map((c, i) => (
                      <span key={i} className="px-3 py-1 bg-white border border-slate-200 text-slate-700 rounded-md text-sm font-medium shadow-sm">{c}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {itemsDonated && itemsDonated.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-lg font-bold text-slate-900 mb-4 border-b pb-2">Inventory Donated</h2>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {itemsDonated.map((entry, i) => (
                    <li key={i} className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <span className="font-semibold text-slate-700">{entry.item}</span>
                      <span className="text-slate-600 bg-white px-3 py-1 rounded-md shadow-sm border border-slate-200 font-mono text-sm">Qty: {entry.quantity}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {(submission.additionalRemarks || submission.futurePartnershipRemarks || submission.uploadPhotosLink || submission.reportUploadLink) && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
                <h2 className="text-lg font-bold text-slate-900 border-b pb-2">Documents & Remarks</h2>
                {(submission.uploadPhotosLink || submission.reportUploadLink) && (
                  <div className="flex flex-wrap gap-4">
                    {submission.uploadPhotosLink && (
                      <a href={submission.uploadPhotosLink} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg font-medium transition-colors border border-blue-200">
                        <ImageIcon className="h-5 w-5" /> View Uploaded Photos
                      </a>
                    )}
                    {submission.reportUploadLink && (
                      <a href={submission.reportUploadLink} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg font-medium transition-colors border border-indigo-200">
                        <FileText className="h-5 w-5" /> View Attached Report
                      </a>
                    )}
                  </div>
                )}

                <div className="space-y-4">
                  {submission.additionalRemarks && (
                    <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-lg">
                      <span className="text-xs font-bold text-amber-800 uppercase tracking-wider block mb-1">General Remarks</span>
                      <p className="text-slate-700 whitespace-pre-wrap text-sm leading-relaxed">{submission.additionalRemarks}</p>
                    </div>
                  )}
                  {submission.futurePartnershipRemarks && (
                    <div className="p-4 bg-purple-50/50 border border-purple-100 rounded-lg">
                      <span className="text-xs font-bold text-purple-800 uppercase tracking-wider block mb-1">Future Partnership Notes</span>
                      <p className="text-slate-700 whitespace-pre-wrap text-sm leading-relaxed">{submission.futurePartnershipRemarks}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}