"use client";

import { useState } from "react";
import { Search, Trash2, CheckCircle, XCircle, Filter } from "lucide-react";
import toast from "react-hot-toast";

const initialUsers = [
  { id: 1, name: "Harsh", type: "Intern", date: "2026-05-10", status: "Approved" },
  { id: 2, name: "Isha Verma", type: "Host", date: "2026-05-09", status: "Pending" },
  { id: 3, name: "Rahul Nair", type: "Visitor", date: "2026-05-08", status: "Rejected" },
  { id: 4, name: "Priya Singh", type: "Donor", date: "2026-05-08", status: "Pending" },
  { id: 5, name: "Amit Kumar", type: "Volunteer", date: "2026-05-07", status: "Approved" },
];

export default function Dashboard() {
  const [activeStatus, setActiveStatus] = useState("All Status");
  const [activeType, setActiveType] = useState("All Types");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredUsers = initialUsers.filter((user) => {
    const matchesStatus = activeStatus === "All Status" || user.status === activeStatus;
    const matchesType = activeType === "All Types" || user.type === activeType;
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          user.type.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesStatus && matchesType && matchesSearch;
  });

  const handleApprove = (name: string) => toast.success(`${name} Approved. Certificate Queued.`);
  const handleReject = (name: string) => toast.error(`${name} Rejected.`);
  const handleDelete = (name: string) => toast("Record Deleted", { icon: "🗑️" });

  return (
    <div className="p-8 w-full max-w-7xl mx-auto bg-slate-50 min-h-screen text-slate-900">
      
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Manage Submissions</h1>
        <p className="text-sm text-slate-500">Review and approve certificate requests.</p>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
        
        {/* Top Controls Bar - Now with Two Rows */}
        <div className="p-4 border-b border-slate-200 space-y-4">
          
          {/* Row 1: Search and Status */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search names or types..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900"
              />
            </div>

            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              {["All Status", "Pending", "Approved", "Rejected"].map((status) => (
                <button
                  key={status}
                  onClick={() => setActiveStatus(status)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    activeStatus === status 
                      ? "bg-slate-800 text-white" 
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
            <Filter className="h-4 w-4 text-slate-400" />
            <span className="text-sm font-medium text-slate-500">Filter by Type:</span>
            <div className="flex flex-wrap gap-2">
              {["All Types", "Host", "Visitor", "Donor", "Intern", "Volunteer"].map((type) => (
                <button
                  key={type}
                  onClick={() => setActiveType(type)}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors border ${
                    activeType === type 
                      ? "bg-blue-50 border-blue-200 text-blue-700" 
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-900">
              <tr>
                <th className="px-6 py-4 font-medium">Applicant Name</th>
                <th className="px-6 py-4 font-medium">Request Type</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">{user.name}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200">
                        {user.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">{user.date}</td>
                    
                    {/* Status */}
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                        user.status === "Approved" ? "bg-green-100 text-green-700" :
                        user.status === "Pending" ? "bg-amber-100 text-amber-700" :
                        "bg-red-100 text-red-700"
                      }`}>
                        {user.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 flex items-center justify-end gap-2">
                      <button onClick={() => handleApprove(user.name)} className="p-1.5 text-green-600 hover:bg-green-50 rounded-md transition-colors" title="Approve">
                        <CheckCircle className="h-5 w-5" />
                      </button>
                      <button onClick={() => handleReject(user.name)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Reject">
                        <XCircle className="h-5 w-5" />
                      </button>
                      <div className="w-px h-6 bg-slate-300 mx-1"></div>
                      <button onClick={() => handleDelete(user.name)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors" title="Delete">
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    No submissions found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-slate-200 flex justify-end text-sm text-slate-500">
          Showing {filteredUsers.length} entries
        </div>

      </div>
    </div>
  );
}