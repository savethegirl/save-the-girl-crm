/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, XCircle, Trash2, Search, Filter, Phone, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

// Shadcn UI Imports
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// 1. Expanded TypeScript Interface to catch the new data
type DonatedItem = { item: string; quantity: number };

type Submission = {
  id: string;
  applicantName: string;
  certificateType: string;
  createdAt: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  phones: string[];
  emails: string[];
  itemsDonated: DonatedItem[] | null;
};

export default function AdminDashboard() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  
  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("All Types");
  const [statusFilter, setStatusFilter] = useState("All Status");

  const fetchSubmissions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/submissions');
      const json = await response.json();
      
      if (json.success) {
        setSubmissions(json.data);
      } else {
        toast.error("Failed to load data.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Network error.");
    } finally {
      setIsLoading(false);
    }
  };

  // fetch on mount
  useEffect(() => {
    fetchSubmissions();
  }, []);

  // Mutation Handlers 
  const updateStatus = async (id: string, newStatus: "APPROVED" | "REJECTED") => {
    const toastId = toast.loading(`Marking as ${newStatus.toLowerCase()}...`);
    try {
      const response = await fetch('/api/submissions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus })
      });
      
      const json = await response.json();
      
      if (json.success) {
        toast.success(`Successfully ${newStatus.toLowerCase()}`, { id: toastId });
        setSubmissions(submissions.map(sub => 
          sub.id === id ? { ...sub, status: newStatus } : sub
        ));
      } else {
        toast.error(`Failed: ${json.error}`, { id: toastId });
      }
    } catch (error) {
      console.error(error);
      toast.error("Network error.", { id: toastId });
    }
  };

  const handleApprove = (id: string) => updateStatus(id, "APPROVED");
  const handleReject = (id: string) => updateStatus(id, "REJECTED");

  const handleDelete = async (id: string) => {
    // Note: window.confirm removed. Shadcn Alert Dialog handles confirmation now.
    const toastId = toast.loading("Deleting record...");
    try {
      const response = await fetch(`/api/submissions?id=${id}`, {
        method: 'DELETE'
      });
      
      const json = await response.json();
      
      if (json.success) {
        toast.success("Record deleted", { id: toastId });
        setSubmissions(submissions.filter(sub => sub.id !== id));
      } else {
        toast.error(`Failed: ${json.error}`, { id: toastId });
      }
    } catch (error) {
      console.error(error);
      toast.error("Network error.", { id: toastId });
    }
  };

  const filteredSubmissions = submissions.filter(sub => {
    const query = searchQuery.toLowerCase().trim();
    
    const matchesSearch = 
      query === "" || 
      (sub.applicantName && sub.applicantName.toLowerCase().includes(query)) ||
      (sub.phones && sub.phones.some(phone => phone.includes(query))) ||
      (sub.emails && sub.emails.some(email => email.toLowerCase().includes(query))) ||
      (sub.itemsDonated && sub.itemsDonated.some(entry => entry.item.toLowerCase().includes(query)));

    const matchesType = typeFilter === "All Types" || sub.certificateType === typeFilter.toUpperCase();
    const matchesStatus = statusFilter === "All Status" || sub.status === statusFilter.toUpperCase();
    
    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="p-8 w-full max-w-[1400px] mx-auto bg-slate-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Manage Submissions</h1>
        <p className="text-slate-500 mt-1">Review and approve certificate requests.</p>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        
        {/* Top Control Bar */}
        <div className="p-4 border-b border-slate-200 space-y-4">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            
            {/* Omni-Search Input */}
            <div className="relative w-full md:w-[400px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
              <input 
                type="text" 
                placeholder="Search by name, phone, email, or item..." 
                className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Status Pills */}
            <div className="flex gap-2 bg-slate-100 p-1 rounded-md overflow-x-auto">
              {["All Status", "Pending", "Approved", "Rejected"].map(status => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${statusFilter === status ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'}`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Type Filters */}
          <div className="flex items-center gap-3 overflow-x-auto pb-2">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
              <Filter className="h-4 w-4" /> Filter by Type:
            </div>
            {["All Types", "Host", "Visitor", "Donor", "Intern", "Volunteer"].map(type => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={`px-3 py-1 text-sm border rounded-full transition-colors whitespace-nowrap ${typeFilter === type ? 'border-blue-600 bg-blue-50 text-blue-700 font-medium' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Applicant Name</th>
                <th className="px-6 py-4">Contact Details</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Submitted Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">Loading submissions...</td>
                </tr>
              ) : filteredSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">No submissions found matching your criteria.</td>
                </tr>
              ) : (
                filteredSubmissions.map((sub) => (
                  <tr 
                    key={sub.id} 
                    onClick={() => router.push(`/submissions/${sub.id}`)}
                    className="group cursor-pointer bg-transparent transition-all duration-200 hover:bg-white hover:shadow-lg hover:relative hover:z-10 hover:ring-1 hover:ring-blue-300"
                  >
                    
                    {/* Name */}
                    <td className="px-6 py-4 font-medium text-slate-900 align-top group-hover:text-blue-600 transition-colors">
                      {sub.applicantName}
                    </td>

                    {/* Contact Details */}
                    <td className="px-6 py-4 align-top">
                      <div className="space-y-1.5">
                        {sub.phones && sub.phones.length > 0 && (
                          <div className="flex items-center gap-2 text-slate-700">
                            <Phone className="h-3.5 w-3.5 text-slate-400" />
                            <span>{sub.phones[0]}</span>
                            {sub.phones.length > 1 && <span className="text-xs text-slate-400">(+{sub.phones.length - 1})</span>}
                          </div>
                        )}
                        {sub.emails && sub.emails.length > 0 && (
                          <div className="flex items-center gap-2 text-slate-600">
                            <Mail className="h-3.5 w-3.5 text-slate-400" />
                            <span className="truncate max-w-[200px]">{sub.emails[0]}</span>
                          </div>
                        )}
                        {(!sub.phones?.length && !sub.emails?.length) && (
                          <span className="text-slate-400 text-xs italic">No contact info provided</span>
                        )}
                      </div>
                    </td>

                    {/* Type */}
                    <td className="px-6 py-4 align-top">
                      <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md text-xs font-semibold tracking-wide uppercase border border-slate-200">
                        {sub.certificateType}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="px-6 py-4 text-slate-600 align-top">
                      {new Date(sub.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4 align-top">
                      {sub.status === 'APPROVED' && <span className="bg-green-100 text-green-700 px-2.5 py-1 rounded-md text-xs font-bold border border-green-200">APPROVED</span>}
                      {sub.status === 'PENDING' && <span className="bg-amber-100 text-amber-700 px-2.5 py-1 rounded-md text-xs font-bold border border-amber-200">PENDING</span>}
                      {sub.status === 'REJECTED' && <span className="bg-red-100 text-red-700 px-2.5 py-1 rounded-md text-xs font-bold border border-red-200">REJECTED</span>}
                    </td>

                    {/* Actions - stopPropagation prevents row click when interacting with buttons */}
                    <td className="px-6 py-4 align-top" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-3">
                        <button onClick={() => handleApprove(sub.id)} className="text-green-600 hover:text-green-700 transition-colors bg-green-50 p-1.5 rounded-md" title="Approve">
                          <CheckCircle2 className="h-5 w-5" />
                        </button>
                        <button onClick={() => handleReject(sub.id)} className="text-red-600 hover:text-red-700 transition-colors bg-red-50 p-1.5 rounded-md" title="Reject">
                          <XCircle className="h-5 w-5" />
                        </button>
                        <div className="w-px h-6 bg-slate-200 mx-1"></div>
                        
                        {/* Shadcn Alert Dialog for Delete */}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <button className="text-slate-400 hover:text-red-600 transition-colors p-1.5 rounded-md hover:bg-red-50" title="Delete">
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the submission for <strong>{sub.applicantName}</strong> from our servers.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDelete(sub.id)}
                                className="bg-red-600 hover:bg-red-700 text-white"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>

                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 text-right text-sm text-slate-500 font-medium">
          Showing {filteredSubmissions.length} entries
        </div>
      </div>
    </div>
  );
}