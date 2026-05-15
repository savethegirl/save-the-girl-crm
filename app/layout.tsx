import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";
import Sidebar from "@/modules/sidebar/Sidebar"
import { cn } from "@/lib/utils";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Save The Girl | Admin Portal",
  description: "Internal management portal for Save The Girl NGO",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", geistSans.variable, geistMono.variable, "font-sans", inter.variable)}
    >
      {/* <body className="h-full flex bg-slate-50 text-slate-900 overflow-hidden"> */}
      <body className="h-full flex overflow-hidden">
        
        <Sidebar />
        <main className="flex-1 flex flex-col h-full overflow-y-auto">
          {children}
        </main>

        <Toaster position="top-right" />
      </body>
    </html>
  );
}