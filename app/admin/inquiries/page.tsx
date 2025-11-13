"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AdminBreadcrumbs } from "@/components/admin-breadcrumbs"
import { AdminSidebar } from "@/components/admin-sidebar"
import { Search, Eye, MessageSquare, Phone, Mail, Edit, CheckCircle, AlertCircle, ArrowRight, Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import { Checkbox } from "@/components/ui/checkbox"

export default function InquiriesPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [editingInquiryId, setEditingInquiryId] = useState<number | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [updateMessage, setUpdateMessage] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)
  const [isInquiryDialogOpen, setIsInquiryDialogOpen] = useState(false)
  const [inquiryFormData, setInquiryFormData] = useState({
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
  })

  const [inquiries, setInquiries] = useState([
    {
      id: 1,
      name: "Juan Dela Cruz",
      email: "juan.delacruz@gmail.com",
      phone: "+63 917 123 4567",
      program: "BS Information Technology",
      status: "New",
      date: "2024-01-15",
      studentType: "College",
      notes: "",
    },
    {
      id: 2,
      name: "Maria Santos",
      email: "maria.santos@yahoo.com",
      phone: "+63 918 234 5678",
      program: "BS Computer Science",
      status: "Contacted",
      date: "2024-01-14",
      studentType: "College",
      notes: "Interested in evening classes",
    },
    {
      id: 3,
      name: "Jose Garcia",
      email: "jose.garcia@outlook.com",
      phone: "+63 919 345 6789",
      program: "BS Business Administration",
      status: "Qualified",
      date: "2024-01-13",
      studentType: "College",
      notes: "Has previous business experience",
    },
    {
      id: 4,
      name: "Ana Rodriguez",
      email: "ana.rodriguez@gmail.com",
      phone: "+63 920 456 7890",
      program: "BS Hospitality Management",
      status: "New",
      date: "2024-01-12",
      studentType: "College",
      notes: "",
    },
    {
      id: 5,
      name: "Carlos Mendoza",
      email: "carlos.mendoza@yahoo.com",
      phone: "+63 921 567 8901",
      program: "BS Tourism Management",
      status: "Contacted",
      date: "2024-01-11",
      studentType: "College",
      notes: "Wants to know about scholarship opportunities",
    },
    {
      id: 6,
      name: "Sofia Reyes",
      email: "sofia.reyes@gmail.com",
      phone: "+63 922 678 9012",
      program: "IT in Mobile App and Web Development",
      status: "New",
      date: "2024-01-10",
      studentType: "High School",
      notes: "Senior High School student",
    },
  ])

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
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Update the inquiry in state with form data
      setInquiries(prev => prev.map(inquiry => 
        inquiry.id === editingInquiryId 
          ? { 
              ...inquiry, // Preserve status, date, notes, and other fields
              name: `${inquiryFormData.firstName} ${inquiryFormData.lastName}`,
              email: inquiryFormData.email,
              phone: inquiryFormData.phone,
              program: inquiryFormData.programs.join(", ") || "Not specified",
              studentType: inquiryFormData.studentType === "tertiary" ? "College" : "Senior High",
            }
          : inquiry
      ))
      
      setUpdateMessage("Inquiry updated successfully!")
      setTimeout(() => {
        setIsEditDialogOpen(false)
        setUpdateMessage("")
        setEditingInquiryId(null)
        // Reset form
        setInquiryFormData({
          inquiryType: "",
          studentType: "",
          firstName: "",
          lastName: "",
          presentSchool: "",
          email: "",
          phone: "",
          programs: [],
          howDidYouFindOut: [],
          referralSource: [],
          eventsDescription: "",
          othersSpecify: "",
        })
      }, 1500)
      
    } catch (error) {
      setUpdateMessage("Error updating inquiry. Please try again.")
    } finally {
      setIsUpdating(false)
    }
  }

  const filteredInquiries = inquiries.filter((inquiry) => {
    const matchesSearch =
      inquiry.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inquiry.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inquiry.program.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || inquiry.status.toLowerCase() === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleLogout = () => {
    router.push("/admin/login")
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "New":
        return "default"
      case "Contacted":
        return "secondary"
      case "Qualified":
        return "success"
      default:
        return "secondary"
    }
  }

  const handleProgramChange = (programId: string, checked: boolean) => {
    setInquiryFormData(prev => ({
      ...prev,
      programs: checked 
        ? [...prev.programs, programId]
        : prev.programs.filter(id => id !== programId)
    }))
  }

  const handleHowDidYouFindOutChange = (optionId: string, checked: boolean) => {
    setInquiryFormData(prev => ({
      ...prev,
      howDidYouFindOut: checked 
        ? [...prev.howDidYouFindOut, optionId]
        : prev.howDidYouFindOut.filter(id => id !== optionId)
    }))
  }

  const handleReferralChange = (optionId: string, checked: boolean) => {
    setInquiryFormData(prev => ({
      ...prev,
      referralSource: checked 
        ? [...prev.referralSource, optionId]
        : prev.referralSource.filter(id => id !== optionId)
    }))
  }

  const handleSubmitInquiry = () => {
    // Here you would typically submit the form data to your backend
    console.log("Inquiry submitted:", inquiryFormData)
    // Add the new inquiry to the list
    const newInquiry = {
      id: inquiries.length + 1,
      name: `${inquiryFormData.firstName} ${inquiryFormData.lastName}`,
      email: inquiryFormData.email,
      phone: inquiryFormData.phone,
      program: inquiryFormData.programs.join(", ") || "Not specified",
      status: "New",
      date: new Date().toISOString().split('T')[0],
      studentType: inquiryFormData.studentType === "tertiary" ? "College" : "Senior High",
      notes: "",
    }
    setInquiries(prev => [newInquiry, ...prev])
    // Reset form and close dialog
    setInquiryFormData({
      inquiryType: "",
      studentType: "",
      firstName: "",
      lastName: "",
      presentSchool: "",
      email: "",
      phone: "",
      programs: [],
      howDidYouFindOut: [],
      referralSource: [],
      eventsDescription: "",
      othersSpecify: "",
    })
    setIsInquiryDialogOpen(false)
  }


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
                <CardTitle className="text-sm font-medium">New Today</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">23</div>
                <p className="text-xs text-muted-foreground">+3 from yesterday</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Qualified Leads</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">456</div>
                <p className="text-xs text-muted-foreground">68% conversion rate</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Response Time</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2.4h</div>
                <p className="text-xs text-muted-foreground">Average response time</p>
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
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="qualified">Qualified</SelectItem>
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
                  {filteredInquiries.map((inquiry) => (
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
                        {inquiry.status === "Qualified" ? (
                          <Badge className="bg-green-500 text-white border-green-500">{inquiry.status}</Badge>
                        ) : inquiry.status === "Contacted" ? (
                          <Badge className="bg-blue-500 text-white border-blue-500">{inquiry.status}</Badge>
                        ) : (
                          <Badge variant={getStatusColor(inquiry.status) as any}>{inquiry.status}</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {inquiry.studentType === "College" ? (
                          <Badge className="bg-blue-800 text-white border-blue-800">{inquiry.studentType}</Badge>
                        ) : (
                          <Badge className="bg-yellow-500 text-black border-yellow-500">{inquiry.studentType}</Badge>
                        )}
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
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
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
          // Reset form
          setInquiryFormData({
            inquiryType: "",
            studentType: "",
            firstName: "",
            lastName: "",
            presentSchool: "",
            email: "",
            phone: "",
            programs: [],
            howDidYouFindOut: [],
            referralSource: [],
            eventsDescription: "",
            othersSpecify: "",
          })
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
                      className="w-4 h-4 border-2 border-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
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
                      className="w-4 h-4 border-2 border-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
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
                      className="w-4 h-4 border-2 border-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
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
                      className="w-4 h-4 border-2 border-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
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
                    className="border-2 border-gray-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-inquiry-lastName">Last Name</Label>
                  <Input 
                    id="edit-inquiry-lastName" 
                    placeholder="Enter your last name" 
                    value={inquiryFormData.lastName}
                    onChange={(e) => setInquiryFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    className="border-2 border-gray-400"
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
                  className="border-2 border-gray-400"
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
                  className="border-2 border-gray-400"
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
                  className="border-2 border-gray-400"
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
                        onCheckedChange={(checked) => handleProgramChange('bsit', checked as boolean)}
                        className="border-2 border-gray-400"
                      />
                      <Label htmlFor="edit-inquiry-bsit" className="text-sm">
                        BS Information Technology (BSIT)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="edit-inquiry-bscs" 
                        checked={inquiryFormData.programs.includes('bscs')}
                        onCheckedChange={(checked) => handleProgramChange('bscs', checked as boolean)}
                        className="border-2 border-gray-400"
                      />
                      <Label htmlFor="edit-inquiry-bscs" className="text-sm">
                        BS Computer Science (BSCS)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="edit-inquiry-bshm" 
                        checked={inquiryFormData.programs.includes('bshm')}
                        onCheckedChange={(checked) => handleProgramChange('bshm', checked as boolean)}
                        className="border-2 border-gray-400"
                      />
                      <Label htmlFor="edit-inquiry-bshm" className="text-sm">
                        BS Hospitality Management (BSHM)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="edit-inquiry-bstm" 
                        checked={inquiryFormData.programs.includes('bstm')}
                        onCheckedChange={(checked) => handleProgramChange('bstm', checked as boolean)}
                        className="border-2 border-gray-400"
                      />
                      <Label htmlFor="edit-inquiry-bstm" className="text-sm">
                        BS Tourism Management (BSTM)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="edit-inquiry-bsba" 
                        checked={inquiryFormData.programs.includes('bsba')}
                        onCheckedChange={(checked) => handleProgramChange('bsba', checked as boolean)}
                        className="border-2 border-gray-400"
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
                        onCheckedChange={(checked) => handleProgramChange('it-mobile', checked as boolean)}
                        className="border-2 border-gray-400"
                      />
                      <Label htmlFor="edit-inquiry-it-mobile" className="text-sm">
                        IT in Mobile App and Web Development
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="edit-inquiry-humms" 
                        checked={inquiryFormData.programs.includes('humms')}
                        onCheckedChange={(checked) => handleProgramChange('humms', checked as boolean)}
                        className="border-2 border-gray-400"
                      />
                      <Label htmlFor="edit-inquiry-humms" className="text-sm">
                        Humanities and Social Sciences (HUMMS)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="edit-inquiry-abm" 
                        checked={inquiryFormData.programs.includes('abm')}
                        onCheckedChange={(checked) => handleProgramChange('abm', checked as boolean)}
                        className="border-2 border-gray-400"
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
                      onCheckedChange={(checked) => handleHowDidYouFindOutChange('tv', checked as boolean)}
                      className="border-2 border-gray-400"
                    />
                    <Label htmlFor="edit-inquiry-tv" className="text-sm">TV</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="edit-inquiry-outdoor" 
                      checked={inquiryFormData.howDidYouFindOut.includes('outdoor')}
                      onCheckedChange={(checked) => handleHowDidYouFindOutChange('outdoor', checked as boolean)}
                      className="border-2 border-gray-400"
                    />
                    <Label htmlFor="edit-inquiry-outdoor" className="text-sm">OUTDOOR (Billboard, Banners, Streamers)</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="edit-inquiry-radio" 
                      checked={inquiryFormData.howDidYouFindOut.includes('radio')}
                      onCheckedChange={(checked) => handleHowDidYouFindOutChange('radio', checked as boolean)}
                      className="border-2 border-gray-400"
                    />
                    <Label htmlFor="edit-inquiry-radio" className="text-sm">RADIO</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="edit-inquiry-print" 
                      checked={inquiryFormData.howDidYouFindOut.includes('print')}
                      onCheckedChange={(checked) => handleHowDidYouFindOutChange('print', checked as boolean)}
                      className="border-2 border-gray-400"
                    />
                    <Label htmlFor="edit-inquiry-print" className="text-sm">PRINT (Newspaper)</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="edit-inquiry-magazine" 
                      checked={inquiryFormData.howDidYouFindOut.includes('magazine')}
                      onCheckedChange={(checked) => handleHowDidYouFindOutChange('magazine', checked as boolean)}
                      className="border-2 border-gray-400"
                    />
                    <Label htmlFor="edit-inquiry-magazine" className="text-sm">MAGAZINE/FLYERS</Label>
                  </div>
                </div>

                {/* ONLINE Section */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="edit-inquiry-online-find" 
                      checked={inquiryFormData.howDidYouFindOut.includes('online')}
                      onCheckedChange={(checked) => handleHowDidYouFindOutChange('online', checked as boolean)}
                      className="border-2 border-gray-400"
                    />
                    <Label htmlFor="edit-inquiry-online-find" className="text-sm font-semibold">ONLINE</Label>
                  </div>
                  
                  {inquiryFormData.howDidYouFindOut.includes('online') && (
                    <div className="ml-6 space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="edit-inquiry-website" 
                          checked={inquiryFormData.howDidYouFindOut.includes('website')}
                          onCheckedChange={(checked) => handleHowDidYouFindOutChange('website', checked as boolean)}
                          className="border-2 border-gray-400"
                        />
                        <Label htmlFor="edit-inquiry-website" className="text-sm">Website</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="edit-inquiry-facebook" 
                          checked={inquiryFormData.howDidYouFindOut.includes('facebook')}
                          onCheckedChange={(checked) => handleHowDidYouFindOutChange('facebook', checked as boolean)}
                          className="border-2 border-gray-400"
                        />
                        <Label htmlFor="edit-inquiry-facebook" className="text-sm">Facebook</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="edit-inquiry-others-online" 
                          checked={inquiryFormData.howDidYouFindOut.includes('others-online')}
                          onCheckedChange={(checked) => handleHowDidYouFindOutChange('others-online', checked as boolean)}
                          className="border-2 border-gray-400"
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
                      onCheckedChange={(checked) => handleHowDidYouFindOutChange('events', checked as boolean)}
                      className="border-2 border-gray-400"
                    />
                    <Label htmlFor="edit-inquiry-events" className="text-sm">EVENTS</Label>
                  </div>
                  
                  {inquiryFormData.howDidYouFindOut.includes('events') && (
                    <div className="ml-6">
                      <Input 
                        placeholder="Please describe the event" 
                        value={inquiryFormData.eventsDescription}
                        onChange={(e) => setInquiryFormData(prev => ({ ...prev, eventsDescription: e.target.value }))}
                        className="border-2 border-gray-400"
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
                      onCheckedChange={(checked) => handleHowDidYouFindOutChange('referral', checked as boolean)}
                      className="border-2 border-gray-400"
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
                            onCheckedChange={(checked) => handleReferralChange('sti-students', checked as boolean)}
                            className="border-2 border-gray-400"
                          />
                          <Label htmlFor="edit-inquiry-sti-students" className="text-sm">STI Students</Label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="edit-inquiry-sti-alumni" 
                            checked={inquiryFormData.referralSource.includes('sti-alumni')}
                            onCheckedChange={(checked) => handleReferralChange('sti-alumni', checked as boolean)}
                            className="border-2 border-gray-400"
                          />
                          <Label htmlFor="edit-inquiry-sti-alumni" className="text-sm">STI Alumni</Label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="edit-inquiry-friends" 
                            checked={inquiryFormData.referralSource.includes('friends')}
                            onCheckedChange={(checked) => handleReferralChange('friends', checked as boolean)}
                            className="border-2 border-gray-400"
                          />
                          <Label htmlFor="edit-inquiry-friends" className="text-sm">Friends</Label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="edit-inquiry-parents" 
                            checked={inquiryFormData.referralSource.includes('parents')}
                            onCheckedChange={(checked) => handleReferralChange('parents', checked as boolean)}
                            className="border-2 border-gray-400"
                          />
                          <Label htmlFor="edit-inquiry-parents" className="text-sm">Parents</Label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="edit-inquiry-relatives" 
                            checked={inquiryFormData.referralSource.includes('relatives')}
                            onCheckedChange={(checked) => handleReferralChange('relatives', checked as boolean)}
                            className="border-2 border-gray-400"
                          />
                          <Label htmlFor="edit-inquiry-relatives" className="text-sm">Relatives</Label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="edit-inquiry-others-referral" 
                            checked={inquiryFormData.referralSource.includes('others-referral')}
                            onCheckedChange={(checked) => handleReferralChange('others-referral', checked as boolean)}
                            className="border-2 border-gray-400"
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
                            className="border-2 border-gray-400"
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
                // Reset form
                setInquiryFormData({
                  inquiryType: "",
                  studentType: "",
                  firstName: "",
                  lastName: "",
                  presentSchool: "",
                  email: "",
                  phone: "",
                  programs: [],
                  howDidYouFindOut: [],
                  referralSource: [],
                  eventsDescription: "",
                  othersSpecify: "",
                })
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
                      className="w-4 h-4 border-2 border-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
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
                      className="w-4 h-4 border-2 border-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
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
                      className="w-4 h-4 border-2 border-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
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
                      className="w-4 h-4 border-2 border-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
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
                    className="border-2 border-gray-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inquiry-lastName">Last Name</Label>
                  <Input 
                    id="inquiry-lastName" 
                    placeholder="Enter your last name" 
                    value={inquiryFormData.lastName}
                    onChange={(e) => setInquiryFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    className="border-2 border-gray-400"
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
                  className="border-2 border-gray-400"
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
                  className="border-2 border-gray-400"
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
                  className="border-2 border-gray-400"
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
                        onCheckedChange={(checked) => handleProgramChange('bsit', checked as boolean)}
                        className="border-2 border-gray-400"
                      />
                      <Label htmlFor="inquiry-bsit" className="text-sm">
                        BS Information Technology (BSIT)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="inquiry-bscs" 
                        checked={inquiryFormData.programs.includes('bscs')}
                        onCheckedChange={(checked) => handleProgramChange('bscs', checked as boolean)}
                        className="border-2 border-gray-400"
                      />
                      <Label htmlFor="inquiry-bscs" className="text-sm">
                        BS Computer Science (BSCS)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="inquiry-bshm" 
                        checked={inquiryFormData.programs.includes('bshm')}
                        onCheckedChange={(checked) => handleProgramChange('bshm', checked as boolean)}
                        className="border-2 border-gray-400"
                      />
                      <Label htmlFor="inquiry-bshm" className="text-sm">
                        BS Hospitality Management (BSHM)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="inquiry-bstm" 
                        checked={inquiryFormData.programs.includes('bstm')}
                        onCheckedChange={(checked) => handleProgramChange('bstm', checked as boolean)}
                        className="border-2 border-gray-400"
                      />
                      <Label htmlFor="inquiry-bstm" className="text-sm">
                        BS Tourism Management (BSTM)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="inquiry-bsba" 
                        checked={inquiryFormData.programs.includes('bsba')}
                        onCheckedChange={(checked) => handleProgramChange('bsba', checked as boolean)}
                        className="border-2 border-gray-400"
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
                        onCheckedChange={(checked) => handleProgramChange('it-mobile', checked as boolean)}
                        className="border-2 border-gray-400"
                      />
                      <Label htmlFor="inquiry-it-mobile" className="text-sm">
                        IT in Mobile App and Web Development
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="inquiry-humms" 
                        checked={inquiryFormData.programs.includes('humms')}
                        onCheckedChange={(checked) => handleProgramChange('humms', checked as boolean)}
                        className="border-2 border-gray-400"
                      />
                      <Label htmlFor="inquiry-humms" className="text-sm">
                        Humanities and Social Sciences (HUMMS)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="inquiry-abm" 
                        checked={inquiryFormData.programs.includes('abm')}
                        onCheckedChange={(checked) => handleProgramChange('abm', checked as boolean)}
                        className="border-2 border-gray-400"
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
                      onCheckedChange={(checked) => handleHowDidYouFindOutChange('tv', checked as boolean)}
                      className="border-2 border-gray-400"
                    />
                    <Label htmlFor="inquiry-tv" className="text-sm">TV</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="inquiry-outdoor" 
                      checked={inquiryFormData.howDidYouFindOut.includes('outdoor')}
                      onCheckedChange={(checked) => handleHowDidYouFindOutChange('outdoor', checked as boolean)}
                      className="border-2 border-gray-400"
                    />
                    <Label htmlFor="inquiry-outdoor" className="text-sm">OUTDOOR (Billboard, Banners, Streamers)</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="inquiry-radio" 
                      checked={inquiryFormData.howDidYouFindOut.includes('radio')}
                      onCheckedChange={(checked) => handleHowDidYouFindOutChange('radio', checked as boolean)}
                      className="border-2 border-gray-400"
                    />
                    <Label htmlFor="inquiry-radio" className="text-sm">RADIO</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="inquiry-print" 
                      checked={inquiryFormData.howDidYouFindOut.includes('print')}
                      onCheckedChange={(checked) => handleHowDidYouFindOutChange('print', checked as boolean)}
                      className="border-2 border-gray-400"
                    />
                    <Label htmlFor="inquiry-print" className="text-sm">PRINT (Newspaper)</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="inquiry-magazine" 
                      checked={inquiryFormData.howDidYouFindOut.includes('magazine')}
                      onCheckedChange={(checked) => handleHowDidYouFindOutChange('magazine', checked as boolean)}
                      className="border-2 border-gray-400"
                    />
                    <Label htmlFor="inquiry-magazine" className="text-sm">MAGAZINE/FLYERS</Label>
                  </div>
                </div>

                {/* ONLINE Section */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="inquiry-online-find" 
                      checked={inquiryFormData.howDidYouFindOut.includes('online')}
                      onCheckedChange={(checked) => handleHowDidYouFindOutChange('online', checked as boolean)}
                      className="border-2 border-gray-400"
                    />
                    <Label htmlFor="inquiry-online-find" className="text-sm font-semibold">ONLINE</Label>
                  </div>
                  
                  {inquiryFormData.howDidYouFindOut.includes('online') && (
                    <div className="ml-6 space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="inquiry-website" 
                          checked={inquiryFormData.howDidYouFindOut.includes('website')}
                          onCheckedChange={(checked) => handleHowDidYouFindOutChange('website', checked as boolean)}
                          className="border-2 border-gray-400"
                        />
                        <Label htmlFor="inquiry-website" className="text-sm">Website</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="inquiry-facebook" 
                          checked={inquiryFormData.howDidYouFindOut.includes('facebook')}
                          onCheckedChange={(checked) => handleHowDidYouFindOutChange('facebook', checked as boolean)}
                          className="border-2 border-gray-400"
                        />
                        <Label htmlFor="inquiry-facebook" className="text-sm">Facebook</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="inquiry-others-online" 
                          checked={inquiryFormData.howDidYouFindOut.includes('others-online')}
                          onCheckedChange={(checked) => handleHowDidYouFindOutChange('others-online', checked as boolean)}
                          className="border-2 border-gray-400"
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
                      onCheckedChange={(checked) => handleHowDidYouFindOutChange('events', checked as boolean)}
                      className="border-2 border-gray-400"
                    />
                    <Label htmlFor="inquiry-events" className="text-sm">EVENTS</Label>
                  </div>
                  
                  {inquiryFormData.howDidYouFindOut.includes('events') && (
                    <div className="ml-6">
                      <Input 
                        placeholder="Please describe the event" 
                        value={inquiryFormData.eventsDescription}
                        onChange={(e) => setInquiryFormData(prev => ({ ...prev, eventsDescription: e.target.value }))}
                        className="border-2 border-gray-400"
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
                      onCheckedChange={(checked) => handleHowDidYouFindOutChange('referral', checked as boolean)}
                      className="border-2 border-gray-400"
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
                            onCheckedChange={(checked) => handleReferralChange('sti-students', checked as boolean)}
                            className="border-2 border-gray-400"
                          />
                          <Label htmlFor="inquiry-sti-students" className="text-sm">STI Students</Label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="inquiry-sti-alumni" 
                            checked={inquiryFormData.referralSource.includes('sti-alumni')}
                            onCheckedChange={(checked) => handleReferralChange('sti-alumni', checked as boolean)}
                            className="border-2 border-gray-400"
                          />
                          <Label htmlFor="inquiry-sti-alumni" className="text-sm">STI Alumni</Label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="inquiry-friends" 
                            checked={inquiryFormData.referralSource.includes('friends')}
                            onCheckedChange={(checked) => handleReferralChange('friends', checked as boolean)}
                            className="border-2 border-gray-400"
                          />
                          <Label htmlFor="inquiry-friends" className="text-sm">Friends</Label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="inquiry-parents" 
                            checked={inquiryFormData.referralSource.includes('parents')}
                            onCheckedChange={(checked) => handleReferralChange('parents', checked as boolean)}
                            className="border-2 border-gray-400"
                          />
                          <Label htmlFor="inquiry-parents" className="text-sm">Parents</Label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="inquiry-relatives" 
                            checked={inquiryFormData.referralSource.includes('relatives')}
                            onCheckedChange={(checked) => handleReferralChange('relatives', checked as boolean)}
                            className="border-2 border-gray-400"
                          />
                          <Label htmlFor="inquiry-relatives" className="text-sm">Relatives</Label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="inquiry-others-referral" 
                            checked={inquiryFormData.referralSource.includes('others-referral')}
                            onCheckedChange={(checked) => handleReferralChange('others-referral', checked as boolean)}
                            className="border-2 border-gray-400"
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
                            className="border-2 border-gray-400"
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
            >
              Submit Inquiry
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
