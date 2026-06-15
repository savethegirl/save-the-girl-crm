/* eslint-disable react-hooks/incompatible-library */
'use client';

import { useState, useEffect, Suspense } from "react";
import { useForm, SubmitHandler } from 'react-hook-form';
import { useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { Loader2, Save } from "lucide-react";
import SubmissionControls from "@/modules/submissions/SubmissionControls";

type InternFormInputs = {
  applicantName: string;
  email: string;
  phone: string;
  gender: string;
  startDate: string;
  endDate: string;
  mode: string;
  postRole: string;
  scheduleType: string;
  isUniversityRequirement: string;
  universityName: string;
  donationType: string;
  financialAmount?: string;
  rating: string; 
  photosLink: string;
  remarks: string;
};

function InternshipForm() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [savedRecord, setSavedRecord] = useState<any>(null);

  const searchParams = useSearchParams();
  const editId = searchParams.get('editId');
  const [isFetchingEdit, setIsFetchingEdit] = useState(!!editId);
  
  const { 
    register, 
    handleSubmit, 
    reset, 
    watch,
    setValue,
    formState: { isSubmitting, errors } 
  } = useForm<InternFormInputs>({
    defaultValues: {
      donationType: 'No',
      applicantName: searchParams.get('name') || '',
      email: searchParams.get('email') || '',
      phone: searchParams.get('phone') || '',
      gender: searchParams.get('gender') || 'Male',
      universityName: searchParams.get('university') || '',
    }
  });

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
            setValue("email", d.emails?.[0] || "");
            setValue("phone", d.phones?.[0] || "");
            setValue("gender", d.gender || "Male");
            if (d.startDate) setValue("startDate", new Date(d.startDate).toISOString().split('T')[0]);
            if (d.endDate) setValue("endDate", new Date(d.endDate).toISOString().split('T')[0]);
            setValue("mode", d.mode || "VIRTUAL");
            setValue("postRole", d.postRole || "");
            setValue("scheduleType", d.scheduleType || "DAILY");
            setValue("isUniversityRequirement", String(!!d.isUniversityRequirement));
            setValue("universityName", d.universityName || "");
            setValue("donationType", d.donationType || "No");
            if (d.financialAmount) setValue("financialAmount", String(d.financialAmount));
            if (d.rating) setValue("rating", String(d.rating));
            setValue("photosLink", d.uploadPhotosLink || "");
            setValue("remarks", d.additionalRemarks || "");
          } else {
            toast.error("Could not load record for editing.");
          }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
          toast.error("Network error loading record.");
          console.error(err);
        } finally {
          setIsFetchingEdit(false);
        }
      };
      fetchRecordToEdit();
    }
  }, [editId, setValue]);

  const currentDonationType = watch("donationType");

  const onSubmit: SubmitHandler<InternFormInputs> = async (data) => {
    const toastId = toast.loading(editId ? "Updating record..." : "Saving intern data...");
    setSavedRecord(null);

    // Map strictly to the DB structure
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payload: any = {
      applicantName: data.applicantName,
      certificateType: 'INTERN', 
      emails: data.email ? [data.email] : [],
      phones: data.phone ? [data.phone] : [],
      gender: data.gender,
      startDate: new Date(data.startDate).toISOString(),
      endDate: new Date(data.endDate).toISOString(),
      mode: data.mode,
      postRole: data.postRole,
      scheduleType: data.scheduleType,
      isUniversityRequirement: data.isUniversityRequirement === "true",
      universityName: data.universityName,
      donationType: data.donationType,
      helpedFinancially: data.donationType === "Financial" || data.donationType === "Both",
      financialAmount: data.financialAmount ? parseFloat(data.financialAmount) : null,
      rating: parseInt(data.rating),
      uploadPhotosLink: data.photosLink,
      additionalRemarks: data.remarks
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
        toast.success(editId ? "Record updated successfully!" : "Intern data saved successfully!", { id: toastId });
        setSavedRecord(json.data); 
        if (!editId) reset(); 
      } else {
        toast.error(`Failed to save: ${json.error || 'Unknown error'}`, { id: toastId });
      }
    } catch (error) {
      console.error("Submission error:", error);
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
          {editId ? "Edit Internship Record" : "Internship Certificate Form"}
        </h2>
        <p className="text-sm text-slate-500">
          {editId ? "Update the details for this record below." : "Fill in the student details to generate their completion certificate."}
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

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-8 rounded-lg border border-slate-200 shadow-sm space-y-6">
        
        {/* Basic Info & Contact */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Student Name<span className="text-red-500 ml-1">*</span></label>
            <input 
              {...register("applicantName", { required: true })} 
              type="text" 
              className={`w-full p-2.5 border rounded-md outline-none focus:ring-2 focus:ring-blue-500 ${errors.applicantName ? 'border-red-500' : 'border-slate-300'}`} 
              placeholder="Enter full name" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Email<span className="text-red-500 ml-1">*</span></label>
            <input 
              {...register("email", { required: true })} 
              type="email" 
              className={`w-full p-2.5 border rounded-md outline-none focus:ring-2 focus:ring-blue-500 ${errors.email ? 'border-red-500' : 'border-slate-300'}`} 
              placeholder="student@example.com" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Phone<span className="text-red-500 ml-1">*</span></label>
            <input 
              {...register("phone", { required: true })} 
              type="tel" 
              className={`w-full p-2.5 border rounded-md outline-none focus:ring-2 focus:ring-blue-500 ${errors.phone ? 'border-red-500' : 'border-slate-300'}`} 
              placeholder="+91..." 
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Gender<span className="text-red-500 ml-1">*</span></label>
            <select 
              {...register("gender", { required: true })} 
              className="w-full p-2.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Others">Others</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Start Date<span className="text-red-500 ml-1">*</span></label>
            <input 
              {...register("startDate", { required: true })} 
              type="date" 
              className={`w-full p-2.5 border rounded-md outline-none ${errors.startDate ? 'border-red-500' : 'border-slate-300'}`} 
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">End Date<span className="text-red-500 ml-1">*</span></label>
            <input 
              {...register("endDate", { required: true })} 
              type="date" 
              className={`w-full p-2.5 border rounded-md outline-none ${errors.endDate ? 'border-red-500' : 'border-slate-300'}`} 
            />
          </div>
        </div>

        <hr className="border-slate-200" />

        {/* Internship Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Mode<span className="text-red-500 ml-1">*</span></label>
            <select {...register("mode", { required: true })} className="w-full p-2.5 border border-slate-300 rounded-md outline-none">
              <option value="VIRTUAL">Virtual</option>
              <option value="OFFLINE">Offline</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Post / Role<span className="text-red-500 ml-1">*</span></label>
            <input 
              {...register("postRole", { required: true })} 
              type="text" 
              className={`w-full p-2.5 border rounded-md outline-none ${errors.postRole ? 'border-red-500' : 'border-slate-300'}`} 
              placeholder="e.g. Web Developer" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Schedule Type<span className="text-red-500 ml-1">*</span></label>
            <select {...register("scheduleType", { required: true })} className="w-full p-2.5 border border-slate-300 rounded-md outline-none">
              <option value="DAILY">Daily</option>
              <option value="WEEKLY">Weekly</option>
              <option value="FLEXIBLE">Flexible</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Voluntary or University<span className="text-red-500 ml-1">*</span></label>
            <select {...register("isUniversityRequirement", { required: true })} className="w-full p-2.5 border border-slate-300 rounded-md outline-none">
              <option value="false">Self Chosen</option>
              <option value="true">College Recommended</option>
            </select>
          </div>
        </div>

        {/* Additional Data */}
        <div className="grid grid-cols-1 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">University Name</label>
            <input 
              {...register("universityName")} 
              type="text" 
              className={`w-full p-2.5 border rounded-md outline-none border-slate-300`} 
              placeholder="Enter university name" 
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Donation Type</label>
              <select {...register("donationType")} className="w-full p-2.5 border border-slate-300 rounded-md outline-none">
                <option value="No">None</option>
                <option value="Non Financial">Non Financial</option>
                <option value="Financial">Financial</option>
                <option value="Both">Both</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Rating (1-5)<span className="text-red-500 ml-1">*</span></label>
              <input 
                {...register("rating", { required: true, min: 1, max: 5 })} 
                type="number" 
                className={`w-full p-2.5 border rounded-md outline-none ${errors.rating ? 'border-red-500' : 'border-slate-300'}`} 
                placeholder="5" 
              />
              {errors.rating && <span className="text-xs text-red-500 block mt-1">Must be between 1 and 5.</span>}
            </div>
          </div>

          {(currentDonationType === 'Financial' || currentDonationType === 'Both') && (
            <div className="space-y-2 p-4 bg-blue-50 border border-blue-100 rounded-md">
              <label className="text-sm font-medium text-blue-900">Financial Amount (₹)<span className="text-red-500 ml-1">*</span></label>
              <input 
                {...register("financialAmount", { required: true })} 
                type="number" 
                className={`w-full p-2.5 border rounded-md outline-none ${errors.financialAmount ? 'border-red-500' : 'border-slate-300'}`} 
                placeholder="Enter amount" 
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Photos / Google Drive Link</label>
            <input 
              {...register("photosLink")} 
              type="url" 
              className="w-full p-2.5 border border-slate-300 rounded-md outline-none text-blue-600" 
              placeholder="https://drive.google.com/..." 
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Remarks</label>
            <textarea 
              {...register("remarks")} 
              className="w-full p-2.5 border border-slate-300 rounded-md h-24 outline-none" 
              placeholder="Add any additional notes here..."
            ></textarea>
          </div>
        </div>

        {/* Form Actions */}
        <div className="mt-8 pt-6 border-t border-slate-200 flex justify-end gap-4">
          {!editId && (
            <button 
              type="button" 
              onClick={() => reset()} 
              className="px-6 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
            >
              Clear
            </button>
          )}
          
          <button 
            type="submit" 
            disabled={isSubmitting} 
            className={`px-6 py-2.5 text-sm font-medium text-white rounded-md transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2 ${editId ? 'bg-amber-600 hover:bg-amber-700' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {isSubmitting ? 'Processing...' : (editId ? <><Save className="w-4 h-4" /> Update Record</> : 'Save Intern Data')}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function InternshipCertificatePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading form...</div>}>
      <InternshipForm />
    </Suspense>
  );
}