/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, XCircle, Trash2, Search, Filter, Phone, Mail, Download, X } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";

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

type DonatedItem = { item: string; quantity: number };

type Submission = {
  id: string;
  serialNumber: number; 
  applicantName: string;
  certificateType: string;
  createdAt: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  phones: string[];
  emails: string[];
  itemsDonated: DonatedItem[] | null;
  [key: string]: any; 
};

const ALL_CATEGORIES = ["INTERN", "VOLUNTEER", "HOST", "DONOR", "VISITOR"];

export default function AdminDashboard() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("All Types");
  const [statusFilter, setStatusFilter] = useState("All Status");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // --- EXPORT MODAL STATES ---
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportSelection, setExportSelection] = useState<string[]>([...ALL_CATEGORIES]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, typeFilter, statusFilter]);

  const fetchSubmissions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/submissions');
      const json = await response.json();
      if (json.success) setSubmissions(json.data);
      else toast.error("Failed to load data.");
    } catch (error) {
      toast.error("Network error.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

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
        setSubmissions(submissions.map(sub => sub.id === id ? { ...sub, status: newStatus } : sub));
      } else {
        toast.error(`Failed: ${json.error}`, { id: toastId });
      }
    } catch (error) {
      toast.error("Network error.", { id: toastId });
    }
  };

  const handleApprove = (id: string) => updateStatus(id, "APPROVED");
  const handleReject = (id: string) => updateStatus(id, "REJECTED");

  const handleDelete = async (id: string) => {
    const toastId = toast.loading("Deleting record...");
    try {
      const response = await fetch(`/api/submissions?id=${id}`, { method: 'DELETE' });
      const json = await response.json();
      if (json.success) {
        toast.success("Record deleted", { id: toastId });
        setSubmissions(submissions.filter(sub => sub.id !== id));
      } else {
        toast.error(`Failed: ${json.error}`, { id: toastId });
      }
    } catch (error) {
      toast.error("Network error.", { id: toastId });
    }
  };

  // --- EXPORT ---
  const toggleExportCategory = (category: string) => {
    setExportSelection(prev => 
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
    );
  };

  const cleanDataForExcel = (data: Submission[]) => {
    if (!data || data.length === 0) return [];
    const allKeys = new Set<string>();
    data.forEach(row => Object.keys(row).forEach(k => allKeys.add(k)));

    const emptyKeys = new Set<string>();
    allKeys.forEach(key => {
      const isCompletelyEmpty = data.every(row => 
        row[key] === null || 
        row[key] === undefined || 
        row[key] === "" || 
        (Array.isArray(row[key]) && row[key].length === 0)
      );
      if (isCompletelyEmpty) emptyKeys.add(key);
    });

    return data.map(row => {
      const cleanRow: any = {};
      allKeys.forEach(key => {
        if (!emptyKeys.has(key)) {
          let val = row[key];
          if (Array.isArray(val)) {
            if (val.length > 0 && typeof val[0] === 'object') {
              val = val.map(item => `${item.item} (${item.quantity})`).join(", ");
            } else {
              val = val.join(", ");
            }
          }
          cleanRow[key] = val;
        }
      });
      return cleanRow;
    });
  };

  const executeExport = () => {
    if (exportSelection.length === 0) {
      toast.error("Please select at least one category to export.");
      return;
    }
    const toastId = toast.loading("Scrubbing data and generating Excel file...");
    try {
      const workbook = XLSX.utils.book_new();
      const selectedData = submissions.filter(sub => 
        exportSelection.includes(sub.certificateType?.toUpperCase())
      );

      if (selectedData.length === 0) {
        toast.error("No data found for selected categories.", { id: toastId });
        return;
      }

      if (exportSelection.length > 1) {
        const cleanedMaster = cleanDataForExcel(selectedData);
        const masterSheet = XLSX.utils.json_to_sheet(cleanedMaster);
        XLSX.utils.book_append_sheet(workbook, masterSheet, "Combined Data");
      }

      exportSelection.forEach((category) => {
        const typeData = selectedData.filter(sub => sub.certificateType?.toUpperCase() === category);
        if (typeData.length > 0) {
          const cleanedTypeData = cleanDataForExcel(typeData);
          const categorySheet = XLSX.utils.json_to_sheet(cleanedTypeData);
          const tabName = category.charAt(0) + category.slice(1).toLowerCase() + "s";
          XLSX.utils.book_append_sheet(workbook, categorySheet, tabName);
        }
      });

      XLSX.writeFile(workbook, "SaveTheGirl_Custom_Export.xlsx");
      toast.success("Export complete!", { id: toastId });
      setIsExportModalOpen(false);
    } catch (error) {
      toast.error("Failed to generate file.", { id: toastId });
    }
  };
  // ----------------------------------

  const filteredSubmissions = submissions.filter(sub => {
    const query = searchQuery.toLowerCase().trim();
    
    // Create the formatted ID for searching (e.g. stg/cms/0000001)
    const formattedId = sub.serialNumber ? `stg/cms/${String(sub.serialNumber).padStart(7, '0')}` : "";
    
    const matchesSearch = 
      query === "" || 
      (sub.applicantName && sub.applicantName.toLowerCase().includes(query)) ||
      (sub.phones && sub.phones.some(phone => phone.includes(query))) ||
      (sub.emails && sub.emails.some(email => email.toLowerCase().includes(query))) ||
      (sub.serialNumber && String(sub.serialNumber).includes(query)) ||
      (formattedId.includes(query)); // <--- Added ID Search Here!

    const matchesType = typeFilter === "All Types" || sub.certificateType === typeFilter.toUpperCase();
    const matchesStatus = statusFilter === "All Status" || sub.status === statusFilter.toUpperCase();
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const totalPages = Math.ceil(filteredSubmissions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSubmissions = filteredSubmissions.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="p-4 md:p-8 w-full max-w-7xl mx-auto bg-slate-50 min-h-screen">
      
      {/* Header */}
      <div className="mb-6 md:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm md:text-base text-slate-500 mt-1">Review and approve certificate requests.</p>
        </div>
        
        <button 
          onClick={() => setIsExportModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors shadow-sm whitespace-nowrap w-full sm:w-auto"
        >
          <Download className="h-4 w-4" />
          Export to Excel
        </button>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        {/* Top Control Bar */}
        <div className="p-4 border-b border-slate-200 space-y-4">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
              <input 
                type="text" 
                placeholder="Search by ID, name, phone, or email..." //
                className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Scrollable Status Filter */}
            <div className="flex gap-2 bg-slate-100 p-1 rounded-md overflow-x-auto no-scrollbar">
              {["All Status", "Pending", "Approved", "Rejected"].map(status => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 md:px-4 py-1.5 text-xs md:text-sm font-medium rounded-md transition-colors whitespace-nowrap ${statusFilter === status ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'}`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Scrollable Type Filter */}
          <div className="flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar">
            <div className="flex items-center gap-2 text-xs md:text-sm font-medium text-slate-500 whitespace-nowrap">
              <Filter className="h-4 w-4" /> Filter by Type:
            </div>
            {["All Types", "Host", "Visitor", "Donor", "Intern", "Volunteer"].map(type => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={`px-3 py-1 text-xs md:text-sm border rounded-full transition-colors whitespace-nowrap ${typeFilter === type ? 'border-blue-600 bg-blue-50 text-blue-700 font-medium' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* LOADING & EMPTY STATES */}
        {isLoading && (
          <div className="p-8 text-center text-slate-500">Loading submissions...</div>
        )}
        {!isLoading && paginatedSubmissions.length === 0 && (
          <div className="p-8 text-center text-slate-500">No submissions found.</div>
        )}

        {/* --- DESKTOP VIEW --- */}
        {!isLoading && paginatedSubmissions.length > 0 && (
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Applicant & ID</th>
                  <th className="px-6 py-4">Contact Details</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Submitted Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedSubmissions.map((sub) => (
                  <tr 
                    key={sub.id} 
                    onClick={() => router.push(`/submissions/${sub.id}`)}
                    className="group cursor-pointer hover:bg-white hover:shadow-lg hover:relative hover:z-10 hover:ring-1 hover:ring-blue-300 transition-all"
                  >
                    <td className="px-6 py-4 align-top">
                      <div className="font-medium text-slate-900">{sub.applicantName}</div>
                      <div className="text-xs text-slate-400 font-mono mt-1 tracking-wider uppercase">
                        STG/CMS/{String(sub.serialNumber).padStart(7, '0')}
                      </div>
                    </td>
                    <td className="px-6 py-4 align-top">
                      <div className="space-y-1.5">
                        {sub.phones && sub.phones.length > 0 && (
                          <div className="flex items-center gap-2 text-slate-700">
                            <Phone className="h-3.5 w-3.5 text-slate-400" />
                            <span>{sub.phones[0]}</span>
                          </div>
                        )}
                        {sub.emails && sub.emails.length > 0 && (
                          <div className="flex items-center gap-2 text-slate-600">
                            <Mail className="h-3.5 w-3.5 text-slate-400" />
                            <span className="truncate max-w-50">{sub.emails[0]}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 align-top">
                      <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md text-xs font-semibold uppercase border border-slate-200">
                        {sub.certificateType}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 align-top">
                      {new Date(sub.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 align-top">
                      {sub.status === 'APPROVED' && <span className="bg-green-100 text-green-700 px-2.5 py-1 rounded-md text-xs font-bold border border-green-200">APPROVED</span>}
                      {sub.status === 'PENDING' && <span className="bg-amber-100 text-amber-700 px-2.5 py-1 rounded-md text-xs font-bold border border-amber-200">PENDING</span>}
                      {sub.status === 'REJECTED' && <span className="bg-red-100 text-red-700 px-2.5 py-1 rounded-md text-xs font-bold border border-red-200">REJECTED</span>}
                    </td>
                    <td className="px-6 py-4 align-top" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-3">
                        <button onClick={() => handleApprove(sub.id)} className="text-green-600 hover:text-green-700 bg-green-50 p-1.5 rounded-md transition-colors"><CheckCircle2 className="h-5 w-5" /></button>
                        <button onClick={() => handleReject(sub.id)} className="text-red-600 hover:text-red-700 bg-red-50 p-1.5 rounded-md transition-colors"><XCircle className="h-5 w-5" /></button>
                        <div className="w-px h-6 bg-slate-200 mx-1"></div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <button className="text-slate-400 hover:text-red-600 p-1.5 rounded-md hover:bg-red-50 transition-colors"><Trash2 className="h-5 w-5" /></button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="w-[90vw] max-w-125">
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Submission?</AlertDialogTitle>
                              <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(sub.id)} className="bg-red-600">Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* --- MOBILE VIEW (CARD STACK) --- */}
        {!isLoading && paginatedSubmissions.length > 0 && (
          <div className="md:hidden flex flex-col divide-y divide-slate-100">
            {paginatedSubmissions.map((sub) => (
              <div 
                key={sub.id} 
                onClick={() => router.push(`/submissions/${sub.id}`)}
                className="flex flex-col p-4 bg-white hover:bg-slate-50 cursor-pointer transition-colors space-y-4"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">{sub.applicantName}</h3>
                    <div className="text-[11px] font-mono text-slate-400 mt-0.5 tracking-wider uppercase">
                      STG/CMS/{String(sub.serialNumber).padStart(7, '0')}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{new Date(sub.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                  </div>
                  <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border border-slate-200">
                    {sub.certificateType}
                  </span>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-2">
                  {sub.phones && sub.phones.length > 0 && (
                    <div className="flex items-center gap-2 text-sm text-slate-700">
                      <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                      <span>{sub.phones[0]}</span>
                    </div>
                  )}
                  {sub.emails && sub.emails.length > 0 && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Mail className="h-4 w-4 text-slate-400 shrink-0" />
                      <span className="truncate">{sub.emails[0]}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div>
                    {sub.status === 'APPROVED' && <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold border border-green-200">APPROVED</span>}
                    {sub.status === 'PENDING' && <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded text-xs font-bold border border-amber-200">PENDING</span>}
                    {sub.status === 'REJECTED' && <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold border border-red-200">REJECTED</span>}
                  </div>
                  
                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => handleApprove(sub.id)} className="text-green-600 hover:bg-green-100 bg-green-50 p-2 rounded-md transition-colors"><CheckCircle2 className="h-5 w-5" /></button>
                    <button onClick={() => handleReject(sub.id)} className="text-red-600 hover:bg-red-100 bg-red-50 p-2 rounded-md transition-colors"><XCircle className="h-5 w-5" /></button>
                    <div className="w-px h-6 bg-slate-200 mx-1 self-center"></div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button className="text-slate-400 hover:text-red-600 p-2 rounded-md hover:bg-red-50 transition-colors"><Trash2 className="h-5 w-5" /></button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="w-[90vw] max-w-125">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Submission?</AlertDialogTitle>
                          <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(sub.id)} className="bg-red-600">Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Pagination */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-sm text-slate-500 font-medium text-center sm:text-left">
            Showing {filteredSubmissions.length === 0 ? 0 : startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredSubmissions.length)} of {filteredSubmissions.length}
          </div>
          <div className="flex items-center justify-center gap-2">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1.5 text-sm font-medium border rounded-md bg-white disabled:opacity-50">Previous</button>
            <div className="text-sm font-medium px-2">Page {currentPage} of {totalPages || 1}</div>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0} className="px-3 py-1.5 text-sm font-medium border rounded-md bg-white disabled:opacity-50">Next</button>
          </div>
        </div>
      </div>

      {/* --- EXPORT MODAL --- */}
      {isExportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden border border-slate-100">
            <div className="p-4 md:p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-lg md:text-xl font-bold text-slate-800">Export Submissions</h2>
              <button onClick={() => setIsExportModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-4 md:p-6">
              <p className="text-sm text-slate-500 mb-4">Select the categories you want to include in the Excel file. Empty columns will be automatically removed.</p>
              
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-600"
                    checked={exportSelection.length === ALL_CATEGORIES.length}
                    onChange={(e) => {
                      if (e.target.checked) setExportSelection([...ALL_CATEGORIES]);
                      else setExportSelection([]);
                    }}
                  />
                  <span className="font-medium text-slate-700">Select All Categories</span>
                </label>

                <div className="grid grid-cols-2 gap-3 mt-2">
                  {ALL_CATEGORIES.map(category => (
                    <label key={category} className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-600"
                        checked={exportSelection.includes(category)}
                        onChange={() => toggleExportCategory(category)}
                      />
                      <span className="text-sm font-medium text-slate-700 capitalize">{category.toLowerCase()}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-6">
                <button
                  onClick={() => setIsExportModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={executeExport}
                  disabled={exportSelection.length === 0}
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Download
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}