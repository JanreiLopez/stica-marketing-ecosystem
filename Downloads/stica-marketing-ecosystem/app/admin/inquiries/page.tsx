"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AdminBreadcrumbs } from "@/components/admin-breadcrumbs"
import { AdminSidebar } from "@/components/admin-sidebar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Search, Eye, MessageSquare, Phone, Mail, Edit, CheckCircle, AlertCircle, ArrowRight, Plus, ChevronDown, GraduationCap, Users, School, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { Checkbox } from "@/components/ui/checkbox"
import { supabase } from "@/lib/supabase-client"
import { EnrollmentForm } from "@/components/enrollment-form"
import {
  StudentFormData,
  createEmptyStudentFormData,
  mapProgramCodesToLabel,
  mapProgramStringToCodes,
} from "@/lib/enrollment-data"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

const INITIAL_FORM_DATA = {
  inquiryType: "",
  studentType: "",
  firstName: "",
  lastName: "",
  presentSchool: "",
  email: "",
  phone: "",
  programs: [] as string[],
  howDidYouFindOut: [] as string[],
  referralSource: [] as string[],
  eventsDescription: "",
  othersSpecify: "",
}

const STATUS_OPTIONS = ["For follow up", "Reserved (Registrants with 1000 payment)", "Enrolled (Full down payment)", "Enrolled to other STI", "Enroll to other school", "Undecided"]

type InquiryRecord = {
  id: number
  name: string
  email: string
  phone: string
  program: string
  status: string
  date: string
  studentType: string
  notes: string
}

const normalizeStudentType = (value?: string | null) => {
  if (!value) return "College"
  const normalized = value.toLowerCase()
  if (normalized.includes("senior")) return "Senior High"
  if (normalized.includes("high")) return "Senior High"
  return "College"
}

const mapRowToInquiry = (row: Record<string, any>): InquiryRecord => ({
  id: row.id,
  name: row.name ?? "Unnamed",
  email: row.email ?? "",
  phone: row.phone ?? "",
  program: row.program ?? "Not specified",
  status: row.status ?? "For follow up",
  date: row.date ?? row.created_at?.split("T")?.[0] ?? "",
  studentType: normalizeStudentType(row.student_type),
  notes: row.notes ?? "",
})

