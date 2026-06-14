/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/incompatible-library */
"use client";

import { useState, KeyboardEvent, useEffect, useRef, Suspense } from "react";
import { useForm, SubmitHandler } from 'react-hook-form';
import { useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { X, Plus, Loader2 } from "lucide-react";
import SubmissionControls from "@/modules/submissions/SubmissionControls";

// --- SMART TAG INPUT ---
const TagInput = ({ label, placeholder, tags, setTags, inputRef }: { label: string, placeholder: string, tags: string[], setTags: (tags: string[]) => void, inputRef: React.MutableRefObject<string> }) => {
  const [inputValue, setInputValue] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    inputRef.current = e.target.value; 
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputValue.trim() !== "") {
      e.preventDefault();
      if (!tags.includes(inputValue.trim())) {
        setTags([...tags, inputValue.trim()]);
      }
      setInputValue("");
      inputRef.current = "";
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
          type="text"
          value={inputValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          className="w-full text-sm outline-none bg-transparent placeholder:text-slate-400 text-slate-900"
          placeholder={tags.length === 0 ? placeholder : "Type and press Enter to add more..."}
        />
      </div>
    </div>
  );
};

type DonatedItem = { item: string; quantity: number };

const KeyValueInput = ({ items, setItems, nameRef, qtyRef }: { items: DonatedItem[], setItems: (items: DonatedItem[]) => void, nameRef: React.MutableRefObject<string>, qtyRef: React.MutableRefObject<string> }) => {
  const [itemName, setItemName] = useState("");
  const [itemQty, setItemQty] = useState("");

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => { setItemName(e.target.value); nameRef.current = e.target.value; };
  const handleQtyChange = (e: React.ChangeEvent<HTMLInputElement>) => { setItemQty(e.target.value); qtyRef.current = e.target.value; };

  const handleAddItem = () => {
    if (itemName.trim() && itemQty) {
      setItems([...items, { item: itemName.trim(), quantity: parseInt(itemQty) }]);
      setItemName(""); setItemQty("");
      nameRef.current = ""; qtyRef.current = "";
    }
  };

  const removeItem = (indexToRemove: number) => {
    setItems(items.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-700">Items Donated (Optional)</label>
      <div className="p-4 border border-slate-300 rounded-md bg-slate-50 space-y-4">
        <div className="flex gap-2">
          <input 
            type="text" 
            value={itemName} 
            onChange={handleNameChange} 
            placeholder="Item name (e.g. Books, Clothes)" 
            className="flex-1 p-2 text-sm border border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input 
            type="number" 
            value={itemQty} 
            onChange={handleQtyChange} 
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

// --- MAIN COMPONENT ---

type HostFormInputs = {
  applicantName: string;
  eventDate: string;
  facilityLocation: string;
  companyCoordinator: string;
  centerVisited: string;
  noOfChildren: string;
  reportUploadLink: string;
  futurePartnershipRemarks: string;
  helpedFinancially: string;
  financialAmount?: string;
  nextExpectedVisit?: string;
};

function HostForm() {
  const searchParams = useSearchParams();
  
  // EXTRACT PARAMS
  const paramName = searchParams.get('name') || '';
  const paramPhone = searchParams.get('phone') || '';
  const paramEmail = searchParams.get('email') || '';
  const paramAddress = searchParams.get('address') || '';
  const paramItems = searchParams.get('items'); // <--- Extract items

  const [emails, setEmails] = useState<string[]>([]);
  const [phones, setPhones] = useState<string[]>([]);
  const [caretakers, setCaretakers] = useState<string[]>([]);
  const [donatedItems, setDonatedItems] = useState<DonatedItem[]>([]);
  const [visitSure, setVisitSure] = useState(true);
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [savedRecord, setSavedRecord] = useState<any>(null);

  // Auto-Save Refs
  const pendingPhone = useRef("");
  const pendingEmail = useRef("");
  const pendingCaretaker = useRef("");
  const pendingItemName = useRef("");
  const pendingItemQty = useRef("");

  const [availableCenters, setAvailableCenters] = useState<string[]>([]);
  const [isLoadingCenters, setIsLoadingCenters] = useState(true);

  const { 
    register, 
    handleSubmit, 
    reset, 
    watch,
    setValue,
    formState: { isSubmitting, errors } 
  } = useForm<HostFormInputs>({
    defaultValues: {
      helpedFinancially: 'No',
      centerVisited: '' 
    }
  });

  // HYDRATE 
  useEffect(() => {
    if (paramName) setValue("applicantName", paramName);
    if (paramAddress) setValue("facilityLocation", paramAddress); 

    if (paramPhone) setPhones([paramPhone]);
    if (paramEmail) setEmails([paramEmail]);

    if (paramItems) {
      try {
        const parsedItems = JSON.parse(paramItems);
        if (Array.isArray(parsedItems) && parsedItems.length > 0) {
          setDonatedItems(parsedItems);
        }
      } catch (e) {
        console.error("Failed to parse items from URL", e);
      }
    }
  }, [searchParams, setValue, paramName, paramAddress, paramPhone, paramEmail, paramItems]);

  const currentHelpedFinancially = watch("helpedFinancially");

  useEffect(() => {
    const fetchCenters = async () => {
      try {
        const res = await fetch('/api/settings');
        const json = await res.json();
        if (json.success) setAvailableCenters(json.data);
      } catch (error) {
        toast.error("Failed to load active centers.");
      } finally {
        setIsLoadingCenters(false);
      }
    };
    fetchCenters();
  }, []);

  const onSubmit: SubmitHandler<HostFormInputs> = async (data) => {
    setSavedRecord(null);

    // Auto-Save pending inputs
    const finalPhones = [...phones];
    if (pendingPhone.current && !finalPhones.includes(pendingPhone.current)) finalPhones.push(pendingPhone.current);

    const finalEmails = [...emails];
    if (pendingEmail.current && !finalEmails.includes(pendingEmail.current)) finalEmails.push(pendingEmail.current);
    
    const finalCaretakers = [...caretakers];
    if (pendingCaretaker.current && !finalCaretakers.includes(pendingCaretaker.current)) finalCaretakers.push(pendingCaretaker.current);

    const finalItems = [...donatedItems];
    if (pendingItemName.current && pendingItemQty.current) {
        finalItems.push({ item: pendingItemName.current, quantity: parseInt(pendingItemQty.current) });
    }

    if (finalPhones.length === 0) {
      toast.error("At least one phone number is required.");
      return;
    }

    const toastId = toast.loading("Saving host data...");

    const payload = {
      applicantName: data.applicantName, 
      certificateType: 'HOST',
      eventDate: data.eventDate,
      facilityLocation: data.facilityLocation,
      companyCoordinator: data.companyCoordinator,
      centerVisited: data.centerVisited,
      noOfChildren: data.noOfChildren,
      phones: finalPhones,
      emails: finalEmails,
      caretakers: finalCaretakers,
      itemsDonated: finalItems.length > 0 ? finalItems : null,
      reportUploadLink: data.reportUploadLink,
      futurePartnershipRemarks: data.futurePartnershipRemarks,
      helpedFinancially: data.helpedFinancially === 'Yes',
      financialAmount: data.financialAmount,
      nextExpectedVisit: visitSure ? data.nextExpectedVisit : null,
    };

    try {
      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await response.json();

      if (response.ok) {
        toast.success("Host data saved successfully!", { id: toastId });
        setSavedRecord(json.data); // Trigger Controls
        reset();
        setPhones([]); setEmails([]); setCaretakers([]); setDonatedItems([]); setVisitSure(true);
        pendingPhone.current = ""; pendingEmail.current = ""; pendingCaretaker.current = ""; pendingItemName.current = ""; pendingItemQty.current = "";
      } else {
        toast.error(`Failed to save: ${json.error || 'Unknown error'}`, { id: toastId });
      }
    } catch (error) {
      toast.error("Network error. Please try again.", { id: toastId });
    }
  };

  return (
    <div className="p-8 w-full max-w-4xl mx-auto bg-slate-50 min-h-screen text-slate-900">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900">Host Certificate Form</h2>
        <p className="text-sm text-slate-500">Log an event host and generate their certification of appreciation.</p>
      </div>

      {savedRecord && (
        <SubmissionControls 
          id={savedRecord.id}
          currentStatus={savedRecord.status}
          applicantName={savedRecord.applicantName}
          certificateType={savedRecord.certificateType}
          applicantEmail={savedRecord.emails?.[0]} 
          hideStatusToggle={true} 
          hideTriggerButton={true}  
          autoOpenModal={true}        
          onCloseModal={() => setSavedRecord(null)}
        />
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-8 rounded-lg border border-slate-200 shadow-sm space-y-8">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Name of Host<span className="text-red-500 ml-1">*</span></label>
            <input 
              {...register("applicantName", { required: true })} 
              type="text" 
              className={`w-full p-2.5 border rounded-md outline-none focus:ring-2 focus:ring-blue-500 ${errors.applicantName ? 'border-red-500' : 'border-slate-300'}`} 
              placeholder="Host name" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Date of Event<span className="text-red-500 ml-1">*</span></label>
            <input 
              {...register("eventDate", { required: true })} 
              type="date" 
              className={`w-full p-2.5 border rounded-md outline-none focus:ring-2 focus:ring-blue-500 ${errors.eventDate ? 'border-red-500' : 'border-slate-300'}`} 
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Facility / Location<span className="text-red-500 ml-1">*</span></label>
            <input 
              {...register("facilityLocation", { required: true })} 
              type="text" 
              className={`w-full p-2.5 border rounded-md outline-none focus:ring-2 focus:ring-blue-500 ${errors.facilityLocation ? 'border-red-500' : 'border-slate-300'}`} 
              placeholder="Event location" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Company Coordinator<span className="text-red-500 ml-1">*</span></label>
            <input 
              {...register("companyCoordinator", { required: true })} 
              type="text" 
              className={`w-full p-2.5 border rounded-md outline-none focus:ring-2 focus:ring-blue-500 ${errors.companyCoordinator ? 'border-red-500' : 'border-slate-300'}`} 
              placeholder="Coordinator name" 
            />
          </div>
        </div>

        <hr className="border-slate-200" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TagInput label="Phone Numbers *" placeholder="Enter phone and press Enter" tags={phones} setTags={setPhones} inputRef={pendingPhone} />
          <TagInput label="Email Addresses (Optional)" placeholder="Enter email and press Enter" tags={emails} setTags={setEmails} inputRef={pendingEmail} />
        </div>

        <hr className="border-slate-200" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            <label className="text-sm font-medium text-slate-700">No. of Children Visited</label>
            <input 
              {...register("noOfChildren")} 
              type="number" 
              min="0" 
              className="w-full p-2.5 border border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500" 
              placeholder="e.g. 50" 
            />
          </div>
          
          <div className="md:col-span-2">
            <TagInput label="Names of Caretakers (Optional)" placeholder="Enter caretaker name and press Enter" tags={caretakers} setTags={setCaretakers} inputRef={pendingCaretaker} />
          </div>
        </div>

        <hr className="border-slate-200" />

        <div className="grid grid-cols-1 gap-6">
          <KeyValueInput items={donatedItems} setItems={setDonatedItems} nameRef={pendingItemName} qtyRef={pendingItemQty} />
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Report Upload (Google Drive Link)</label>
            <input {...register("reportUploadLink")} type="url" className="w-full p-2.5 border border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-blue-600" placeholder="https://drive.google.com/..." />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Future Partnership Remarks</label>
            <textarea {...register("futurePartnershipRemarks")} className="w-full p-2.5 border border-slate-300 rounded-md h-20 outline-none focus:ring-2 focus:ring-blue-500" placeholder="Add remarks..."></textarea>
          </div>
        </div>

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
              <label className="text-sm font-medium text-slate-700">Next Expected Visit</label>
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
              {...register("nextExpectedVisit", { required: visitSure })}
              type="date" 
              disabled={!visitSure}
              className={`w-full p-2.5 border rounded-md outline-none transition-colors ${!visitSure ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' : 'bg-white border-slate-300 text-slate-900 focus:ring-2 focus:ring-blue-500'} ${errors.nextExpectedVisit ? 'border-red-500' : ''}`} 
            />
          </div>
        </div>

        <div className="pt-4 flex justify-end gap-4">
          <button 
            type="button" 
            onClick={() => { reset(); setPhones([]); setEmails([]); setCaretakers([]); setDonatedItems([]); setVisitSure(true); }}
            className="px-6 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
          >
            Clear
          </button>
          <button 
            type="submit" 
            disabled={isSubmitting || isLoadingCenters} 
            className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Save Host Data'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function HostCertificatePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading form...</div>}>
      <HostForm />
    </Suspense>
  );
}