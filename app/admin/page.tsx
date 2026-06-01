"use client";

import Link from "next/link";
import { Users, MapPin } from "lucide-react";

export default function AdminDashboard() {
  const adminModules = [
    {
      title: "Manage Staff",
      description: "Create, reset, or revoke access for staff members.",
      icon: Users,
      href: "/admin/users",
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: "Manage Centers",
      description: "Update the list of official NGO facility locations.",
      icon: MapPin,
      href: "/admin/settings",
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto w-full">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-slate-900">Admin Control Panel</h1>
        <p className="text-slate-500 mt-2">Manage system settings, staff access, and master configurations.</p>
      </div>

      <div className="flex flex-col gap-6 w-full">
        {adminModules.map((module) => (
          <Link 
            key={module.title} 
            href={module.href}
            className="flex flex-col items-center p-6 bg-white border border-slate-200 rounded-xl hover:shadow-lg hover:border-slate-300 transition-all group w-full text-center"
          >
            <div className={`w-12 h-12 ${module.bg} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
              <module.icon className={`h-6 w-6 ${module.color}`} />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">{module.title}</h3>
            <p className="text-sm text-slate-500">{module.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}