export default function InquiriesPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [editingInquiryId, setEditingInquiryId] = useState<number | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [updateMessage, setUpdateMessage] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)
  const [isInquiryDialogOpen, setIsInquiryDialogOpen] = useState(false)
  const [inquiryFormData, setInquiryFormData] = useState(INITIAL_FORM_DATA)
  const [inquiries, setInquiries] = useState<InquiryRecord[]>([])
  const [isLoadingInquiries, setIsLoadingInquiries] = useState(true)
  const [inquiryError, setInquiryError] = useState("")
  const [isCreatingInquiry, setIsCreatingInquiry] = useState(false)
  const [pendingEnrollmentInquiry, setPendingEnrollmentInquiry] = useState<InquiryRecord | null>(null)
  const [pendingStatus, setPendingStatus] = useState<string | null>(null)
  const [isEnrollConfirmOpen, setIsEnrollConfirmOpen] = useState(false)
  const [isEnrollmentDialogOpen, setIsEnrollmentDialogOpen] = useState(false)
  const [enrollmentFormData, setEnrollmentFormData] = useState<StudentFormData>(createEmptyStudentFormData)
  const [isSavingEnrollment, setIsSavingEnrollment] = useState(false)
  const [deletingInquiryId, setDeletingInquiryId] = useState<number | null>(null)

  const fetchInquiries = useCallback(async () => {
    setIsLoadingInquiries(true)
    setInquiryError("")
    const { data, error } = await supabase
      .from("inquiries")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      setInquiryError("Unable to load inquiries. Please check your Supabase connection.")
      setInquiries([])
    } else if (data) {
      setInquiries(data.map(mapRowToInquiry))
    }
    setIsLoadingInquiries(false)
  }, [])

  useEffect(() => {
    fetchInquiries()
  }, [fetchInquiries])

  const handleEditInquiry = (inquiry: any) => {
    // Parse name into first and last name
    const nameParts = inquiry.name.split(" ")
    const firstName = nameParts[0] || ""
    const lastName = nameParts.slice(1).join(" ") || ""
    
    // Parse program string back into array
    const programMap: { [key: string]: string } = {
      "BS Information Technology": "bsit",
      "BS Computer Science": "bscs",
      "BS Hospitality Management": "bshm",
      "BS Tourism Management": "bstm",
      "BS Business Administration": "bsba",
      "IT in Mobile App and Web Development": "it-mobile",
      "Humanities and Social Sciences (HUMMS)": "humms",
      "Accountancy, Business, and Management (ABM)": "abm",
    }
    
    const programs = inquiry.program
      .split(", ")
      .map((p: string) => programMap[p.trim()])
      .filter((p: string) => p)
    
    // Map studentType
    const studentType = inquiry.studentType === "College" ? "tertiary" : "senior-high"
    
    // Parse phone number - remove +63 prefix and spaces, keep only digits
    const phone = inquiry.phone.replace(/[^\d]/g, "")
    
    // Populate form with inquiry data
    setInquiryFormData({
      inquiryType: "", // Not stored in inquiry, default to empty
      studentType: studentType,
      firstName: firstName,
      lastName: lastName,
      presentSchool: "", // Not stored in inquiry, default to empty
      email: inquiry.email,
      phone: phone,
      programs: programs,
      howDidYouFindOut: [], // Not stored in inquiry, default to empty
      referralSource: [], // Not stored in inquiry, default to empty
      eventsDescription: "", // Not stored in inquiry, default to empty
      othersSpecify: "", // Not stored in inquiry, default to empty
    })
    
    setEditingInquiryId(inquiry.id)
    setIsEditDialogOpen(true)
  }

  const handleUpdateInquiry = async () => {
    if (!editingInquiryId) return
    
    setIsUpdating(true)
    
    const payload = {
      name: `${inquiryFormData.firstName} ${inquiryFormData.lastName}`.trim(),
      email: inquiryFormData.email,
      phone: inquiryFormData.phone,
      program: inquiryFormData.programs.join(", ") || "Not specified",
      student_type: inquiryFormData.studentType === "tertiary" ? "College" : "Senior High",
    }

    const { error } = await supabase
      .from("inquiries")
      .update(payload)
      .eq("id", editingInquiryId)
    
    if (error) {
      setUpdateMessage("Error updating inquiry. Please try again.")
    } else {
      setInquiries(prev =>
        prev.map(inquiry =>
          inquiry.id === editingInquiryId
            ? {
                ...inquiry,
                name: payload.name,
                email: payload.email,
                phone: payload.phone,
                program: payload.program,
                studentType: payload.student_type,
              }
            : inquiry,
        ),
      )
      
      setUpdateMessage("Inquiry updated successfully!")
      setTimeout(() => {
        setIsEditDialogOpen(false)
        setUpdateMessage("")
        setEditingInquiryId(null)
        resetForm()
      }, 1500)
    }
    
    setIsUpdating(false)
  }

  const handleDeleteInquiry = async () => {
    if (!deletingInquiryId) return
    
    const { error } = await supabase
      .from("inquiries")
      .delete()
      .eq("id", deletingInquiryId)
    
    if (error) {
      console.error("Error deleting inquiry:", error)
      alert("Error deleting inquiry. Please try again.")
    } else {
      setInquiries(prev => prev.filter(inquiry => inquiry.id !== deletingInquiryId))
    }
    
    setDeletingInquiryId(null)
  }

  const filteredInquiries = inquiries.filter((inquiry) => {
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch = 
      inquiry.name.toLowerCase().includes(searchLower) ||
      inquiry.email.toLowerCase().includes(searchLower) ||
      inquiry.program.toLowerCase().includes(searchLower)
    return matchesSearch && (statusFilter === "all" || inquiry.status.toLowerCase() === statusFilter)
  })

  const handleLogout = () => router.push("/admin/login")

  const getStatusColor = (status: string) => {
    switch (status) {
      case "For follow up":
        return "default"
      case "Reserved (Registrants with 1000 payment)":
        return "secondary"
      case "Enrolled (Full down payment)":
        return "success"
      case "Enrolled to other STI":
        return "destructive"
      case "Enroll to other school":
        return "destructive"
      case "Undecided":
        return "outline"
      default:
        return "secondary"
    }
  }

  const resetForm = () => setInquiryFormData(INITIAL_FORM_DATA)

  const handleArrayChange = (field: "programs" | "howDidYouFindOut" | "referralSource", value: string, checked: boolean) => {
    setInquiryFormData(prev => ({
      ...prev,
      [field]: checked ? [...prev[field], value] : prev[field].filter(id => id !== value)
    }))
  }

  const handleSubmitInquiry = async () => {
    if (isCreatingInquiry) return
    
    // Validate required fields
    if (!inquiryFormData.firstName.trim() || !inquiryFormData.lastName.trim()) {
      setInquiryError("First name and last name are required.")
      return
    }
    
    if (!inquiryFormData.email.trim()) {
      setInquiryError("Email is required.")
      return
    }
    
    if (!inquiryFormData.phone.trim()) {
      setInquiryError("Phone number is required.")
      return
    }
    
    setIsCreatingInquiry(true)
    setInquiryError("")

    // Verify Supabase client is initialized
    if (!supabase) {
      setInquiryError("Supabase connection not available. Please check your environment variables.")
      setIsCreatingInquiry(false)
      return
    }

    const payload = {
      name: `${inquiryFormData.firstName} ${inquiryFormData.lastName}`.trim(),
      email: inquiryFormData.email,
      phone: inquiryFormData.phone,
      program: inquiryFormData.programs.join(", ") || "Not specified",
      status: "For follow up",
      date: new Date().toISOString().split("T")[0],
      student_type: inquiryFormData.studentType === "tertiary" ? "College" : "Senior High",
      inquiry_type: inquiryFormData.inquiryType || null,
      present_school: inquiryFormData.presentSchool || null,
      how_did_you_find_out: inquiryFormData.howDidYouFindOut.length > 0 ? inquiryFormData.howDidYouFindOut : [],
      referral_source: inquiryFormData.referralSource.length > 0 ? inquiryFormData.referralSource : [],
      events_description: inquiryFormData.eventsDescription || null,
      others_specify: inquiryFormData.othersSpecify || null,
    }

    const { data, error } = await supabase.from("inquiries").insert(payload).select().single()

    if (error) {
      console.error("Supabase insert error:", error)
      console.error("Error details:", JSON.stringify(error, null, 2))
      console.error("Payload being sent:", JSON.stringify(payload, null, 2))
      console.error("Error code:", error.code)
      console.error("Error message:", error.message)
      console.error("Error details:", error.details)
      console.error("Error hint:", error.hint)
      
      const errorMessage = 
        error.message || 
        error.details || 
        error.hint || 
        error.code ||
        (typeof error === 'object' && Object.keys(error).length === 0 ? "Empty error object - check table exists and RLS policies" : JSON.stringify(error)) ||
        "Please check your connection and try again."
      
      setInquiryError(`Unable to submit inquiry: ${errorMessage}`)
    } else if (data) {
      setInquiries(prev => [mapRowToInquiry(data), ...prev])
      setInquiryError("")
      resetForm()
      setIsInquiryDialogOpen(false)
    }

    setIsCreatingInquiry(false)
  }

  const handleStatusChange = async (inquiryId: number, newStatus: string) => {
    if (newStatus === "Enrolled (Full down payment)") {
      const targetInquiry = inquiries.find((item) => item.id === inquiryId)
      if (!targetInquiry) return
      setPendingEnrollmentInquiry(targetInquiry)
      setPendingStatus(newStatus)
      setIsEnrollConfirmOpen(true)
      return
    }

    setInquiries(prev =>
      prev.map(inquiry =>
        inquiry.id === inquiryId ? { ...inquiry, status: newStatus } : inquiry,
      ),
    )

    await supabase
      .from("inquiries")
      .update({ status: newStatus })
      .eq("id", inquiryId)
  }

  const prepareEnrollmentFormFromInquiry = (inquiry: InquiryRecord) => {
    const template = createEmptyStudentFormData()
    const nameParts = inquiry.name.trim().split(" ").filter(Boolean)
    const firstName = nameParts[0] || ""
    const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : ""
    const middleName = nameParts.length > 2 ? nameParts.slice(1, -1).join(" ") : ""
    const programs = mapProgramStringToCodes(inquiry.program)
    const normalizedPhone = inquiry.phone.replace(/[^\d]/g, "")

    setEnrollmentFormData({
      ...template,
      firstName,
      middleName,
      lastName,
      email: inquiry.email,
      mobileNumber: normalizedPhone,
      studentType: inquiry.studentType === "College" ? "college" : "senior-high",
      programs,
      program: programs.length === 0 ? inquiry.program : "",
    })
  }

  const handleConfirmEnrollment = () => {
    if (!pendingEnrollmentInquiry) return
    prepareEnrollmentFormFromInquiry(pendingEnrollmentInquiry)
    setIsEnrollConfirmOpen(false)
    setIsEnrollmentDialogOpen(true)
  }

  const handleEnrollmentDialogChange = (open: boolean) => {
    setIsEnrollmentDialogOpen(open)
    if (!open) {
      setEnrollmentFormData(createEmptyStudentFormData())
      setPendingEnrollmentInquiry(null)
      setPendingStatus(null)
      setIsSavingEnrollment(false)
    }
  }

  const handleSubmitEnrollmentFromInquiry = async () => {
    if (!pendingEnrollmentInquiry || !pendingStatus) return
    if (!enrollmentFormData.firstName.trim() || !enrollmentFormData.lastName.trim()) return
    if (
      enrollmentFormData.collegeStudentType === "sti-transferee" &&
      enrollmentFormData.studentNumber.length !== 11
    ) {
      return
    }

    setIsSavingEnrollment(true)
    const programNames = mapProgramCodesToLabel(enrollmentFormData.programs, enrollmentFormData.program)
    const studentTypeLabel =
      enrollmentFormData.studentType === "college"
        ? "College"
        : enrollmentFormData.studentType === "senior-high"
          ? "Senior High"
          : ""

    const payload = {
      name: `${enrollmentFormData.firstName} ${
        enrollmentFormData.middleName ? enrollmentFormData.middleName + " " : ""
      }${enrollmentFormData.lastName}`.trim(),
      email: enrollmentFormData.email,
      phone: enrollmentFormData.mobileNumber || enrollmentFormData.landline || "N/A",
      program: programNames,
      date: new Date().toISOString().split("T")[0],
      student_type: studentTypeLabel,
      last_school_attended: enrollmentFormData.lastSchoolAttended
        ? enrollmentFormData.lastSchoolAttended
            .split("-")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ")
        : "Not specified",
      school_name: enrollmentFormData.schoolName || null,
      program_track_strand: enrollmentFormData.programTrackStrand || null,
      college_student_type: enrollmentFormData.studentType === "college" ? enrollmentFormData.collegeStudentType : null,
      student_number:
        enrollmentFormData.collegeStudentType === "sti-transferee" ? enrollmentFormData.studentNumber : null,
    }

    const { error } = await supabase.from("enrollments").insert(payload)

    if (!error) {
      await supabase.from("inquiries").update({ status: pendingStatus }).eq("id", pendingEnrollmentInquiry.id)
      setInquiries(prev =>
        prev.map(inquiry =>
          inquiry.id === pendingEnrollmentInquiry.id ? { ...inquiry, status: pendingStatus } : inquiry,
        ),
      )

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("enrollment-records-updated"))
      }
    }

    setIsSavingEnrollment(false)
    handleEnrollmentDialogChange(false)
  }

  // Calculate metrics for KPI cards
  const highSchoolCount = inquiries.filter(inquiry => 
    inquiry.studentType === "High School" || inquiry.studentType === "Senior High"
  ).length

  const collegeCount = inquiries.filter(inquiry => 
    inquiry.studentType === "College"
  ).length

  // Calculate top preferred program
  const programCounts: { [key: string]: number } = {}
  inquiries.forEach(inquiry => {
    const programs = inquiry.program.split(", ").filter(p => p.trim() !== "Not specified")
    programs.forEach(program => {
      programCounts[program] = (programCounts[program] || 0) + 1
    })
  })
  
  const topProgram = Object.entries(programCounts)
    .sort(([, a], [, b]) => b - a)[0]?.[0] || "N/A"
  const topProgramCount = Object.entries(programCounts)
    .sort(([, a], [, b]) => b - a)[0]?.[1] || 0

  return (
    <div className="min-h-screen bg-background">
        {/* Sidebar Navigation - Fixed */}
        <AdminSidebar onLogout={handleLogout} />

        {/* Main Content - Account for fixed sidebar */}
        <main className="ml-64 p-6">
          <AdminBreadcrumbs />
          
          <div className="mb-6">
            <h1 className="text-3xl font-serif font-bold text-foreground mb-2">Inquiries Management</h1>
            <p className="text-muted-foreground">Track and manage all program inquiries from prospective students</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Inquiries</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1,234</div>
                <p className="text-xs text-muted-foreground">+12% from last month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Top Preferred Programs</CardTitle>
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{topProgram}</div>
                <p className="text-xs text-muted-foreground">{topProgramCount} inquiries</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Number of College Students</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{collegeCount}</div>
                <p className="text-xs text-muted-foreground">College inquiries</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Number of High School Students</CardTitle>
                <School className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{highSchoolCount}</div>
                <p className="text-xs text-muted-foreground">High school inquiries</p>
              </CardContent>
            </Card>
          </div>

          {/* Actions Bar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="relative w-72">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search inquiries..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="for follow up">For follow up</SelectItem>
                  <SelectItem value="reserved">Reserved</SelectItem>
                  <SelectItem value="enrolled">Enrolled</SelectItem>
                  <SelectItem value="enrolled to other sti">Enrolled to other STI</SelectItem>
                  <SelectItem value="enroll to other school">Enroll to other school</SelectItem>
                  <SelectItem value="undecided">Undecided</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button 
              className="bg-primary hover:bg-primary/90"
              onClick={() => setIsInquiryDialogOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Inquiry
            </Button>
          </div>

          {/* Filters */}
          {/* Moved status filter next to search in actions bar */}

          {/* Inquiries Table */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Inquiries</CardTitle>
              <CardDescription>Manage and track all program inquiries</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Program</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Type of Student</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingInquiries ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                        Loading inquiries...
                      </TableCell>
                    </TableRow>
                  ) : inquiryError ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-red-500 py-10">
                        {inquiryError}
                      </TableCell>
                    </TableRow>
                  ) : filteredInquiries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                        No inquiries found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredInquiries.map((inquiry) => (
                      <TableRow key={inquiry.id}>
                        <TableCell className="font-medium">{inquiry.name}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-sm">
                              <Mail className="h-3 w-3" />
                              {inquiry.email}
                            </div>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              {inquiry.phone}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{inquiry.program}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="icon" className="h-7 w-7">
                                  <ChevronDown className="h-4 w-4" />
                                  <span className="sr-only">Change status</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="start" className="w-32">
                                {STATUS_OPTIONS.map((status) => (
                                  <DropdownMenuItem
                                    key={status}
                                    onSelect={(event) => {
                                      event.preventDefault()
                                      handleStatusChange(inquiry.id, status)
                                    }}
                                  >
                                    {status}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                            {inquiry.status.startsWith("Reserved") ? (
                              <Badge className="bg-blue-500 text-white border-blue-500">{inquiry.status}</Badge>
                            ) : inquiry.status.startsWith("Enrolled (Full down payment)") ? (
                              <Badge className="bg-green-600 text-white border-green-600">{inquiry.status}</Badge>
                            ) : inquiry.status === "Enrolled to other STI" ? (
                              <Badge className="bg-red-500 text-white border-red-500">{inquiry.status}</Badge>
                            ) : inquiry.status === "Enroll to other school" ? (
                              <Badge className="bg-red-500 text-white border-red-500">{inquiry.status}</Badge>
                            ) : (
                              <Badge variant={getStatusColor(inquiry.status) as any}>{inquiry.status}</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {inquiry.studentType === "College" ? (
                              <Badge className="bg-blue-800 text-white border-blue-800">{inquiry.studentType}</Badge>
                            ) : (
                              <Badge className="bg-yellow-500 text-black border-yellow-500">{inquiry.studentType}</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{inquiry.date}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleEditInquiry(inquiry)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setDeletingInquiryId(inquiry.id)}
                              className="hover:bg-red-50 hover:text-red-600 hover:border-red-300"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </main>

      {/* Edit Inquiry Dialog - Same as Add Inquiry */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        setIsEditDialogOpen(open)
        if (!open) {
          setEditingInquiryId(null)
          setUpdateMessage("")
          resetForm()
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Inquiry</DialogTitle>
            <DialogDescription>
              Update the inquiry information
            </DialogDescription>
          </DialogHeader>
          
          {updateMessage && (
            <Alert variant={updateMessage.includes("Error") ? "destructive" : "default"}>
              {updateMessage.includes("Error") ? (
                <AlertCircle className="h-4 w-4" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              <AlertDescription>{updateMessage}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-6">
            {/* Type of Inquiry and Type of Student */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-foreground uppercase">TYPE OF INQUIRY</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="edit-inquiry-online"
                      name="edit-inquiryType"
                      value="online"
                      checked={inquiryFormData.inquiryType === "online"}
                      onChange={(e) => setInquiryFormData(prev => ({ ...prev, inquiryType: e.target.value }))}
                      className="w-4 h-4 border border-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                    <Label htmlFor="edit-inquiry-online" className="text-sm">Online</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="edit-inquiry-walk-in"
                      name="edit-inquiryType"
                      value="walk-in"
                      checked={inquiryFormData.inquiryType === "walk-in"}
                      onChange={(e) => setInquiryFormData(prev => ({ ...prev, inquiryType: e.target.value }))}
                      className="w-4 h-4 border border-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                    <Label htmlFor="edit-inquiry-walk-in" className="text-sm">Walk-in</Label>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-foreground uppercase">TYPE OF STUDENT</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="edit-inquiry-senior-high"
                      name="edit-studentType"
                      value="senior-high"
                      checked={inquiryFormData.studentType === "senior-high"}
                      onChange={(e) => setInquiryFormData(prev => ({ ...prev, studentType: e.target.value }))}
                      className="w-4 h-4 border border-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                    <Label htmlFor="edit-inquiry-senior-high" className="text-sm">Senior High School</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="edit-inquiry-tertiary"
                      name="edit-studentType"
                      value="tertiary"
                      checked={inquiryFormData.studentType === "tertiary"}
                      onChange={(e) => setInquiryFormData(prev => ({ ...prev, studentType: e.target.value }))}
                      className="w-4 h-4 border border-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                    <Label htmlFor="edit-inquiry-tertiary" className="text-sm">Tertiary</Label>
                  </div>
                </div>
              </div>
            </div>

            {/* Personal Information Section */}
            <div className="space-y-4">
              <Label className="text-sm font-semibold text-foreground uppercase">PERSONAL INFORMATION</Label>
              
              <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                  <Label htmlFor="edit-inquiry-firstName">First Name</Label>
                  <Input 
                    id="edit-inquiry-firstName" 
                    placeholder="Enter your first name" 
                    value={inquiryFormData.firstName}
                    onChange={(e) => setInquiryFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    className="border border-gray-400 focus-visible:ring-orange-500 focus-visible:border-orange-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-inquiry-lastName">Last Name</Label>
                  <Input 
                    id="edit-inquiry-lastName" 
                    placeholder="Enter your last name" 
                    value={inquiryFormData.lastName}
                    onChange={(e) => setInquiryFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    className="border border-gray-400 focus-visible:ring-orange-500 focus-visible:border-orange-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-inquiry-presentSchool">Present School</Label>
                <Input 
                  id="edit-inquiry-presentSchool" 
                  placeholder="Enter your current school" 
                  value={inquiryFormData.presentSchool}
                  onChange={(e) => setInquiryFormData(prev => ({ ...prev, presentSchool: e.target.value }))}
                  className="border border-gray-400 focus-visible:ring-orange-500 focus-visible:border-orange-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-inquiry-email">Email Address</Label>
                <Input 
                  id="edit-inquiry-email" 
                  type="email" 
                  placeholder="Enter your email address" 
                  value={inquiryFormData.email}
                  onChange={(e) => setInquiryFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="border border-gray-400 focus-visible:ring-orange-500 focus-visible:border-orange-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-inquiry-phone">Phone Number</Label>
                <Input 
                  id="edit-inquiry-phone" 
                  type="tel" 
                  placeholder="Enter your phone number" 
                  value={inquiryFormData.phone}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (/^\d*$/.test(value)) {
                      setInquiryFormData(prev => ({ ...prev, phone: value }));
                    }
                  }}
                  className="border border-gray-400 focus-visible:ring-orange-500 focus-visible:border-orange-500"
                />
              </div>
            </div>

            {/* Programs of Interest */}
            <div className="space-y-4">
              <Label className="text-sm font-semibold text-foreground uppercase">PROGRAMS OF INTEREST</Label>
              
              {inquiryFormData.studentType === "tertiary" && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-foreground">College Programs</h4>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="edit-inquiry-bsit" 
                        checked={inquiryFormData.programs.includes('bsit')}
                        onCheckedChange={(checked) => handleArrayChange('programs', 'bsit', checked as boolean)}
                        className="border border-gray-400"
                      />
                      <Label htmlFor="edit-inquiry-bsit" className="text-sm">
                        BS Information Technology (BSIT)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="edit-inquiry-bscs" 
                        checked={inquiryFormData.programs.includes('bscs')}
                        onCheckedChange={(checked) => handleArrayChange('programs', 'bscs', checked as boolean)}
                        className="border border-gray-400"
                      />
                      <Label htmlFor="edit-inquiry-bscs" className="text-sm">
                        BS Computer Science (BSCS)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="edit-inquiry-bshm" 
                        checked={inquiryFormData.programs.includes('bshm')}
                        onCheckedChange={(checked) => handleArrayChange('programs', 'bshm', checked as boolean)}
                        className="border border-gray-400"
                      />
                      <Label htmlFor="edit-inquiry-bshm" className="text-sm">
                        BS Hospitality Management (BSHM)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="edit-inquiry-bstm" 
                        checked={inquiryFormData.programs.includes('bstm')}
                        onCheckedChange={(checked) => handleArrayChange('programs', 'bstm', checked as boolean)}
                        className="border border-gray-400"
                      />
                      <Label htmlFor="edit-inquiry-bstm" className="text-sm">
                        BS Tourism Management (BSTM)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="edit-inquiry-bsba" 
                        checked={inquiryFormData.programs.includes('bsba')}
                        onCheckedChange={(checked) => handleArrayChange('programs', 'bsba', checked as boolean)}
                        className="border border-gray-400"
                      />
                      <Label htmlFor="edit-inquiry-bsba" className="text-sm">
                        BS Business Administration (BSBA)
                      </Label>
                    </div>
                  </div>
                </div>
              )}

              {inquiryFormData.studentType === "senior-high" && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-foreground">Senior High School Programs</h4>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="edit-inquiry-it-mobile" 
                        checked={inquiryFormData.programs.includes('it-mobile')}
                        onCheckedChange={(checked) => handleArrayChange('programs', 'it-mobile', checked as boolean)}
                        className="border border-gray-400"
                      />
                      <Label htmlFor="edit-inquiry-it-mobile" className="text-sm">
                        IT in Mobile App and Web Development
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="edit-inquiry-humms" 
                        checked={inquiryFormData.programs.includes('humms')}
                        onCheckedChange={(checked) => handleArrayChange('programs', 'humms', checked as boolean)}
                        className="border border-gray-400"
                      />
                      <Label htmlFor="edit-inquiry-humms" className="text-sm">
                        Humanities and Social Sciences (HUMMS)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="edit-inquiry-abm" 
                        checked={inquiryFormData.programs.includes('abm')}
                        onCheckedChange={(checked) => handleArrayChange('programs', 'abm', checked as boolean)}
                        className="border border-gray-400"
                      />
                      <Label htmlFor="edit-inquiry-abm" className="text-sm">
                        Accountancy, Business, and Management (ABM)
                      </Label>
                    </div>
                  </div>
                </div>
              )}

              {!inquiryFormData.studentType && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Please select your student type above to see available programs.</p>
                </div>
              )}
            </div>

            {/* How Did You Find Out About STI Section */}
            <div className="space-y-4">
              <Label className="text-sm font-semibold text-foreground uppercase">HOW DID YOU FIND OUT ABOUT STI?</Label>
              
              <div className="space-y-4">
                {/* Main Options */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="edit-inquiry-tv" 
                      checked={inquiryFormData.howDidYouFindOut.includes('tv')}
                      onCheckedChange={(checked) => handleArrayChange('howDidYouFindOut', 'tv', checked as boolean)}
                      className="border border-gray-400"
                    />
                    <Label htmlFor="edit-inquiry-tv" className="text-sm">TV</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="edit-inquiry-outdoor" 
                      checked={inquiryFormData.howDidYouFindOut.includes('outdoor')}
                      onCheckedChange={(checked) => handleArrayChange('howDidYouFindOut', 'outdoor', checked as boolean)}
                      className="border border-gray-400"
                    />
                    <Label htmlFor="edit-inquiry-outdoor" className="text-sm">OUTDOOR (Billboard, Banners, Streamers)</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="edit-inquiry-radio" 
                      checked={inquiryFormData.howDidYouFindOut.includes('radio')}
                      onCheckedChange={(checked) => handleArrayChange('howDidYouFindOut', 'radio', checked as boolean)}
                      className="border border-gray-400"
                    />
                    <Label htmlFor="edit-inquiry-radio" className="text-sm">RADIO</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="edit-inquiry-print" 
                      checked={inquiryFormData.howDidYouFindOut.includes('print')}
                      onCheckedChange={(checked) => handleArrayChange('howDidYouFindOut', 'print', checked as boolean)}
                      className="border border-gray-400"
                    />
                    <Label htmlFor="edit-inquiry-print" className="text-sm">PRINT (Newspaper)</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="edit-inquiry-magazine" 
                      checked={inquiryFormData.howDidYouFindOut.includes('magazine')}
                      onCheckedChange={(checked) => handleArrayChange('howDidYouFindOut', 'magazine', checked as boolean)}
                      className="border border-gray-400"
                    />
                    <Label htmlFor="edit-inquiry-magazine" className="text-sm">MAGAZINE/FLYERS</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="edit-inquiry-career-orientation" 
                      checked={inquiryFormData.howDidYouFindOut.includes('career-orientation')}
                      onCheckedChange={(checked) => handleArrayChange('howDidYouFindOut', 'career-orientation', checked as boolean)}
                      className="border border-gray-400"
                    />
                    <Label htmlFor="edit-inquiry-career-orientation" className="text-sm">CAREER ORIENTATION SEMINAR</Label>
                  </div>
                </div>

                {/* ONLINE Section */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="edit-inquiry-online-find" 
                      checked={inquiryFormData.howDidYouFindOut.includes('online')}
                      onCheckedChange={(checked) => handleArrayChange('howDidYouFindOut', 'online', checked as boolean)}
                      className="border border-gray-400"
                    />
                    <Label htmlFor="edit-inquiry-online-find" className="text-sm font-semibold">ONLINE</Label>
                  </div>
                  
                  {inquiryFormData.howDidYouFindOut.includes('online') && (
                    <div className="ml-6 space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="edit-inquiry-website" 
                          checked={inquiryFormData.howDidYouFindOut.includes('website')}
                          onCheckedChange={(checked) => handleArrayChange('howDidYouFindOut', 'website', checked as boolean)}
                          className="border border-gray-400"
                        />
                        <Label htmlFor="edit-inquiry-website" className="text-sm">Website</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="edit-inquiry-facebook" 
                          checked={inquiryFormData.howDidYouFindOut.includes('facebook')}
                          onCheckedChange={(checked) => handleArrayChange('howDidYouFindOut', 'facebook', checked as boolean)}
                          className="border border-gray-400"
                        />
                        <Label htmlFor="edit-inquiry-facebook" className="text-sm">Facebook</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="edit-inquiry-others-online" 
                          checked={inquiryFormData.howDidYouFindOut.includes('others-online')}
                          onCheckedChange={(checked) => handleArrayChange('howDidYouFindOut', 'others-online', checked as boolean)}
                          className="border border-gray-400"
                        />
                        <Label htmlFor="edit-inquiry-others-online" className="text-sm">Others</Label>
                      </div>
                    </div>
                  )}
                </div>

                {/* EVENTS Section */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="edit-inquiry-events" 
                      checked={inquiryFormData.howDidYouFindOut.includes('events')}
                      onCheckedChange={(checked) => handleArrayChange('howDidYouFindOut', 'events', checked as boolean)}
                      className="border border-gray-400"
                    />
                    <Label htmlFor="edit-inquiry-events" className="text-sm">EVENTS</Label>
                  </div>
                  
                  {inquiryFormData.howDidYouFindOut.includes('events') && (
                    <div className="ml-6">
                      <Input 
                        placeholder="Please describe the event" 
                        value={inquiryFormData.eventsDescription}
                        onChange={(e) => setInquiryFormData(prev => ({ ...prev, eventsDescription: e.target.value }))}
                        className="border border-gray-400"
                      />
                    </div>
                  )}
                </div>

                {/* REFERRAL Section */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="edit-inquiry-referral" 
                      checked={inquiryFormData.howDidYouFindOut.includes('referral')}
                      onCheckedChange={(checked) => handleArrayChange('howDidYouFindOut', 'referral', checked as boolean)}
                      className="border border-gray-400"
                    />
                    <Label htmlFor="edit-inquiry-referral" className="text-sm font-semibold">REFERRAL</Label>
                  </div>
                  
                  {inquiryFormData.howDidYouFindOut.includes('referral') && (
                    <div className="ml-6 space-y-2">
                      <div className="grid md:grid-cols-2 gap-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="edit-inquiry-sti-students" 
                            checked={inquiryFormData.referralSource.includes('sti-students')}
                            onCheckedChange={(checked) => handleArrayChange('referralSource', 'sti-students', checked as boolean)}
                            className="border border-gray-400"
                          />
                          <Label htmlFor="edit-inquiry-sti-students" className="text-sm">STI Students</Label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="edit-inquiry-sti-alumni" 
                            checked={inquiryFormData.referralSource.includes('sti-alumni')}
                            onCheckedChange={(checked) => handleArrayChange('referralSource', 'sti-alumni', checked as boolean)}
                            className="border border-gray-400"
                          />
                          <Label htmlFor="edit-inquiry-sti-alumni" className="text-sm">STI Alumni</Label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="edit-inquiry-friends" 
                            checked={inquiryFormData.referralSource.includes('friends')}
                            onCheckedChange={(checked) => handleArrayChange('referralSource', 'friends', checked as boolean)}
                            className="border border-gray-400"
                          />
                          <Label htmlFor="edit-inquiry-friends" className="text-sm">Friends</Label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="edit-inquiry-parents" 
                            checked={inquiryFormData.referralSource.includes('parents')}
                            onCheckedChange={(checked) => handleArrayChange('referralSource', 'parents', checked as boolean)}
                            className="border border-gray-400"
                          />
                          <Label htmlFor="edit-inquiry-parents" className="text-sm">Parents</Label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="edit-inquiry-relatives" 
                            checked={inquiryFormData.referralSource.includes('relatives')}
                            onCheckedChange={(checked) => handleArrayChange('referralSource', 'relatives', checked as boolean)}
                            className="border border-gray-400"
                          />
                          <Label htmlFor="edit-inquiry-relatives" className="text-sm">Relatives</Label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="edit-inquiry-others-referral" 
                            checked={inquiryFormData.referralSource.includes('others-referral')}
                            onCheckedChange={(checked) => handleArrayChange('referralSource', 'others-referral', checked as boolean)}
                            className="border border-gray-400"
                          />
                          <Label htmlFor="edit-inquiry-others-referral" className="text-sm">Others: (Pls specify)</Label>
                        </div>
                      </div>
                      
                      {inquiryFormData.referralSource.includes('others-referral') && (
                        <div className="mt-2">
                          <Input 
                            placeholder="Please specify" 
                            value={inquiryFormData.othersSpecify}
                            onChange={(e) => setInquiryFormData(prev => ({ ...prev, othersSpecify: e.target.value }))}
                            className="border border-gray-400"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsEditDialogOpen(false)
                    setEditingInquiryId(null)
                    setUpdateMessage("")
                    resetForm()
                  }}
                  disabled={isUpdating}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleUpdateInquiry}
                  disabled={isUpdating}
              className="bg-primary hover:bg-primary/90"
                >
                  {isUpdating ? "Updating..." : "Update Inquiry"}
              <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
        </DialogContent>
      </Dialog>

      {/* Program Inquiry Dialog */}
      <Dialog open={isInquiryDialogOpen} onOpenChange={setIsInquiryDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Program Inquiry</DialogTitle>
            <DialogDescription>
              Tell us about your educational goals and interests
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Type of Inquiry and Type of Student */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-foreground uppercase">TYPE OF INQUIRY</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="inquiry-online"
                      name="inquiryType"
                      value="online"
                      checked={inquiryFormData.inquiryType === "online"}
                      onChange={(e) => setInquiryFormData(prev => ({ ...prev, inquiryType: e.target.value }))}
                      className="w-4 h-4 border border-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                    <Label htmlFor="inquiry-online" className="text-sm">Online</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="inquiry-walk-in"
                      name="inquiryType"
                      value="walk-in"
                      checked={inquiryFormData.inquiryType === "walk-in"}
                      onChange={(e) => setInquiryFormData(prev => ({ ...prev, inquiryType: e.target.value }))}
                      className="w-4 h-4 border border-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                    <Label htmlFor="inquiry-walk-in" className="text-sm">Walk-in</Label>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-foreground uppercase">TYPE OF STUDENT</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="inquiry-senior-high"
                      name="studentType"
                      value="senior-high"
                      checked={inquiryFormData.studentType === "senior-high"}
                      onChange={(e) => setInquiryFormData(prev => ({ ...prev, studentType: e.target.value }))}
                      className="w-4 h-4 border border-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                    <Label htmlFor="inquiry-senior-high" className="text-sm">Senior High School</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="inquiry-tertiary"
                      name="studentType"
                      value="tertiary"
                      checked={inquiryFormData.studentType === "tertiary"}
                      onChange={(e) => setInquiryFormData(prev => ({ ...prev, studentType: e.target.value }))}
                      className="w-4 h-4 border border-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                    <Label htmlFor="inquiry-tertiary" className="text-sm">Tertiary</Label>
                  </div>
                </div>
              </div>
            </div>

            {/* Personal Information Section */}
            <div className="space-y-4">
              <Label className="text-sm font-semibold text-foreground uppercase">PERSONAL INFORMATION</Label>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="inquiry-firstName">First Name</Label>
                  <Input 
                    id="inquiry-firstName" 
                    placeholder="Enter your first name" 
                    value={inquiryFormData.firstName}
                    onChange={(e) => setInquiryFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    className="border border-gray-400 focus-visible:ring-orange-500 focus-visible:border-orange-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inquiry-lastName">Last Name</Label>
                  <Input 
                    id="inquiry-lastName" 
                    placeholder="Enter your last name" 
                    value={inquiryFormData.lastName}
                    onChange={(e) => setInquiryFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    className="border border-gray-400 focus-visible:ring-orange-500 focus-visible:border-orange-500"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="inquiry-presentSchool">Present School</Label>
                <Input 
                  id="inquiry-presentSchool" 
                  placeholder="Enter your current school" 
                  value={inquiryFormData.presentSchool}
                  onChange={(e) => setInquiryFormData(prev => ({ ...prev, presentSchool: e.target.value }))}
                  className="border border-gray-400 focus-visible:ring-orange-500 focus-visible:border-orange-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="inquiry-email">Email Address</Label>
                <Input 
                  id="inquiry-email" 
                  type="email" 
                  placeholder="Enter your email address" 
                  value={inquiryFormData.email}
                  onChange={(e) => setInquiryFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="border border-gray-400 focus-visible:ring-orange-500 focus-visible:border-orange-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="inquiry-phone">Phone Number</Label>
                <Input 
                  id="inquiry-phone" 
                  type="tel" 
                  placeholder="Enter your phone number" 
                  value={inquiryFormData.phone}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (/^\d*$/.test(value)) {
                      setInquiryFormData(prev => ({ ...prev, phone: value }));
                    }
                  }}
                  className="border border-gray-400 focus-visible:ring-orange-500 focus-visible:border-orange-500"
                />
              </div>
            </div>

            {/* Programs of Interest */}
            <div className="space-y-4">
              <Label className="text-sm font-semibold text-foreground uppercase">PROGRAMS OF INTEREST</Label>
              
              {inquiryFormData.studentType === "tertiary" && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-foreground">College Programs</h4>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="inquiry-bsit" 
                        checked={inquiryFormData.programs.includes('bsit')}
                        onCheckedChange={(checked) => handleArrayChange('programs', 'bsit', checked as boolean)}
                        className="border border-gray-400"
                      />
                      <Label htmlFor="inquiry-bsit" className="text-sm">
                        BS Information Technology (BSIT)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="inquiry-bscs" 
                        checked={inquiryFormData.programs.includes('bscs')}
                        onCheckedChange={(checked) => handleArrayChange('programs', 'bscs', checked as boolean)}
                        className="border border-gray-400"
                      />
                      <Label htmlFor="inquiry-bscs" className="text-sm">
                        BS Computer Science (BSCS)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="inquiry-bshm" 
                        checked={inquiryFormData.programs.includes('bshm')}
                        onCheckedChange={(checked) => handleArrayChange('programs', 'bshm', checked as boolean)}
                        className="border border-gray-400"
                      />
                      <Label htmlFor="inquiry-bshm" className="text-sm">
                        BS Hospitality Management (BSHM)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="inquiry-bstm" 
                        checked={inquiryFormData.programs.includes('bstm')}
                        onCheckedChange={(checked) => handleArrayChange('programs', 'bstm', checked as boolean)}
                        className="border border-gray-400"
                      />
                      <Label htmlFor="inquiry-bstm" className="text-sm">
                        BS Tourism Management (BSTM)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="inquiry-bsba" 
                        checked={inquiryFormData.programs.includes('bsba')}
                        onCheckedChange={(checked) => handleArrayChange('programs', 'bsba', checked as boolean)}
                        className="border border-gray-400"
                      />
                      <Label htmlFor="inquiry-bsba" className="text-sm">
                        BS Business Administration (BSBA)
                      </Label>
                    </div>
                  </div>
                </div>
              )}

              {inquiryFormData.studentType === "senior-high" && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-foreground">Senior High School Programs</h4>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="inquiry-it-mobile" 
                        checked={inquiryFormData.programs.includes('it-mobile')}
                        onCheckedChange={(checked) => handleArrayChange('programs', 'it-mobile', checked as boolean)}
                        className="border border-gray-400"
                      />
                      <Label htmlFor="inquiry-it-mobile" className="text-sm">
                        IT in Mobile App and Web Development
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="inquiry-humms" 
                        checked={inquiryFormData.programs.includes('humms')}
                        onCheckedChange={(checked) => handleArrayChange('programs', 'humms', checked as boolean)}
                        className="border border-gray-400"
                      />
                      <Label htmlFor="inquiry-humms" className="text-sm">
                        Humanities and Social Sciences (HUMMS)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="inquiry-abm" 
                        checked={inquiryFormData.programs.includes('abm')}
                        onCheckedChange={(checked) => handleArrayChange('programs', 'abm', checked as boolean)}
                        className="border border-gray-400"
                      />
                      <Label htmlFor="inquiry-abm" className="text-sm">
                        Accountancy, Business, and Management (ABM)
                      </Label>
                    </div>
                  </div>
                </div>
              )}

              {!inquiryFormData.studentType && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Please select your student type above to see available programs.</p>
                </div>
              )}
            </div>

            {/* How Did You Find Out About STI Section */}
            <div className="space-y-4">
              <Label className="text-sm font-semibold text-foreground uppercase">HOW DID YOU FIND OUT ABOUT STI?</Label>
              
              <div className="space-y-4">
                {/* Main Options */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="inquiry-tv" 
                      checked={inquiryFormData.howDidYouFindOut.includes('tv')}
                      onCheckedChange={(checked) => handleArrayChange('howDidYouFindOut', 'tv', checked as boolean)}
                      className="border border-gray-400"
                    />
                    <Label htmlFor="inquiry-tv" className="text-sm">TV</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="inquiry-outdoor" 
                      checked={inquiryFormData.howDidYouFindOut.includes('outdoor')}
                      onCheckedChange={(checked) => handleArrayChange('howDidYouFindOut', 'outdoor', checked as boolean)}
                      className="border border-gray-400"
                    />
                    <Label htmlFor="inquiry-outdoor" className="text-sm">OUTDOOR (Billboard, Banners, Streamers)</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="inquiry-radio" 
                      checked={inquiryFormData.howDidYouFindOut.includes('radio')}
                      onCheckedChange={(checked) => handleArrayChange('howDidYouFindOut', 'radio', checked as boolean)}
                      className="border border-gray-400"
                    />
                    <Label htmlFor="inquiry-radio" className="text-sm">RADIO</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="inquiry-print" 
                      checked={inquiryFormData.howDidYouFindOut.includes('print')}
                      onCheckedChange={(checked) => handleArrayChange('howDidYouFindOut', 'print', checked as boolean)}
                      className="border border-gray-400"
                    />
                    <Label htmlFor="inquiry-print" className="text-sm">PRINT (Newspaper)</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="inquiry-magazine" 
                      checked={inquiryFormData.howDidYouFindOut.includes('magazine')}
                      onCheckedChange={(checked) => handleArrayChange('howDidYouFindOut', 'magazine', checked as boolean)}
                      className="border border-gray-400"
                    />
                    <Label htmlFor="inquiry-magazine" className="text-sm">MAGAZINE/FLYERS</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="inquiry-career-orientation" 
                      checked={inquiryFormData.howDidYouFindOut.includes('career-orientation')}
                      onCheckedChange={(checked) => handleArrayChange('howDidYouFindOut', 'career-orientation', checked as boolean)}
                      className="border border-gray-400"
                    />
                    <Label htmlFor="inquiry-career-orientation" className="text-sm">CAREER ORIENTATION SEMINAR</Label>
                  </div>
                </div>

                {/* ONLINE Section */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="inquiry-online-find" 
                      checked={inquiryFormData.howDidYouFindOut.includes('online')}
                      onCheckedChange={(checked) => handleArrayChange('howDidYouFindOut', 'online', checked as boolean)}
                      className="border border-gray-400"
                    />
                    <Label htmlFor="inquiry-online-find" className="text-sm font-semibold">ONLINE</Label>
                  </div>
                  
                  {inquiryFormData.howDidYouFindOut.includes('online') && (
                    <div className="ml-6 space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="inquiry-website" 
                          checked={inquiryFormData.howDidYouFindOut.includes('website')}
                          onCheckedChange={(checked) => handleArrayChange('howDidYouFindOut', 'website', checked as boolean)}
                          className="border border-gray-400"
                        />
                        <Label htmlFor="inquiry-website" className="text-sm">Website</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="inquiry-facebook" 
                          checked={inquiryFormData.howDidYouFindOut.includes('facebook')}
                          onCheckedChange={(checked) => handleArrayChange('howDidYouFindOut', 'facebook', checked as boolean)}
                          className="border border-gray-400"
                        />
                        <Label htmlFor="inquiry-facebook" className="text-sm">Facebook</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="inquiry-others-online" 
                          checked={inquiryFormData.howDidYouFindOut.includes('others-online')}
                          onCheckedChange={(checked) => handleArrayChange('howDidYouFindOut', 'others-online', checked as boolean)}
                          className="border border-gray-400"
                        />
                        <Label htmlFor="inquiry-others-online" className="text-sm">Others</Label>
                      </div>
                    </div>
                  )}
                </div>

                {/* EVENTS Section */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="inquiry-events" 
                      checked={inquiryFormData.howDidYouFindOut.includes('events')}
                      onCheckedChange={(checked) => handleArrayChange('howDidYouFindOut', 'events', checked as boolean)}
                      className="border border-gray-400"
                    />
                    <Label htmlFor="inquiry-events" className="text-sm">EVENTS</Label>
                  </div>
                  
                  {inquiryFormData.howDidYouFindOut.includes('events') && (
                    <div className="ml-6">
                      <Input 
                        placeholder="Please describe the event" 
                        value={inquiryFormData.eventsDescription}
                        onChange={(e) => setInquiryFormData(prev => ({ ...prev, eventsDescription: e.target.value }))}
                        className="border border-gray-400"
                      />
                    </div>
                  )}
                </div>

                {/* REFERRAL Section */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="inquiry-referral" 
                      checked={inquiryFormData.howDidYouFindOut.includes('referral')}
                      onCheckedChange={(checked) => handleArrayChange('howDidYouFindOut', 'referral', checked as boolean)}
                      className="border border-gray-400"
                    />
                    <Label htmlFor="inquiry-referral" className="text-sm font-semibold">REFERRAL</Label>
                  </div>
                  
                  {inquiryFormData.howDidYouFindOut.includes('referral') && (
                    <div className="ml-6 space-y-2">
                      <div className="grid md:grid-cols-2 gap-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="inquiry-sti-students" 
                            checked={inquiryFormData.referralSource.includes('sti-students')}
                            onCheckedChange={(checked) => handleArrayChange('referralSource', 'sti-students', checked as boolean)}
                            className="border border-gray-400"
                          />
                          <Label htmlFor="inquiry-sti-students" className="text-sm">STI Students</Label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="inquiry-sti-alumni" 
                            checked={inquiryFormData.referralSource.includes('sti-alumni')}
                            onCheckedChange={(checked) => handleArrayChange('referralSource', 'sti-alumni', checked as boolean)}
                            className="border border-gray-400"
                          />
                          <Label htmlFor="inquiry-sti-alumni" className="text-sm">STI Alumni</Label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="inquiry-friends" 
                            checked={inquiryFormData.referralSource.includes('friends')}
                            onCheckedChange={(checked) => handleArrayChange('referralSource', 'friends', checked as boolean)}
                            className="border border-gray-400"
                          />
                          <Label htmlFor="inquiry-friends" className="text-sm">Friends</Label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="inquiry-parents" 
                            checked={inquiryFormData.referralSource.includes('parents')}
                            onCheckedChange={(checked) => handleArrayChange('referralSource', 'parents', checked as boolean)}
                            className="border border-gray-400"
                          />
                          <Label htmlFor="inquiry-parents" className="text-sm">Parents</Label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="inquiry-relatives" 
                            checked={inquiryFormData.referralSource.includes('relatives')}
                            onCheckedChange={(checked) => handleArrayChange('referralSource', 'relatives', checked as boolean)}
                            className="border border-gray-400"
                          />
                          <Label htmlFor="inquiry-relatives" className="text-sm">Relatives</Label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="inquiry-others-referral" 
                            checked={inquiryFormData.referralSource.includes('others-referral')}
                            onCheckedChange={(checked) => handleArrayChange('referralSource', 'others-referral', checked as boolean)}
                            className="border border-gray-400"
                          />
                          <Label htmlFor="inquiry-others-referral" className="text-sm">Others: (Pls specify)</Label>
                        </div>
                      </div>
                      
                      {inquiryFormData.referralSource.includes('others-referral') && (
                        <div className="mt-2">
                          <Input 
                            placeholder="Please specify" 
                            value={inquiryFormData.othersSpecify}
                            onChange={(e) => setInquiryFormData(prev => ({ ...prev, othersSpecify: e.target.value }))}
                            className="border border-gray-400"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button 
              variant="outline" 
              onClick={() => setIsInquiryDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitInquiry}
              className="bg-primary hover:bg-primary/90"
              disabled={isCreatingInquiry}
            >
              {isCreatingInquiry ? "Submitting..." : (
                <>
                  Submit Inquiry
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isEnrollConfirmOpen} onOpenChange={setIsEnrollConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm enrollment status</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure {pendingEnrollmentInquiry?.name} is officially enrolled?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Not yet</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmEnrollment}>
              Yes, proceed
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isEnrollmentDialogOpen} onOpenChange={handleEnrollmentDialogChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Complete Enrollment</DialogTitle>
            <DialogDescription>
              Prefilled details from the inquiry are shown below. Review and complete the remaining fields before saving.
            </DialogDescription>
          </DialogHeader>

          <EnrollmentForm
            studentFormData={enrollmentFormData}
            setStudentFormData={setEnrollmentFormData}
          />

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => handleEnrollmentDialogChange(false)}
              disabled={isSavingEnrollment}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitEnrollmentFromInquiry}
              disabled={
                isSavingEnrollment ||
                !enrollmentFormData.firstName.trim() ||
                !enrollmentFormData.lastName.trim() ||
                (enrollmentFormData.collegeStudentType === "sti-transferee" &&
                  (enrollmentFormData.studentNumber.length !== 11))
              }
              className="bg-primary hover:bg-primary/90"
            >
              {isSavingEnrollment ? "Saving..." : "Add to Enrollment"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deletingInquiryId !== null} onOpenChange={(open) => !open && setDeletingInquiryId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Inquiry</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this inquiry? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteInquiry}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
