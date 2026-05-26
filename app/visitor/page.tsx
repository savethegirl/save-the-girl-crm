/* eslint-disable react-hooks/incompatible-library */
"use client";

import { useState, KeyboardEvent, useEffect } from "react";
import { useForm, SubmitHandler } from 'react-hook-form';
import toast from 'react-hot-toast';
import { X, Plus, Loader2 } from "lucide-react";

const TagInput = ({ label, placeholder, tags, setTags, type = "text" }: { label: string, placeholder: string, tags: string[], setTags: (tags: string[]) => void, type?: string }) => {
  const [inputValue, setInputValue] = useState("");

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputValue.trim() !== "") {
      e.preventDefault();
      if (!tags.includes(inputValue.trim())) {
        setTags([...tags, inputValue.trim()]);
      }
      setInputValue("");
    }
  };

  const removeTag = (indexToRemove: number) => {
    setTags(tags.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <div className="p-2 border border-slate-300 rounded-md bg-white focus-within:ring-2 focus-within:ring-blue-500 transition-all">
        <div className="flex flex-wrap gap-2 mb-1">
          {tags.map((tag, index) => (
            <span key={index} className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-md">
              {tag}
              <button type="button" onClick={() => removeTag(index)} className="text-blue-500 hover:text-red-500 transition-colors">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
        <input
          type={type}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full text-sm outline-none bg-transparent placeholder:text-slate-400 text-slate-900"
          placeholder={tags.length === 0 ? placeholder : "Type and press Enter to add more..."}
        />
      </div>
    </div>
  );
};

type DonatedItem = { item: string; quantity: number };

const KeyValueInput = ({ items, setItems }: { items: DonatedItem[], setItems: (items: DonatedItem[]) => void }) => {
  const [itemName, setItemName] = useState("");
  const [itemQty, setItemQty] = useState("");

  const handleAddItem = () => {
    if (itemName.trim() && itemQty) {
      setItems([...items, { item: itemName.trim(), quantity: parseInt(itemQty) }]);
      setItemName("");
      setItemQty("");
    }
  };

  const removeItem = (indexToRemove: number) => {
    setItems(items.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-700">Items Donated (Specifics)</label>
      <div className="p-4 border border-slate-300 rounded-md bg-slate-50 space-y-4">
        <div className="flex gap-2">
          <input 
            type="text" 
            value={itemName} 
            onChange={(e) => setItemName(e.target.value)} 
            placeholder="Item name (e.g. Books)" 
            className="flex-1 p-2 text-sm border border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input 
            type="number" 
            value={itemQty} 
            onChange={(e) => setItemQty(e.target.value)} 
            placeholder="Qty" 
            min="1"
            className="w-24 p-2 text-sm border border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button 
            type="button" 
            onClick={handleAddItem}
            className="p-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
        {items.length > 0 && (
          <ul className="space-y-2">
            {items.map((entry, index) => (
              <li key={index} className="flex justify-between items-center bg-white p-2 border border-slate-200 rounded-md text-sm text-slate-700">
                <span><span className="font-semibold">{entry.quantity}x</span> {entry.item}</span>
                <button type="button" onClick={() => removeItem(index)} className="text-slate-400 hover:text-red-500">
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

// --- MAIN PAGE ---

type VisitorFormInputs = {
  applicantName: string;
  visitDate: string;
  centerVisited: string;
  attendantName: string;
  address: string;
  facebook: string;
  instagram: string;
  linkedin: string;
  twitter: string;
  purpose: string;
  otherPurpose: string;
  photosLink: string;
  helpedFinancially: string;
  financialAmount?: string;
  nextFollowUpDue?: string;
  remarks: string;
};

export default function VisitorCertificatePage() {
  const [phones, setPhones] = useState<string[]>([]);
  const [emails, setEmails] = useState<string[]>([]); // NEW: Emails state
  const [donatedItems, setDonatedItems] = useState<DonatedItem[]>([]);
  const [visitSure, setVisitSure] = useState(true);

  // --- Dynamic Centers State ---
  const [availableCenters, setAvailableCenters] = useState<string[]>([]);
  const [isLoadingCenters, setIsLoadingCenters] = useState(true);

  const { 
    register, 
    handleSubmit, 
    reset, 
    watch,
    formState: { isSubmitting, errors } 
  } = useForm<VisitorFormInputs>({
    defaultValues: {
      purpose: 'General',
      helpedFinancially: 'No',
      centerVisited: '' 
    }
  });

  const currentPurpose = watch("purpose");
  const currentHelpedFinancially = watch("helpedFinancially");

  // --- Fetch Centers on Mount ---
  useEffect(() => {
    const fetchCenters = async () => {
      try {
        const res = await fetch('/api/settings');
        const json = await res.json();
        if (json.success) {
          setAvailableCenters(json.data);
        }
      } catch (error) {
        console.error("Failed to fetch centers", error);
        toast.error("Failed to load active centers.");
      } finally {
        setIsLoadingCenters(false);
      }
    };
    fetchCenters();
  }, []);

  const onSubmit: SubmitHandler<VisitorFormInputs> = async (data) => {
    if (phones.length === 0) {
      toast.error("At least one phone number is required.");
      return;
    }

    const toastId = toast.loading("Saving visitor data...");

    const payload = {
      applicantName: data.applicantName,
      certificateType: 'VISITOR',
      visitDate: data.visitDate,
      centerVisited: data.centerVisited,
      attendantName: data.attendantName,
      phones: phones,
      emails: emails, // NEW: Include emails in payload
      facilityLocation: data.address, 
      purposeOfVisit: data.purpose === 'Other' ? data.otherPurpose : data.purpose,
      itemsDonated: donatedItems.length > 0 ? donatedItems : null,
      uploadPhotosLink: data.photosLink,
      helpedFinancially: data.helpedFinancially === 'Yes',
      financialAmount: data.financialAmount,
      nextFollowUpDue: visitSure ? data.nextFollowUpDue : null,
      additionalRemarks: data.remarks,
      socialLinks: {
        facebook: data.facebook,
        instagram: data.instagram,
        linkedin: data.linkedin,
        twitter: data.twitter
      }
    };

    try {
      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success("Visitor data saved successfully!", { id: toastId });
        reset();
        setPhones([]);
        setEmails([]); // NEW: Reset emails
        setDonatedItems([]);
        setVisitSure(true);
      } else {
        const errorData = await response.json();
        toast.error(`Failed to save: ${errorData.error || 'Unknown error'}`, { id: toastId });
      }
    } catch (error) {
      console.error("Submission error:", error);
      toast.error("Network error. Please try again.", { id: toastId });
    }
  };

  return (
    <div className="p-8 w-full max-w-4xl mx-auto bg-slate-50 min-h-screen text-slate-900">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900">Visitor Certificate Form</h2>
        <p className="text-sm text-slate-500">Log a facility visit and generate a Certification of Appreciation.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-8 rounded-lg border border-slate-200 shadow-sm space-y-8">
        
        {/* Section 1: Visitor Basics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Visitor Name<span className="text-red-500 ml-1">*</span></label>
            <input 
              {...register("applicantName", { required: true })} 
              type="text" 
              className={`w-full p-2.5 border rounded-md outline-none focus:ring-2 focus:ring-blue-500 ${errors.applicantName ? 'border-red-500' : 'border-slate-300'}`} 
              placeholder="Full name" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Date of Visit<span className="text-red-500 ml-1">*</span></label>
            <input 
              {...register("visitDate", { required: true })} 
              type="date" 
              className={`w-full p-2.5 border rounded-md outline-none focus:ring-2 focus:ring-blue-500 ${errors.visitDate ? 'border-red-500' : 'border-slate-300'}`} 
            />
          </div>
          
          {/* Dynamic Dropdown UI */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Center Visited<span className="text-red-500 ml-1">*</span></label>
            <div className="relative">
              <select 
                {...register("centerVisited", { required: true })} 
                disabled={isLoadingCenters}
                className={`w-full p-2.5 border rounded-md bg-white text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-500 ${errors.centerVisited ? 'border-red-500' : 'border-slate-300'}`}
              >
                <option value="">{isLoadingCenters ? "Loading centers..." : "Select a center..."}</option>
                {availableCenters.map((center, i) => (
                  <option key={i} value={center}>{center}</option>
                ))}
              </select>
              {isLoadingCenters && <Loader2 className="absolute right-8 top-3 h-4 w-4 animate-spin text-slate-400" />}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Attendant Name<span className="text-red-500 ml-1">*</span></label>
            <input 
              {...register("attendantName", { required: true })} 
              type="text" 
              className={`w-full p-2.5 border rounded-md outline-none focus:ring-2 focus:ring-blue-500 ${errors.attendantName ? 'border-red-500' : 'border-slate-300'}`} 
              placeholder="Assigned attendant" 
            />
          </div>
        </div>

        <hr className="border-slate-200" />

        {/* Section 2: Contact & Socials */}
        <div className="grid grid-cols-1 gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TagInput label="Phone Numbers *" placeholder="Enter phone and press Enter" tags={phones} setTags={setPhones} />
            <TagInput label="Email Addresses (Optional)" placeholder="Enter email and press Enter" tags={emails} setTags={setEmails} type="email" />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Address<span className="text-red-500 ml-1">*</span></label>
            <input 
              {...register("address", { required: true })} 
              type="text" 
              className={`w-full p-2.5 border rounded-md outline-none focus:ring-2 focus:ring-blue-500 ${errors.address ? 'border-red-500' : 'border-slate-300'}`} 
              placeholder="Enter Address" 
            />
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <label className="block text-sm font-medium text-slate-700 mb-4">Social Media Links (Optional)</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input {...register("facebook")} type="url" className="w-full p-2 border border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500" placeholder="Facebook URL" />
              <input {...register("instagram")} type="url" className="w-full p-2 border border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500" placeholder="Instagram URL" />
              <input {...register("linkedin")} type="url" className="w-full p-2 border border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500" placeholder="LinkedIn URL" />
              <input {...register("twitter")} type="url" className="w-full p-2 border border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500" placeholder="Twitter URL" />
            </div>
          </div>
        </div>

        <hr className="border-slate-200" />

        {/* Section 3: Visit Details & Media */}
        <div className="grid grid-cols-1 gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Purpose of Visit<span className="text-red-500 ml-1">*</span></label>
              <select 
                {...register("purpose", { required: true })} 
                className="w-full p-2.5 border border-slate-300 rounded-md bg-white text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Birthday Celebration">Birthday Celebration</option>
                <option value="Corporate CSR">Corporate CSR</option>
                <option value="Family Event">Family Event</option>
                <option value="General">General</option>
                <option value="Other">Other (Please specify)</option>
              </select>
            </div>
            {currentPurpose === "Other" ? (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                <label className="text-sm font-medium text-slate-700">Specify Other Purpose<span className="text-red-500 ml-1">*</span></label>
                <input 
                  {...register("otherPurpose", { required: true })} 
                  type="text" 
                  className={`w-full p-2.5 border rounded-md outline-none focus:ring-2 focus:ring-blue-500 ${errors.otherPurpose ? 'border-red-500' : 'border-slate-300'}`} 
                  placeholder="Enter custom purpose..." 
                />
              </div>
            ) : (
              <div className="hidden md:block"></div> 
            )}
          </div>

          <KeyValueInput items={donatedItems} setItems={setDonatedItems} />

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Upload Photos (Google Drive Link)</label>
            <input 
              {...register("photosLink")} 
              type="url" 
              className="w-full p-2.5 border border-slate-300 rounded-md outline-none bg-white focus:ring-2 focus:ring-blue-500 text-blue-600" 
              placeholder="https://drive.google.com/..." 
            />
          </div>
        </div>

        {/* Section 4: Post-Visit Data */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-lg border border-slate-200">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Have helped financially?<span className="text-red-500 ml-1">*</span></label>
              <select 
                {...register("helpedFinancially", { required: true })} 
                className="w-full p-2.5 border border-slate-300 rounded-md bg-white text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>
            {currentHelpedFinancially === "Yes" && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                <label className="text-sm font-medium text-slate-700">Enter Amount (₹)<span className="text-red-500 ml-1">*</span></label>
                <input 
                  {...register("financialAmount", { required: true })} 
                  type="number" 
                  className={`w-full p-2.5 border rounded-md outline-none focus:ring-2 focus:ring-blue-500 ${errors.financialAmount ? 'border-red-500' : 'border-slate-300'}`} 
                  placeholder="0.00" 
                />
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700">Next Follow up Due</label>
              <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                <input 
                  type="checkbox" 
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  checked={!visitSure}
                  onChange={() => setVisitSure(!visitSure)}
                />
                Not sure yet
              </label>
            </div>
            <input 
              {...register("nextFollowUpDue", { required: visitSure })}
              type="date" 
              disabled={!visitSure}
              className={`w-full p-2.5 border rounded-md outline-none transition-colors ${!visitSure ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' : 'bg-white border-slate-300 text-slate-900 focus:ring-2 focus:ring-blue-500'} ${errors.nextFollowUpDue ? 'border-red-500' : ''}`} 
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Additional Remarks</label>
          <textarea 
            {...register("remarks")} 
            className="w-full p-2.5 border border-slate-300 rounded-md h-20 outline-none bg-white focus:ring-2 focus:ring-blue-500 text-slate-900" 
            placeholder="Add any extra notes here..."
          ></textarea>
        </div>

        <div className="pt-4 flex justify-end gap-4">
          <button 
            type="button" 
            onClick={() => { reset(); setPhones([]); setEmails([]); setDonatedItems([]); setVisitSure(true); }}
            className="px-6 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
          >
            Clear
          </button>
          <button 
            type="submit" 
            disabled={isSubmitting || isLoadingCenters} 
            className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Save Visitor Data'}
          </button>
        </div>
      </form>
    </div>
  );
}