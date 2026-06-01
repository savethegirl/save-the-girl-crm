import CenterManager from "@/modules/center-manager/CenterManager";
import { prisma } from "@/db/prisma";

export default async function SettingsPage() {
  // Fetch the global settings row
  let settings = await prisma.settings.findFirst();

  // If the database is completely fresh, create a default row
  if (!settings) {
    settings = await prisma.settings.create({
      data: {
        centers: [],
        donationCategories: []
      }
    });
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">System Settings</h1>
        <p className="text-slate-500 mt-1">Manage global configurations for the NGO portal.</p>
      </div>
      <CenterManager initialCenters={settings.centers} />
    </div>
  );
}