"use client"

import React, { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Users, TrendingUp, Search, Plus, Eye, Edit, Mail, Phone, ChevronDown, GraduationCap, Trash2, Maximize2, Minimize2, CalendarIcon } from "lucide-react"
import { AdminSidebar } from "@/components/admin-sidebar"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { useRouter } from "next/navigation"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { EnrollmentForm } from "@/components/enrollment-form"
import { supabase } from "@/lib/supabase-client"
import { useDateRange } from "@/hooks/use-date-range"
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
import {
  StudentFormData,
  EnrollmentRecord,
  createEmptyStudentFormData,
  mapProgramCodesToLabel,
  mapProgramStringToCodes,
} from "@/lib/enrollment-data"

const mapRowToEnrollment = (row: Record<string, any>): EnrollmentRecord => ({
  id: row.id,
  name: row.name ?? "Unnamed",
  email: row.email ?? "",
  phone: row.phone ?? "",
  program: row.program ?? "Not specified",
  date: row.date ?? row.created_at?.split("T")?.[0] ?? "",
  studentType: row.student_type ?? "",
  lastSchoolAttended: row.last_school_attended ?? "",
  schoolName: row.school_name ?? "",
  programTrackStrand: row.program_track_strand ?? "",
  collegeStudentType: row.college_student_type ?? "",
  studentNumber: row.student_number ?? "",
  adminName: row.admin_name ?? "Unknown Admin",
})

