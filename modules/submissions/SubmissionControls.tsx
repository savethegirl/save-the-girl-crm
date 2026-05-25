/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, Clock, FileBadge, Loader2, Mail, HardDrive, Download, Plus } from "lucide-react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

// Shadcn UI
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ControlProps {
  id: string;
  currentStatus: string;
  applicantName: string | null;
  certificateType: string;
  applicantEmail?: string; // New prop for the fetched email
}

export default function SubmissionControls({ id, currentStatus, applicantName, certificateType, applicantEmail }: ControlProps) {
  const [status, setStatus] = useState(currentStatus);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  // --- Modal Generation State ---
  const [saveLocally, setSaveLocally] = useState(true);
  const [saveToDrive, setSaveToDrive] = useState(false);
  const [sendEmail, setSendEmail] = useState(false);
  const [showCcInput, setShowCcInput] = useState(false);
  const [ccEmail, setCcEmail] = useState("");
  const [includeQuantity, setIncludeQuantity] = useState(true);

  const updateStatus = async (newStatus: "APPROVED" | "REJECTED" | "PENDING") => {
    setIsUpdating(true);
    const toastId = toast.loading(`Updating to ${newStatus}...`);
    
    try {
      const response = await fetch('/api/submissions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus })
      });
      
      const json = await response.json();
      
      if (json.success) {
        toast.success(`Status updated!`, { id: toastId });
        setStatus(newStatus);
        router.refresh(); 
      } else {
        toast.error(`Error: ${json.error}`, { id: toastId });
      }
    } catch (error) {
      toast.error("Network error", { id: toastId });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleGenerateCertificate = async () => {
    setIsGenerating(true);
    const toastId = toast.loading("Processing Certificate...");

    try {
      const response = await fetch('/api/certificates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            id,
            options: {
                saveLocally,
                saveToDrive,
                sendEmail,
                targetEmail: sendEmail ? applicantEmail : null, // Backend will use this
                ccEmail: showCcInput ? ccEmail : null,
                includeQuantity
            }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate certificate.");
      }

      if (saveLocally) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          const cleanName = applicantName ? applicantName.replace(/\s+/g, '_') : 'Applicant';
          a.download = `${cleanName}_${certificateType}_Certificate.pdf`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
      }

      toast.success("Generation complete!", { id: toastId });
      setIsModalOpen(false); 
    } catch (error: any) {
      console.error("PDF Error:", error);
      toast.error(error.message || "Network error.", { id: toastId });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
      
      <div className="flex items-center gap-2 border-r pr-4 mr-2">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Update Status</span>
        <button 
          onClick={() => updateStatus('APPROVED')}
          disabled={isUpdating || status === 'APPROVED'}
          className={`p-2 rounded-lg transition-all ${status === 'APPROVED' ? 'bg-green-100 text-green-600 ring-2 ring-green-500' : 'bg-slate-50 text-slate-400 hover:bg-green-50 hover:text-green-600'}`}
          title="Approve"
        >
          <CheckCircle2 className="h-5 w-5" />
        </button>
        <button 
          onClick={() => updateStatus('REJECTED')}
          disabled={isUpdating || status === 'REJECTED'}
          className={`p-2 rounded-lg transition-all ${status === 'REJECTED' ? 'bg-red-100 text-red-600 ring-2 ring-red-500' : 'bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-600'}`}
          title="Reject"
        >
          <XCircle className="h-5 w-5" />
        </button>
        <button 
          onClick={() => updateStatus('PENDING')}
          disabled={isUpdating || status === 'PENDING'}
          className={`p-2 rounded-lg transition-all ${status === 'PENDING' ? 'bg-amber-100 text-amber-600 ring-2 ring-amber-500' : 'bg-slate-50 text-slate-400 hover:bg-amber-50 hover:text-amber-600'}`}
          title="Reset to Pending"
        >
          <Clock className="h-5 w-5" />
        </button>
      </div>

      {status === 'APPROVED' && (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
              <FileBadge className="h-4 w-4" />
              Generate Certificate
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Configure Generation</DialogTitle>
              <DialogDescription>
                Select how you want to process and distribute this certificate.
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4 space-y-5">
              
              {/* Item Settings (Donor, Host, Visitor) */}
              {['DONOR', 'HOST', 'VISITOR'].includes(certificateType) && (
                  <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg space-y-2">
                      <span className="text-xs font-bold text-amber-800 uppercase tracking-widest block">Item Settings</span>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" checked={includeQuantity} onChange={(e) => setIncludeQuantity(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-600" />
                        <span className="text-sm font-medium text-slate-700">List item quantities alongside items</span>
                      </label>
                  </div>
              )}

              {/* Distribution Settings */}
              <div className="space-y-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Distribution</span>
                  
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" checked={saveLocally} onChange={(e) => setSaveLocally(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600" />
                    <Download className="h-4 w-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                    <span className="text-sm font-medium text-slate-700">Download to local PC</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" checked={saveToDrive} onChange={(e) => setSaveToDrive(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600" />
                    <HardDrive className="h-4 w-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                    <span className="text-sm font-medium text-slate-700">Save to NGO Google Drive</span>
                  </label>

                  <div className="space-y-2">
                    <label className="flex items-center gap-3 cursor-pointer group">
                        <input 
                          type="checkbox" 
                          checked={sendEmail} 
                          onChange={(e) => setSendEmail(e.target.checked)} 
                          disabled={!applicantEmail}
                          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600 disabled:opacity-50" 
                        />
                        <Mail className={`h-4 w-4 transition-colors ${applicantEmail ? 'text-slate-400 group-hover:text-blue-600' : 'text-slate-300'}`} />
                        <span className={`text-sm font-medium ${applicantEmail ? 'text-slate-700' : 'text-slate-400'}`}>
                          Email applicant {applicantEmail ? <span className="font-normal text-slate-500">({applicantEmail})</span> : <span className="text-red-400 text-xs italic ml-1">No email on file</span>}
                        </span>
                    </label>
                    
                    {sendEmail && applicantEmail && (
                        <div className="pl-7 pt-1 space-y-2 animate-in fade-in slide-in-from-top-1">
                            {!showCcInput ? (
                                <button onClick={() => setShowCcInput(true)} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors">
                                    <Plus className="h-3 w-3" /> Add CC / Another Email
                                </button>
                            ) : (
                                <input 
                                    type="email" 
                                    placeholder="cc@example.com" 
                                    value={ccEmail}
                                    onChange={(e) => setCcEmail(e.target.value)}
                                    className="flex h-8 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-600"
                                />
                            )}
                        </div>
                    )}
                  </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={isGenerating}>Cancel</Button>
              <Button onClick={handleGenerateCertificate} disabled={isGenerating || (!saveLocally && !saveToDrive && !sendEmail)} className="bg-blue-600 min-w-[140px]">
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing
                  </>
                ) : (
                  "Confirm & Process"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}