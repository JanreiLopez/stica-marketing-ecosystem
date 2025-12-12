import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase-client';
import { toast } from 'sonner';

export interface InquiryRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  inquiry_type: string;
  student_type: string;
  program: string;
  status: string;
  created_at: string;
  how_did_you_find_out: string[];
  referral_source: string[];
  events_description: string;
  others_specify: string;
  present_school: string;
}

export interface InquiryFormData {
  inquiryType: string;
  studentType: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  program: string[];
  howDidYouFindOut: string[];
  referralSource: string[];
  eventsDescription: string;
  othersSpecify: string;
  presentSchool: string;
}

interface UseInquiryManagementProps {
  setEditingInquiryId: (id: string | null) => void;
  setInquiryFormData: (data: InquiryFormData) => void;
  setIsInquiryDialogOpen: (isOpen: boolean) => void;
  fetchInquiries: () => Promise<void>;
  inquiries: InquiryRecord[];
}

export const useInquiryManagement = ({ 
  setEditingInquiryId, 
  setInquiryFormData, 
  setIsInquiryDialogOpen, 
  fetchInquiries,
  inquiries
}: UseInquiryManagementProps) => {

  const INITIAL_FORM_DATA: InquiryFormData = {
    inquiryType: "", studentType: "", firstName: "", lastName: "", email: "", phone: "", program: [], howDidYouFindOut: [], referralSource: [], eventsDescription: "", othersSpecify: "", presentSchool: ""
  };

  const handleEditInquiry = useCallback(async (inquiry: InquiryRecord) => {
    setEditingInquiryId(inquiry.id);
    
    const { data: fullInquiry, error } = await supabase.from("inquiries").select("*").eq("id", inquiry.id).single();
    if (error) { toast.error("Error loading inquiry data. Please try again."); return; }
    if (!fullInquiry) { toast.error("Inquiry not found."); return; }

    const nameParts = fullInquiry.name?.split(" ") || [];
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";
    
    const programMap: { [key: string]: string } = {
      "BS Information Technology": "bsit", "BS Computer Science": "bscs", "BS Hospitality Management": "bshm", "BS Tourism Management": "bstm", "BS Business Administration": "bsba", "IT in Mobile App and Web Development": "it-mobile", "Humanities and Social Sciences (HUMMS)": "humms", "Accountancy, Business, and Management (ABM)": "abm",
    };
    
    const programs = fullInquiry.program ? fullInquiry.program.split(", ").map((p: string) => programMap[p.trim()]).filter((p: string) => p) : [];
    const studentType = fullInquiry.student_type === "College" ? "tertiary" : "senior-high";
    const phone = fullInquiry.phone?.replace(/[^\d]/g, "") || "";
    const inquiryType = fullInquiry.inquiry_type || "";
    const howDidYouFindOut = Array.isArray(fullInquiry.how_did_you_find_out) ? fullInquiry.how_did_you_find_out : [];
    const referralSource = Array.isArray(fullInquiry.referral_source) ? fullInquiry.referral_source : [];
    const eventsDescription = fullInquiry.events_description || "";
    const othersSpecify = fullInquiry.others_specify || "";
    const presentSchool = fullInquiry.present_school || "";
    
    setInquiryFormData({
      ...INITIAL_FORM_DATA, inquiryType, studentType, firstName, lastName, email: fullInquiry.email || "", phone, program: programs, howDidYouFindOut, referralSource, eventsDescription, othersSpecify, presentSchool,
    });

    setIsInquiryDialogOpen(true);
  }, [setEditingInquiryId, setInquiryFormData, setIsInquiryDialogOpen, inquiries]);

  return { handleEditInquiry };
};