export default function EnrollmentPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingStudentId, setEditingStudentId] = useState<number | null>(null)
  const [studentFormData, setStudentFormData] = useState<StudentFormData>(createEmptyStudentFormData)
  const [students, setStudents] = useState<EnrollmentRecord[]>([])
  const [isLoadingStudents, setIsLoadingStudents] = useState(true)
  const [studentError, setStudentError] = useState("")
  const [deletingStudentId, setDeletingStudentId] = useState<number | null>(null)
  const [isTableFullscreen, setIsTableFullscreen] = useState(false)
  const [inquiriesCount, setInquiriesCount] = useState(0)
  const { startDate, endDate, setStartDate, setEndDate } = useDateRange()
  const [userPermissions, setUserPermissions] = useState<string[]>([]); // New state for user permissions
  const [viewingStudent, setViewingStudent] = useState<EnrollmentRecord | null>(null)

  const fetchStudents = useCallback(async () => {
    setIsLoadingStudents(true)
    setStudentError("")
    const { data, error } = await supabase
      .from("enrollments")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      setStudentError("Unable to load enrollments. Please verify your Supabase configuration.")
      setStudents([])
    } else if (data) {
      setStudents(data.map(mapRowToEnrollment))
    }

    setIsLoadingStudents(false)
  }, [])

  useEffect(() => {
    const fetchUserPermissions = async () => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error('Error fetching user:', authError);
        router.push('/login'); // Redirect to login if not authenticated
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('permissions')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching user profile:', profileError);
        setUserPermissions([]);
      } else {
        try {
          const permissions = typeof profile.permissions === 'string'
            ? JSON.parse(profile.permissions)
            : profile.permissions;
          setUserPermissions(permissions || []);
        } catch (parseError) {
          console.error('Error parsing permissions:', parseError);
          setUserPermissions([]);
        }
      }
    };

    fetchUserPermissions();
    fetchStudents(); // Also fetch students when component mounts
  }, [fetchStudents, router]); // Added router to dependency array

  useEffect(() => {
    const fetchInquiriesCount = async () => {
      const { count, error } = await supabase
        .from("inquiries")
        .select("*", { count: "exact", head: true })
      if (!error) {
        setInquiriesCount(count || 0)
      }
    }
    fetchInquiriesCount()
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    const handler = () => fetchStudents()
    window.addEventListener("enrollment-records-updated", handler)
    return () => window.removeEventListener("enrollment-records-updated", handler)
  }, [fetchStudents])

  const handleLogout = () => {
    router.push("/login")
  }

  const handleAddStudent = async () => {
    if (!studentFormData.firstName.trim() || !studentFormData.lastName.trim()) return
    
    // Validate student number for STI Transferee
    if (studentFormData.collegeStudentType === "sti-transferee") {
      if (!studentFormData.studentNumber || studentFormData.studentNumber.length !== 11) {
        return // Don't submit if student number is invalid
      }
    }
    
    // Fetch current admin's name
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      setStudentError("You must be logged in to create enrollments. Please refresh the page and try again.")
      return
    }

    // Fetch admin's name from profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('first_name, last_name, name')
      .eq('id', user.id)
      .single()

    let adminName = "Unknown Admin"
    if (!profileError && profile) {
      if (profile.name) {
        adminName = profile.name
      } else if (profile.first_name || profile.last_name) {
        adminName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || "Unknown Admin"
      }
    }
    
    const fullName = `${studentFormData.firstName} ${studentFormData.middleName ? studentFormData.middleName + " " : ""}${studentFormData.lastName}`.trim()
    
    const programNames = mapProgramCodesToLabel(studentFormData.programs, studentFormData.program)
    
    const payload = {
      name: fullName,
      email: studentFormData.email,
      phone: studentFormData.mobileNumber || studentFormData.landline || "N/A",
      program: programNames,
      date: new Date().toISOString().split("T")[0],
      student_type: studentFormData.studentType === "college" ? "College" : studentFormData.studentType === "senior-high" ? "Senior High" : "",
      last_school_attended: studentFormData.lastSchoolAttended 
        ? studentFormData.lastSchoolAttended.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
        : "Not specified",
      school_name: studentFormData.schoolName || null,
      program_track_strand: studentFormData.programTrackStrand || null,
      college_student_type: studentFormData.collegeStudentType || null,
      student_number: studentFormData.studentNumber || null,
      admin_name: adminName, // Store admin name permanently
    }
    
    const { error } = await supabase.from("enrollments").insert(payload)
    
    if (error) {
      setStudentError("Unable to add student. Please try again.")
      return
    }
    
    await fetchStudents()
    setStudentError("")
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("enrollment-records-updated"))
    }
    resetForm()
    setIsAddDialogOpen(false)
  }

  const handleEditStudent = (student: EnrollmentRecord) => {
    // Parse name into first, middle, and last name
    const nameParts = student.name.split(" ")
    const firstName = nameParts[0] || ""
    const lastName = nameParts[nameParts.length - 1] || ""
    const middleName = nameParts.slice(1, -1).join(" ") || ""
    
    const studentType = student.studentType === "College" ? "college" : "senior-high"
    
    const programs = mapProgramStringToCodes(student.program)
    
    setStudentFormData({
      firstName,
      middleName,
      lastName,
      dateOfBirth: "",
      civilStatus: "",
      gender: "",
      landline: "",
      mobileNumber: student.phone,
      email: student.email,
      lastSchoolAttended: student.lastSchoolAttended.toLowerCase().replace(/\s+/g, "-"),
      schoolName: (student as any).schoolName || "",
      programTrackStrand: student.programTrackStrand || "",
      studentType,
      programs: programs.length > 0 ? programs : [],
      program: programs.length === 0 ? student.program : "",
      collegeStudentType: student.collegeStudentType || "",
      studentNumber: student.studentNumber || "",
    })
    
    setEditingStudentId(student.id)
    setIsAddDialogOpen(true)
  }

  const handleUpdateStudent = async () => {
    if (!editingStudentId || !studentFormData.firstName.trim() || !studentFormData.lastName.trim()) return
    
    // Validate student number for STI Transferee
    if (studentFormData.collegeStudentType === "sti-transferee") {
      if (!studentFormData.studentNumber || studentFormData.studentNumber.length !== 11) {
        return // Don't submit if student number is invalid
      }
    }
    
    // Find the existing enrollment to preserve admin_name
    const existingEnrollment = enrolledStudents.find(stud => stud.id === editingStudentId)
    if (!existingEnrollment) {
      setStudentError("Enrollment not found.")
      return
    }
    
    const fullName = `${studentFormData.firstName} ${studentFormData.middleName ? studentFormData.middleName + " " : ""}${studentFormData.lastName}`.trim()
    
    const programNames = mapProgramCodesToLabel(studentFormData.programs, studentFormData.program || "")
    
    const payload = {
      name: fullName,
      email: studentFormData.email,
      phone: studentFormData.mobileNumber || studentFormData.landline || "",
      program: programNames || "",
      student_type: studentFormData.studentType === "college" ? "College" : studentFormData.studentType === "senior-high" ? "Senior High" : "",
      last_school_attended: studentFormData.lastSchoolAttended 
        ? studentFormData.lastSchoolAttended.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
        : null,
      school_name: studentFormData.schoolName || null,
      program_track_strand: studentFormData.programTrackStrand || null,
      college_student_type: studentFormData.collegeStudentType || null,
      student_number: studentFormData.studentNumber || null,
      admin_name: existingEnrollment.adminName || "Unknown Admin", // Preserve existing admin_name
    }
    
    const { error } = await supabase.from("enrollments").update(payload).eq("id", editingStudentId)
    
    if (error) {
      setStudentError("Unable to update student. Please try again.")
      return
    }
    
    await fetchStudents()
    setStudentError("")
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("enrollment-records-updated"))
    }
    
    resetForm()
    setIsAddDialogOpen(false)
    setEditingStudentId(null)
  }

  const handleDeleteStudent = async () => {
    if (!deletingStudentId) return
    
    const { error } = await supabase
      .from("enrollments")
      .delete()
      .eq("id", deletingStudentId)
    
    if (error) {
      console.error("Error deleting student:", error)
      setStudentError("Unable to delete student. Please try again.")
    } else {
      await fetchStudents()
      setStudentError("")
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("enrollment-records-updated"))
      }
    }
    
    setDeletingStudentId(null)
  }

  const filteredStudents = students.filter((student) => {
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch = 
      student.name.toLowerCase().includes(searchLower) ||
      student.email.toLowerCase().includes(searchLower) ||
      student.program.toLowerCase().includes(searchLower)
    return matchesSearch
  })

  const totalEnrolled = students.length
  const currentYear = new Date().getFullYear()
  const newEnrollments = students.filter((student) => {
    if (!student.date) return false
    const date = new Date(student.date)
    if (isNaN(date.getTime())) return false
    return date.getFullYear() === currentYear
  }).length
  const conversionRate = inquiriesCount > 0 ? (totalEnrolled / inquiriesCount) * 100 : 0
  const programFrequency: Record<string, number> = {}
  students.forEach((student) => {
    const rawPrograms = student.program ? student.program.split(",") : []
    const programs = rawPrograms.length > 0 ? rawPrograms : [student.program || "Not specified"]
    programs
      .map((program) => program.trim())
      .filter((program) => program.length > 0)
      .forEach((program) => {
        programFrequency[program] = (programFrequency[program] || 0) + 1
      })
  })
  const mostEnrolledEntry = Object.entries(programFrequency).sort(([, a], [, b]) => b - a)[0]
  const mostEnrolledProgram = mostEnrolledEntry ? mostEnrolledEntry[0] : "N/A"
  const mostEnrolledCount = mostEnrolledEntry ? mostEnrolledEntry[1] : 0

  // Filter students by classification
  const enrolledStudents = filteredStudents
  const freshmenStudents = filteredStudents.filter((student) => 
    student.studentType === "College" && (student as any).collegeStudentType === "freshman"
  )
  const transfereeStudents = filteredStudents.filter((student) => 
    student.studentType === "College" && (student as any).collegeStudentType === "transferee"
  )
  const stiTransfereeStudents = filteredStudents.filter((student) => 
    student.studentType === "College" && (student as any).collegeStudentType === "sti-transferee"
  )

  const resetForm = () => {
    setStudentFormData(createEmptyStudentFormData())
    setEditingStudentId(null)
  }

  const renderStudentRows = (
    list: EnrollmentRecord[],
    emptyMessage: string,
    colSpan: number,
    renderer: (student: EnrollmentRecord) => React.ReactElement,
  ) => {
    if (isLoadingStudents) {
      return (
        <TableRow>
          <TableCell colSpan={colSpan} className="text-center text-muted-foreground py-12">
            Loading students...
          </TableCell>
        </TableRow>
      )
    }

    if (studentError) {
      return (
        <TableRow>
          <TableCell colSpan={colSpan} className="text-center text-red-500 py-12">
            {studentError}
          </TableCell>
        </TableRow>
      )
    }

    if (list.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={colSpan} className="text-center text-muted-foreground py-12">
            <div className="flex flex-col items-center gap-2">
              <GraduationCap className="h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm">{emptyMessage}</p>
            </div>
          </TableCell>
        </TableRow>
      )
    }

    return list.map(renderer)
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
        {/* Sidebar Navigation - Fixed */}
        <AdminSidebar onLogout={handleLogout} userPermissions={userPermissions} />

        {/* Main Content - Account for fixed sidebar */}
        <main className="ml-64 p-6">
          
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h1 className="text-3xl font-serif font-bold text-slate-700 dark:text-slate-200 mb-2">Enrollment Management</h1>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex flex-col">
                  <Label htmlFor="start-date" className="text-sm font-medium text-foreground mb-1">Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="start-date"
                        variant="outline"
                        className="w-[140px] justify-start text-left font-normal border border-border focus-visible:ring-ring focus-visible:border-ring h-9 px-3"
                      >
                        {startDate ? format(startDate, "MM/dd/yyyy") : "Select date"}
                        <CalendarIcon className="ml-auto h-4 w-4 text-muted-foreground" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        captionLayout="dropdown"
                        fromYear={new Date().getFullYear() - 10}
                        toYear={new Date().getFullYear() + 10}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex flex-col">
                  <Label htmlFor="end-date" className="text-sm font-medium text-foreground mb-1">End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="end-date"
                        variant="outline"
                        className="w-[140px] justify-start text-left font-normal border border-border focus-visible:ring-ring focus-visible:border-ring h-9 px-3"
                      >
                        {endDate ? format(endDate, "MM/dd/yyyy") : "Select date"}
                        <CalendarIcon className="ml-auto h-4 w-4 text-muted-foreground" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        captionLayout="dropdown"
                        fromYear={new Date().getFullYear() - 10}
                        toYear={new Date().getFullYear() + 10}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const currentYear = new Date().getFullYear()
                    setStartDate(new Date(currentYear - 1, 0, 1)) // January 1 of last year
                    setEndDate(new Date(currentYear, 11, 31)) // December 31 of this year
                    fetchStudents()
                  }}
                  disabled={isLoadingStudents}
                  className="h-9 w-9 p-0"
                  title={isLoadingStudents ? 'Refreshing...' : 'Refresh Data'}
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </Button>
              </div>
            </div>
            <p className="text-slate-600 dark:text-slate-400">Track student enrollment, program capacity, and registration trends</p>
          </div>

          {/* Enrollment Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Enrolled</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalEnrolled}</div>
                <p className="text-xs text-muted-foreground">All active students</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Students Added This Year</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{newEnrollments}</div>
                <p className="text-xs text-muted-foreground">Students added this year</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {inquiriesCount > 0 ? `${conversionRate.toFixed(1)}%` : "0%"}
                </div>
                <p className="text-xs text-muted-foreground">Inquiry-to-enrollment</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Most Enrolled Program</CardTitle>
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold truncate">{mostEnrolledProgram}</div>
                <p className="text-xs text-muted-foreground">{mostEnrolledCount} students</p>
              </CardContent>
            </Card>
          </div>

          {/* Students Table with Tabs */}
          <Card className="shadow-lg border-border">
            <CardContent className="p-6">
              {/* Search inside table */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="relative w-72">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search students..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setIsTableFullscreen(true)}
                    className="h-8 w-8"
                  >
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                  <Button 
                    className="bg-primary hover:bg-primary/90"
                    onClick={() => {
                      resetForm()
                      setIsAddDialogOpen(true)
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Student
                  </Button>
                </div>
              </div>
              <Tabs defaultValue="enrolled" className="w-full">
                <TabsList className="mb-6 bg-muted/50 p-1 h-auto">
                  <TabsTrigger 
                    value="enrolled" 
                    className="px-6 py-2.5 text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
                  >
                    Enrolled
                  </TabsTrigger>
                  <TabsTrigger 
                    value="freshmen" 
                    className="px-6 py-2.5 text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
                  >
                    Freshmen
                  </TabsTrigger>
                  <TabsTrigger 
                    value="transferees" 
                    className="px-6 py-2.5 text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
                  >
                    Transferees
                  </TabsTrigger>
                  <TabsTrigger 
                    value="sti-transferee" 
                    className="px-6 py-2.5 text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
                  >
                    STI Transferee
                  </TabsTrigger>
                </TabsList>

                {/* Enrolled Tab - All Students */}
                <TabsContent value="enrolled" className="mt-0">
                  <div className="rounded-lg border border-border bg-background">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-b border-border hover:bg-transparent">
                          <TableHead className="font-semibold text-foreground">Admin Name</TableHead>
                          <TableHead className="font-semibold text-foreground">Name</TableHead>
                          <TableHead className="font-semibold text-foreground">Contact</TableHead>
                          <TableHead className="font-semibold text-foreground">Program</TableHead>
                          <TableHead className="font-semibold text-foreground">Type of Student</TableHead>
                          <TableHead className="font-semibold text-foreground">Last School Attended</TableHead>
                          <TableHead className="font-semibold text-foreground">Enrollment Date</TableHead>
                          <TableHead className="font-semibold text-foreground text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {renderStudentRows(
                          enrolledStudents,
                          "No students found",
                          8,
                          (student) => (
                            <TableRow 
                              key={student.id}
                              className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                            >
                              <TableCell className="font-medium py-4">{student.adminName || "Unknown Admin"}</TableCell>
                              <TableCell className="font-medium py-4">{student.name}</TableCell>
                              <TableCell className="py-4">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1 text-sm">
                                    <Mail className="h-3 w-3" />
                                    {student.email}
                                  </div>
                                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                    <Phone className="h-3 w-3" />
                                    {student.phone}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="py-4">{student.program}</TableCell>
                              <TableCell className="py-4">
                                {student.studentType === "College" ? (
                                  <Badge className="bg-blue-800 text-white border-blue-800">{student.studentType}</Badge>
                                ) : student.studentType === "Senior High" ? (
                                  <Badge className="bg-yellow-500 text-black border-yellow-500">{student.studentType}</Badge>
                                ) : (
                                  <Badge className="bg-gray-500 text-white border-gray-500">{student.studentType || "N/A"}</Badge>
                                )}
                              </TableCell>
                              <TableCell className="py-4">{student.lastSchoolAttended}</TableCell>
                              <TableCell className="py-4">{student.date}</TableCell>
                              <TableCell className="py-4 text-right">
                                <div className="flex items-center justify-end gap-1 w-full">
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                                    onClick={() => setViewingStudent(student)}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                                    onClick={() => handleEditStudent(student)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 hover:border-red-300"
                                    onClick={() => setDeletingStudentId(student.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ),
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                {/* Freshmen Tab */}
                <TabsContent value="freshmen" className="mt-0">
                  <div className="rounded-lg border border-border bg-background">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-b border-border hover:bg-transparent">
                          <TableHead className="font-semibold text-foreground">Admin Name</TableHead>
                          <TableHead className="font-semibold text-foreground">Name</TableHead>
                          <TableHead className="font-semibold text-foreground">Contact</TableHead>
                          <TableHead className="font-semibold text-foreground">Program</TableHead>
                          <TableHead className="font-semibold text-foreground">Last School Attended</TableHead>
                          <TableHead className="font-semibold text-foreground">Enrollment Date</TableHead>
                          <TableHead className="font-semibold text-foreground text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {renderStudentRows(
                          freshmenStudents,
                          "No freshmen students found",
                          7,
                          (student) => (
                            <TableRow 
                              key={student.id}
                              className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                            >
                              <TableCell className="font-medium py-4">{student.adminName || "Unknown Admin"}</TableCell>
                              <TableCell className="font-medium py-4">{student.name}</TableCell>
                              <TableCell className="py-4">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1 text-sm">
                                    <Mail className="h-3 w-3" />
                                    {student.email}
                                  </div>
                                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                    <Phone className="h-3 w-3" />
                                    {student.phone}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="py-4">{student.program}</TableCell>
                              <TableCell className="py-4">{student.lastSchoolAttended}</TableCell>
                              <TableCell className="py-4">{student.date}</TableCell>
                              <TableCell className="py-4 text-right">
                                <div className="flex items-center justify-end gap-1 w-full">
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                                    onClick={() => setViewingStudent(student)}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                                    onClick={() => handleEditStudent(student)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 hover:border-red-300"
                                    onClick={() => setDeletingStudentId(student.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ),
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                {/* Transferees Tab */}
                <TabsContent value="transferees" className="mt-0">
                  <div className="rounded-lg border border-border bg-background">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-b border-border hover:bg-transparent">
                          <TableHead className="font-semibold text-foreground">Admin Name</TableHead>
                          <TableHead className="font-semibold text-foreground">Name</TableHead>
                          <TableHead className="font-semibold text-foreground">Contact</TableHead>
                          <TableHead className="font-semibold text-foreground">Program</TableHead>
                          <TableHead className="font-semibold text-foreground">Last School Attended</TableHead>
                          <TableHead className="font-semibold text-foreground">Enrollment Date</TableHead>
                          <TableHead className="font-semibold text-foreground text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {renderStudentRows(
                          transfereeStudents,
                          "No transferee students found",
                          7,
                          (student) => (
                            <TableRow 
                              key={student.id}
                              className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                            >
                              <TableCell className="font-medium py-4">{student.adminName || "Unknown Admin"}</TableCell>
                              <TableCell className="font-medium py-4">{student.name}</TableCell>
                              <TableCell className="py-4">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1 text-sm">
                                    <Mail className="h-3 w-3" />
                                    {student.email}
                                  </div>
                                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                    <Phone className="h-3 w-3" />
                                    {student.phone}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="py-4">{student.program}</TableCell>
                              <TableCell className="py-4">{student.lastSchoolAttended}</TableCell>
                              <TableCell className="py-4">{student.date}</TableCell>
                              <TableCell className="py-4 text-right">
                                <div className="flex items-center justify-end gap-1 w-full">
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                                    onClick={() => setViewingStudent(student)}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                                    onClick={() => handleEditStudent(student)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 hover:border-red-300"
                                    onClick={() => setDeletingStudentId(student.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ),
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                {/* STI Transferee Tab */}
                <TabsContent value="sti-transferee" className="mt-0">
                  <div className="rounded-lg border border-border bg-background">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-b border-border hover:bg-transparent">
                          <TableHead className="font-semibold text-foreground">Admin Name</TableHead>
                          <TableHead className="font-semibold text-foreground">Name</TableHead>
                          <TableHead className="font-semibold text-foreground">Contact</TableHead>
                          <TableHead className="font-semibold text-foreground">Program</TableHead>
                          <TableHead className="font-semibold text-foreground">Student Number</TableHead>
                          <TableHead className="font-semibold text-foreground">Last School Attended</TableHead>
                          <TableHead className="font-semibold text-foreground">Enrollment Date</TableHead>
                          <TableHead className="font-semibold text-foreground text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {renderStudentRows(
                          stiTransfereeStudents,
                          "No STI transferee students found",
                          8,
                          (student) => (
                            <TableRow 
                              key={student.id}
                              className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                            >
                              <TableCell className="font-medium py-4">{student.adminName || "Unknown Admin"}</TableCell>
                              <TableCell className="font-medium py-4">{student.name}</TableCell>
                              <TableCell className="py-4">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1 text-sm">
                                    <Mail className="h-3 w-3" />
                                    {student.email}
                                  </div>
                                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                    <Phone className="h-3 w-3" />
                                    {student.phone}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="py-4">{student.program}</TableCell>
                              <TableCell className="py-4">
                                <Badge className="bg-purple-500 text-white border-purple-500">
                                  {(student as any).studentNumber || "N/A"}
                                </Badge>
                              </TableCell>
                              <TableCell className="py-4">{student.lastSchoolAttended}</TableCell>
                              <TableCell className="py-4">{student.date}</TableCell>
                              <TableCell className="py-4 text-right">
                                <div className="flex items-center justify-end gap-1 w-full">
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                                    onClick={() => setViewingStudent(student)}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                                    onClick={() => handleEditStudent(student)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 hover:border-red-300"
                                    onClick={() => setDeletingStudentId(student.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ),
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </main>

      {/* Add/Edit Student Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
        setIsAddDialogOpen(open)
        if (!open) {
          resetForm()
        }
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingStudentId ? "Edit Student" : "Add New Student"}</DialogTitle>
            <DialogDescription>
              {editingStudentId ? "Update student information" : "Enter student information for enrollment"}
            </DialogDescription>
          </DialogHeader>
          
          <EnrollmentForm
            studentFormData={studentFormData}
            setStudentFormData={setStudentFormData}
            isEnrollment={true}
          />

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsAddDialogOpen(false)
                resetForm()
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={editingStudentId ? handleUpdateStudent : handleAddStudent}
              disabled={
                !studentFormData.firstName.trim() || 
                !studentFormData.lastName.trim() ||
                (studentFormData.collegeStudentType === "sti-transferee" && 
                 (!studentFormData.studentNumber || studentFormData.studentNumber.length !== 11))
              }
            >
              {editingStudentId ? "Update Student" : "Add Student"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deletingStudentId !== null} onOpenChange={(open) => !open && setDeletingStudentId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Student</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this student enrollment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteStudent}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Student Dialog */}
      <Dialog open={viewingStudent !== null} onOpenChange={(open) => !open && setViewingStudent(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>View Student Enrollment</DialogTitle>
            <DialogDescription>Student enrollment information (read-only)</DialogDescription>
          </DialogHeader>
          {viewingStudent && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Name</Label>
                  <p className="text-sm">{viewingStudent.name}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Email</Label>
                  <p className="text-sm">{viewingStudent.email || "N/A"}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Phone</Label>
                  <p className="text-sm">{viewingStudent.phone || "N/A"}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Date</Label>
                  <p className="text-sm">{viewingStudent.date || "N/A"}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Student Type</Label>
                  <p className="text-sm">{viewingStudent.studentType || "N/A"}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Program</Label>
                  <p className="text-sm">{viewingStudent.program || "N/A"}</p>
                </div>
                {viewingStudent.lastSchoolAttended && (
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Last School Attended</Label>
                    <p className="text-sm">{viewingStudent.lastSchoolAttended}</p>
                  </div>
                )}
                {viewingStudent.schoolName && (
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">School Name</Label>
                    <p className="text-sm">{viewingStudent.schoolName}</p>
                  </div>
                )}
                {viewingStudent.studentNumber && (
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Student Number</Label>
                    <p className="text-sm">{viewingStudent.studentNumber}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setViewingStudent(null)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Fullscreen Table Dialog */}
      <Dialog open={isTableFullscreen} onOpenChange={setIsTableFullscreen}>
        <DialogContent 
                      className="!max-w-none !w-screen !h-screen !max-h-screen !top-0 !left-0 !translate-x-0 !translate-y-0 !rounded-none p-6 flex flex-col"
                      showCloseButton={false}
                    >
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Enrollment Table</DialogTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setIsTableFullscreen(false)}
                  className="h-8 w-8"
                >
                  <Minimize2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>
          {/* Search and Add button in fullscreen */}
          <div className="flex items-center justify-between mb-6 mt-4">
            <div className="flex items-center gap-4">
              <div className="relative w-72">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button 
              className="bg-primary hover:bg-primary/90"
              onClick={() => {
                resetForm()
                setIsAddDialogOpen(true)
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Student
            </Button>
          </div>
          <div className="overflow-auto flex-1">
            <Tabs defaultValue="enrolled" className="w-full">
              <TabsList className="mb-6 bg-muted/50 p-1 h-auto">
                <TabsTrigger value="enrolled" className="px-6 py-2.5 text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  Enrolled
                </TabsTrigger>
                <TabsTrigger value="freshman" className="px-6 py-2.5 text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  Freshman
                </TabsTrigger>
                <TabsTrigger value="transferee" className="px-6 py-2.5 text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  Transferee
                </TabsTrigger>
                <TabsTrigger value="sti-transferee" className="px-6 py-2.5 text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  STI Transferee
                </TabsTrigger>
              </TabsList>
              <TabsContent value="enrolled" className="mt-0">
                <div className="rounded-lg border border-border bg-background">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-border hover:bg-transparent">
                        <TableHead className="font-semibold text-foreground">Admin Name</TableHead>
                        <TableHead className="font-semibold text-foreground">Name</TableHead>
                        <TableHead className="font-semibold text-foreground">Contact</TableHead>
                        <TableHead className="font-semibold text-foreground">Program</TableHead>
                        <TableHead className="font-semibold text-foreground">Type of Student</TableHead>
                        <TableHead className="font-semibold text-foreground">Last School Attended</TableHead>
                        <TableHead className="font-semibold text-foreground">Date</TableHead>
                        <TableHead className="font-semibold text-foreground text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoadingStudents ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                            Loading students...
                          </TableCell>
                        </TableRow>
                      ) : studentError ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center text-red-500 py-12">
                            {studentError}
                          </TableCell>
                        </TableRow>
                      ) : filteredStudents.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                            <div className="flex flex-col items-center gap-2">
                              <Users className="h-8 w-8 text-muted-foreground/50" />
                              <p className="text-sm">No students found</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredStudents.map((student) => (
                          <TableRow 
                            key={student.id}
                            className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                          >
                            <TableCell className="font-medium py-4">{student.adminName || "Unknown Admin"}</TableCell>
                            <TableCell className="font-medium py-4">{student.name}</TableCell>
                            <TableCell className="py-4">
                              <div className="space-y-1">
                                <div className="flex items-center gap-1.5 text-sm">
                                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                                  {student.email}
                                </div>
                                <div className="flex items-center gap-1.5 text-sm">
                                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                                  {student.phone}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="py-4">
                              <Badge variant="secondary" className="text-xs">
                                {student.program}
                              </Badge>
                            </TableCell>
                            <TableCell className="py-4">
                              <Badge variant="outline" className="text-xs">
                                {student.studentType}
                              </Badge>
                            </TableCell>
                            <TableCell className="py-4">
                              <span className="text-sm text-muted-foreground">{student.lastSchoolAttended}</span>
                            </TableCell>
                            <TableCell className="py-4">
                              <span className="text-sm text-muted-foreground">{student.date}</span>
                            </TableCell>
                            <TableCell className="py-4">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => setViewingStudent(student)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleEditStudent(student)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                  onClick={() => setDeletingStudentId(student.id)}
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
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
