'use client';

import { useState, Suspense } from "react";
import { useForm, SubmitHandler } from 'react-hook-form';
import { useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import SubmissionControls from "@/modules/submissions/SubmissionControls";

type VolunteerFormInputs = {
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

function VolunteerForm() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [savedRecord, setSavedRecord] = useState<any>(null);

  const searchParams = useSearchParams();

  const { 
    register, 
    handleSubmit, 
    reset, 
    watch,
    formState: { isSubmitting, errors } 
  } = useForm<VolunteerFormInputs>({
    defaultValues: {
      donationType: 'No',
      applicantName: searchParams.get('name') || '',
      email: searchParams.get('email') || '',
      phone: searchParams.get('phone') || '',
      gender: searchParams.get('gender') || 'Male',
      universityName: searchParams.get('university') || '',
    }
  });

  // eslint-disable-next-line react-hooks/incompatible-library
  const currentDonationType = watch("donationType");

  const onSubmit: SubmitHandler<VolunteerFormInputs> = async (data) => {
    const toastId = toast.loading("Saving volunteer data...");
    setSavedRecord(null);

    try {
      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          certificateType: 'VOLUNTEER', 
        }),
      });

      const json = await response.json();

      if (response.ok) {
        toast.success("Volunteer data saved successfully!", { id: toastId });
        setSavedRecord(json.data); 
        reset(); 
      } else {
        toast.error(`Failed to save: ${json.error || 'Unknown error'}`, { id: toastId });
      }
    } catch (error) {
      console.error("Submission error:", error);
      toast.error("Network error. Please try again.", { id: toastId });
    }
  };

  return (
    <div className="p-8 w-full max-w-4xl mx-auto bg-slate-50 min-h-screen text-slate-900">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900">Volunteer Certificate Form</h2>
        <p className="text-sm text-slate-500">Fill in the volunteer details to generate their completion certificate.</p>
      </div>

      {savedRecord && (
        <div className="mb-8 p-6 bg-blue-50 border border-blue-200 rounded-lg animate-in fade-in slide-in-from-top-4">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Record Saved Successfully!</h3>
          <p className="text-sm text-blue-800 mb-4">You can now generate and send the certificate directly from here, or fill the form again to add another record.</p>
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
        </div>
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
              placeholder="volunteer@example.com" 
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

        {/* Volunteer Details */}
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
              placeholder="e.g. Content Writer, Teacher" 
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

          {/* Conditional Rendering for Financial Amount */}
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
          <button 
            type="button" 
            onClick={() => reset()} 
            className="px-6 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
          >
            Clear
          </button>
          
          <button 
            type="submit" 
            disabled={isSubmitting} 
            className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Save Volunteer Data'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function VolunteerCertificatePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading form...</div>}>
      <VolunteerForm />
    </Suspense>
  );
}