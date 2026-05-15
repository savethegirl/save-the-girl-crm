/* eslint-disable @typescript-eslint/no-unused-vars */
import { prisma } from "@/db/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, User, Mail, Phone, Calendar, MapPin, Building, Briefcase } from "lucide-react";

// Next.js Server Component
export default async function SubmissionDetailPage({ params }: { params: { id: string } }) {
  // 1. Fetch directly from the database
  const submission = await prisma.submission.findUnique({
    where: { id: params.id },
  });

  if (!submission) {
    return notFound(); // Automatically throws a 404 page if the ID doesn't exist
  }

  // Parse JSON data safely
  const itemsDonated = submission.itemsDonated as { item: string, quantity: number }[] | null;
  const socialLinks = submission.socialLinks as Record<string, string> | null;

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Navigation & Header */}
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
          <div className="flex gap-3">
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              submission.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
              submission.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
              'bg-amber-100 text-amber-700'
            }`}>
              {submission.status}
            </span>
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wider">
              {submission.certificateType}
            </span>
          </div>
        </div>

        {/* Master Card */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          
          {/* Core Identity Section (Applies to everyone) */}
          <div className="p-6 border-b border-slate-200 bg-slate-50/50">
            <h1 className="text-3xl font-bold text-slate-900 mb-6">{submission.applicantName}</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Contact Info</h3>
                {submission.phones.length > 0 && (
                  <div className="flex items-start gap-3 text-slate-700">
                    <Phone className="h-5 w-5 text-slate-400 mt-0.5" />
                    <div>
                      {submission.phones.map((phone, i) => <div key={i}>{phone}</div>)}
                    </div>
                  </div>
                )}
                {submission.emails.length > 0 && (
                  <div className="flex items-start gap-3 text-slate-700">
                    <Mail className="h-5 w-5 text-slate-400 mt-0.5" />
                    <div>
                      {submission.emails.map((email, i) => <div key={i}>{email}</div>)}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Submission Meta</h3>
                <div className="flex items-center gap-3 text-slate-700">
                  <Calendar className="h-5 w-5 text-slate-400" />
                  <span>Submitted: {new Date(submission.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</span>
                </div>
              </div>
            </div>
          </div>

          {/* POLYMORPHIC SECTION: Conditionally render based on Type */}
          <div className="p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Specific Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

              {/* Intern & Volunteer Exclusive Data */}
              {(submission.certificateType === 'INTERN' || submission.certificateType === 'VOLUNTEER') && (
                <>
                  {submission.postRole && (
                    <div className="space-y-1">
                      <span className="text-sm text-slate-500 font-medium">Role / Position</span>
                      <p className="font-semibold text-slate-900 flex items-center gap-2"><Briefcase className="h-4 w-4 text-slate-400"/> {submission.postRole}</p>
                    </div>
                  )}
                  {submission.universityName && (
                    <div className="space-y-1">
                      <span className="text-sm text-slate-500 font-medium">University</span>
                      <p className="font-semibold text-slate-900 flex items-center gap-2"><Building className="h-4 w-4 text-slate-400"/> {submission.universityName}</p>
                    </div>
                  )}
                  {submission.scheduleType && (
                    <div className="space-y-1">
                      <span className="text-sm text-slate-500 font-medium">Schedule</span>
                      <p className="font-semibold text-slate-900">{submission.scheduleType}</p>
                    </div>
                  )}
                </>
              )}

              {/* Host & Visitor Exclusive Data */}
              {(submission.certificateType === 'HOST' || submission.certificateType === 'VISITOR') && (
                <>
                  {submission.centerVisited && (
                    <div className="space-y-1">
                      <span className="text-sm text-slate-500 font-medium">Center Visited</span>
                      <p className="font-semibold text-slate-900 flex items-center gap-2"><MapPin className="h-4 w-4 text-slate-400"/> {submission.centerVisited}</p>
                    </div>
                  )}
                  {submission.eventDate && (
                    <div className="space-y-1">
                      <span className="text-sm text-slate-500 font-medium">Event Date</span>
                      <p className="font-semibold text-slate-900">{new Date(submission.eventDate).toLocaleDateString()}</p>
                    </div>
                  )}
                  {submission.caretakers.length > 0 && (
                    <div className="space-y-1 md:col-span-2">
                      <span className="text-sm text-slate-500 font-medium">Caretakers Present</span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {submission.caretakers.map((c, i) => (
                          <span key={i} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-md text-sm">{c}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Inventory/Donation Data (Applies to Donors, Hosts, Visitors) */}
              {itemsDonated && itemsDonated.length > 0 && (
                <div className="space-y-2 md:col-span-2 mt-4">
                  <span className="text-sm text-slate-500 font-medium block border-b pb-2">Inventory Donated</span>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                    {itemsDonated.map((entry, i) => (
                      <li key={i} className="flex justify-between items-center bg-slate-50 p-3 rounded-md border border-slate-100">
                        <span className="font-medium text-slate-700">{entry.item}</span>
                        <span className="text-slate-500 bg-white px-2 py-1 rounded shadow-sm text-sm border border-slate-200">Qty: {entry.quantity}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Financial Data */}
              {submission.helpedFinancially && (
                <div className="space-y-1 p-4 bg-green-50 border border-green-200 rounded-lg md:col-span-2 mt-4">
                  <span className="text-sm text-green-800 font-bold uppercase tracking-wider block mb-1">Financial Contribution</span>
                  <p className="text-2xl font-black text-green-700">₹{submission.financialAmount?.toLocaleString()}</p>
                </div>
              )}

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}