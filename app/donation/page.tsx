/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/incompatible-library */
"use client";

import { useState, KeyboardEvent, useEffect, useRef, Suspense } from "react";
import { useForm, SubmitHandler } from 'react-hook-form';
import { useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { X, Plus, Loader2, Save } from "lucide-react";
import SubmissionControls from "@/modules/submissions/SubmissionControls";

// --- SMART TAG INPUT ---
const TagInput = ({ label, placeholder, tags, setTags, inputRef, type = "text" }: { label: string, placeholder: string, tags: string[], setTags: (tags: string[]) => void, inputRef: React.MutableRefObject<string>, type?: string }) => {
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
          type={type}
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
        
        <div className="flex flex-col sm:flex-row gap-2">
          <input 
            type="text" 
            value={itemName} 
            onChange={handleNameChange} 
            placeholder="Item name (e.g. Books, Clothes)" 
            className="flex-1 p-2 text-sm border border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500"
          />
          
          <div className="flex gap-2 w-full sm:w-auto">
            <input 
              type="number" 
              value={itemQty} 
              onChange={handleQtyChange} 
              placeholder="Qty" 
              min="1"
              className="w-full sm:w-24 p-2 text-sm border border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button 
              type="button" 
              onClick={handleAddItem}
              className="p-2 px-4 sm:px-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors flex items-center justify-center shrink-0"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
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
type DonorFormInputs = {
  applicantName: string;
  attendantName: string;
  logisticsMethod: string;
  pickupAddress?: string; 
  pickupChargesPaidBy: string;
  pickupDoneBy: string;
  centerVisited: string;
  facebook: string;
  instagram: string;
  linkedin: string;
  twitter: string;
  helpedFinancially: string;
  financialAmount?: string;
  nextFollowUpDue?: string;
  photosLink: string;
  remarks: string;
};

function DonationForm() {
  const searchParams = useSearchParams();
  
  // EXTRACT PARAMS
  const editId = searchParams.get('editId');
  const paramName = searchParams.get('name') || '';
  const paramPhone = searchParams.get('phone') || '';
  const paramEmail = searchParams.get('email') || '';
  const paramAddress = searchParams.get('address') || '';
  const paramFb = searchParams.get('facebook') || '';
  const paramInsta = searchParams.get('instagram') || '';
  const paramLi = searchParams.get('linkedin') || '';
  const paramTw = searchParams.get('twitter') || '';
  const paramItems = searchParams.get('items'); 

  const [emails, setEmails] = useState<string[]>([]);
  const [phones, setPhones] = useState<string[]>([]);
  const [donatedItems, setDonatedItems] = useState<DonatedItem[]>([]);
  const [visitSure, setVisitSure] = useState(true);
  const [isFetchingEdit, setIsFetchingEdit] = useState(!!editId);

  const [savedRecord, setSavedRecord] = useState<any>(null);

  // Auto-Save Refs
  const pendingPhone = useRef("");
  const pendingEmail = useRef("");
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
  } = useForm<DonorFormInputs>({
    defaultValues: {
      logisticsMethod: 'Drop',
      helpedFinancially: 'No',
      centerVisited: '',
      pickupChargesPaidBy: 'Donor'
    }
  });

  // HYDRATE FROM URL PARAMS (COPY)
  useEffect(() => {
    if (!editId) {
      if (paramName) setValue("applicantName", paramName);
      if (paramAddress) setValue("pickupAddress", paramAddress); 
      if (paramFb) setValue("facebook", paramFb);
      if (paramInsta) setValue("instagram", paramInsta);
      if (paramLi) setValue("linkedin", paramLi);
      if (paramTw) setValue("twitter", paramTw);
      if (paramPhone) setPhones([paramPhone]);
      if (paramEmail) setEmails([paramEmail]);
      if (paramItems) {
        try {
          const parsedItems = JSON.parse(paramItems);
          if (Array.isArray(parsedItems) && parsedItems.length > 0) {
            setDonatedItems(parsedItems);
          }
        } catch (e) { console.error(e) }
      }
    }
  }, [editId, searchParams, setValue, paramName, paramAddress, paramFb, paramInsta, paramLi, paramTw, paramPhone, paramEmail, paramItems]);

  // HYDRATE FROM DB (EDIT)
  useEffect(() => {
    if (editId) {
      const fetchRecordToEdit = async () => {
        try {
          const res = await fetch(`/api/submissions?id=${editId}`);
          const json = await res.json();
          if (json.success && json.data) {
            const d = json.data;
            setValue("applicantName", d.applicantName || "");
            setValue("attendantName", d.attendantName || "");
            setValue("logisticsMethod", d.logisticsMethod || "Drop");
            if (d.logisticsMethod === 'Pickup') {
               setValue("pickupAddress", d.facilityLocation || "");
               setValue("pickupChargesPaidBy", d.pickupChargesPaidBy || "Donor");
               setValue("pickupDoneBy", d.pickupDoneBy || "");
            } else {
               setValue("centerVisited", d.facilityLocation || "");
            }
            setValue("helpedFinancially", d.helpedFinancially ? 'Yes' : 'No');
            if (d.financialAmount) setValue("financialAmount", String(d.financialAmount));
            if (d.nextFollowUpDue) {
              setValue("nextFollowUpDue", new Date(d.nextFollowUpDue).toISOString().split('T')[0]);
              setVisitSure(true);
            } else {
              setVisitSure(false);
            }
            setValue("photosLink", d.uploadPhotosLink || "");
            setValue("remarks", d.additionalRemarks || "");
            if (d.socialLinks) {
              setValue("facebook", (d.socialLinks as any).facebook || "");
              setValue("instagram", (d.socialLinks as any).instagram || "");
              setValue("linkedin", (d.socialLinks as any).linkedin || "");
              setValue("twitter", (d.socialLinks as any).twitter || "");
            }
            setPhones(d.phones || []);
            setEmails(d.emails || []);
            if (d.itemsDonated) setDonatedItems(d.itemsDonated);
          } else {
            toast.error("Could not load record for editing.");
          }
        } catch (err) {
          toast.error("Network error loading record.");
        } finally {
          setIsFetchingEdit(false);
        }
      };
      fetchRecordToEdit();
    }
  }, [editId, setValue]);

  const currentLogistics = watch("logisticsMethod");
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

  const onSubmit: SubmitHandler<DonorFormInputs> = async (data) => {
    setSavedRecord(null);

    // Auto-Save pending inputs
    const finalPhones = [...phones];
    if (pendingPhone.current && !finalPhones.includes(pendingPhone.current)) finalPhones.push(pendingPhone.current);

    const finalEmails = [...emails];
    if (pendingEmail.current && !finalEmails.includes(pendingEmail.current)) finalEmails.push(pendingEmail.current);

    const finalItems = [...donatedItems];
    if (pendingItemName.current && pendingItemQty.current) {
        finalItems.push({ item: pendingItemName.current, quantity: parseInt(pendingItemQty.current) });
    }

    if (finalPhones.length === 0) {
      toast.error("At least one phone number is required.");
      return;
    }
    if (finalItems.length === 0) {
      toast.error("You must add at least one donated item.");
      return;
    }

    const toastId = toast.loading(editId ? "Updating record..." : "Saving donation data...");

    let compiledRemarks = data.remarks || "";
    if (data.logisticsMethod === 'Pickup') {
      compiledRemarks = `[PICKUP DETAILS] Paid by: ${data.pickupChargesPaidBy} | Handled by: ${data.pickupDoneBy || 'N/A'}. ${compiledRemarks}`;
    }

    const payload: any = {
      applicantName: data.applicantName,
      certificateType: 'DONOR',
      attendantName: data.attendantName,
      phones: finalPhones,
      emails: finalEmails,
      logisticsMethod: data.logisticsMethod,
      facilityLocation: data.logisticsMethod === 'Pickup' ? data.pickupAddress || "" : data.centerVisited,
      itemsDonated: finalItems,
      helpedFinancially: data.helpedFinancially === 'Yes',
      financialAmount: data.financialAmount ? parseFloat(data.financialAmount) : null,
      nextFollowUpDue: (visitSure && data.nextFollowUpDue) ? new Date(data.nextFollowUpDue).toISOString() : null,
      uploadPhotosLink: data.photosLink,
      additionalRemarks: compiledRemarks,
      socialLinks: {
        facebook: data.facebook,
        instagram: data.instagram,
        linkedin: data.linkedin,
        twitter: data.twitter
      }
    };

    if (editId) payload.id = editId;

    try {
      const response = await fetch('/api/submissions', {
        method: editId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await response.json();

      if (response.ok) {
        toast.success(editId ? "Record updated successfully!" : "Donation data saved successfully!", { id: toastId });
        setSavedRecord(json.data); 
        if (!editId) {
          reset();
          setPhones([]); setEmails([]); setDonatedItems([]); setVisitSure(true);
          pendingPhone.current = ""; pendingEmail.current = ""; pendingItemName.current = ""; pendingItemQty.current = "";
        }
      } else {
        toast.error(`Failed to save: ${json.error || 'Unknown error'}`, { id: toastId });
      }
    } catch (error) {
      toast.error("Network error. Please try again.", { id: toastId });
    }
  };

  if (isFetchingEdit) {
    return <div className="p-12 text-center text-slate-500 flex flex-col items-center"><Loader2 className="h-8 w-8 animate-spin mb-4 text-blue-500" /> Loading record data...</div>;
  }

  return (
    <div className="p-8 w-full max-w-4xl mx-auto bg-slate-50 min-h-screen text-slate-900">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900">
          {editId ? "Edit Donation Record" : "Donation In Kind Form"}
        </h2>
        <p className="text-sm text-slate-500">
          {editId ? "Update the details for this record below." : "Record item donations, logistics, and generate donor certificates."}
        </p>
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
            <label className="text-sm font-medium text-slate-700">Donor Name<span className="text-red-500 ml-1">*</span></label>
            <input 
              {...register("applicantName", { required: true })} 
              type="text" 
              className={`w-full p-2.5 border rounded-md outline-none focus:ring-2 focus:ring-blue-500 ${errors.applicantName ? 'border-red-500' : 'border-slate-300'}`} 
              placeholder="Full name" 
            />
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
          <TagInput label="Phone Numbers *" placeholder="Enter phone and press Enter" tags={phones} setTags={setPhones} inputRef={pendingPhone} />
          <TagInput label="Email Addresses" placeholder="Enter email and press Enter" tags={emails} setTags={setEmails} inputRef={pendingEmail} type="email" />
        </div>

        <hr className="border-slate-200" />

        <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-900">Logistics Method<span className="text-red-500 ml-1">*</span></label>
            <select 
              {...register("logisticsMethod", { required: true })} 
              className="w-full md:w-1/2 p-2.5 border border-slate-300 rounded-md bg-white text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Drop">Drop off at Center</option>
              <option value="Pickup">Pickup Required</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in">
            {currentLogistics === "Pickup" ? (
              <>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-slate-700">Address of Pickup (Optional)</label>
                  <textarea 
                    {...register("pickupAddress")} 
                    className="w-full p-2.5 border border-slate-300 rounded-md h-20 outline-none focus:ring-2 focus:ring-blue-500" 
                    placeholder="Enter full pickup address if available..."
                  ></textarea>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Pickup Charges Paid By</label>
                  <select {...register("pickupChargesPaidBy")} className="w-full p-2.5 border border-slate-300 rounded-md bg-white text-slate-900 outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="Donor">Donor</option>
                    <option value="Organisation">Organisation</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Pickup Done By</label>
                  <input 
                    {...register("pickupDoneBy")} 
                    type="text" 
                    className="w-full p-2.5 border border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500" 
                    placeholder="Name of logistics handler" 
                  />
                </div>
              </>
            ) : (
              <div className="space-y-2 md:col-span-2">
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
            )}
          </div>
        </div>

        <hr className="border-slate-200" />

        <div className="space-y-6">
          <KeyValueInput items={donatedItems} setItems={setDonatedItems} nameRef={pendingItemName} qtyRef={pendingItemQty} />
        </div>

        <hr className="border-slate-200" />

        <div className="grid grid-cols-1 gap-6">
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

        <div className="grid grid-cols-1 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Upload Photos (Google Drive Link)</label>
            <input {...register("photosLink")} type="url" className="w-full p-2.5 border border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-blue-600" placeholder="https://drive.google.com/..." />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Remarks</label>
            <textarea {...register("remarks")} className="w-full p-2.5 border border-slate-300 rounded-md h-20 outline-none focus:ring-2 focus:ring-blue-500 text-slate-900" placeholder="Add any extra notes here..."></textarea>
          </div>
        </div>

        <div className="pt-4 flex justify-end gap-4">
          {!editId && (
            <button 
              type="button" 
              onClick={() => { reset(); setPhones([]); setEmails([]); setDonatedItems([]); setVisitSure(true); }}
              className="px-6 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
            >
              Clear
            </button>
          )}
          <button 
            type="submit" 
            disabled={isSubmitting || isLoadingCenters} 
            className={`px-6 py-2.5 text-sm font-medium text-white rounded-md transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2 ${editId ? 'bg-amber-600 hover:bg-amber-700' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {isSubmitting ? 'Processing...' : (editId ? <><Save className="w-4 h-4" /> Update Record</> : 'Save Donation Data')}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function DonationCertificatePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading form...</div>}>
      <DonationForm />
    </Suspense>
  );
}