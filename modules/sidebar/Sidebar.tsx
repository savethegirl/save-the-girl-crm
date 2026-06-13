/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { 
  LayoutDashboard, 
  Users, 
  UserPlus, 
  HeartHandshake, 
  GraduationCap, 
  HandHeart,
  LogOut,
  Settings,
  Menu,
  X
} from "lucide-react";

const routes = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/" },
  { label: "Host Certificate", icon: Users, href: "/host" },
  { label: "Visitor Certificate", icon: UserPlus, href: "/visitor" },
  { label: "Donation Certificate", icon: HeartHandshake, href: "/donation" },
  { label: "Internship Certificate", icon: GraduationCap, href: "/internship" },
  { label: "Volunteer Certificate", icon: HandHeart, href: "/volunteer" },
];

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();

  // Close the mobile sidebar automatically when a link is clicked
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  if (pathname === "/login") {
    return null;
  }

  // if the logged-in user is an admin
  const isAdmin = (session?.user as any)?.role === "ADMIN";

  return (
    <>
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200 shrink-0 z-30">
        <Image src="/logo.png" alt="Logo" width={100} height={40} className="object-contain" />
        <button 
          onClick={() => setIsOpen(true)} 
          className="p-2 text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-md transition-colors"
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 md:hidden backdrop-blur-sm transition-opacity" 
          onClick={() => setIsOpen(false)} 
        />
      )}

      {/* SIDEBAR PANEL  */}
      <div className={`
        fixed inset-y-0 left-0 z-50 flex flex-col w-72 bg-white border-r border-slate-200 shrink-0 
        transform transition-transform duration-300 ease-in-out shadow-xl md:shadow-none
        md:relative md:translate-x-0 md:w-64
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        
        {/* Logo Section */}
        <div className="flex items-center justify-between h-16 md:h-20 border-b border-slate-200 px-6">
          <div className="flex items-center justify-center w-full">
            <Image src="/logo.png" alt="Logo" width={130} height={130} className="object-contain" />
          </div>
          {/* Close button for mobile */}
          <button 
            onClick={() => setIsOpen(false)} 
            className="md:hidden absolute right-4 p-2 text-slate-400 hover:bg-slate-50 hover:text-red-500 rounded-md"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-6">
          <ul className="space-y-1 px-3">
            {routes.map((route) => {
              const isActive = pathname === route.href;
              
              return (
                <li key={route.href}>
                  <Link
                    href={route.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-blue-50 text-blue-700"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <route.icon className={`h-5 w-5 ${isActive ? "text-blue-700" : "text-slate-400"}`} />
                    {route.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Admin-Only Footer */}
        {isAdmin && ( 
          <div className="p-4 border-t border-slate-200">
            <Link 
              href="/admin" 
              className="flex items-center gap-3 px-4 py-2.5 bg-slate-900 text-white hover:bg-slate-800 rounded-lg transition-colors shadow-sm"
            >
              <Settings className="h-5 w-5 text-slate-300" />
              <span className="font-medium text-sm">Admin Panel</span>
            </Link>
          </div>
        )}

        <div className="p-4 border-t border-slate-200 mb-safe">
          <button 
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-3 px-3 py-2 w-full text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-md transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </button>
        </div>

      </div>
    </>
  );
}