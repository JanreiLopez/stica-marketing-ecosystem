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
import { Search, Eye, MessageSquare, Phone, Mail, LogOut, Edit, CheckCircle, AlertCircle } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"

export default function InquiriesPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [editingInquiry, setEditingInquiry] = useState<any>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [updateMessage, setUpdateMessage] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)

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
    setEditingInquiry(inquiry)
    setIsEditDialogOpen(true)
  }

  const handleUpdateInquiry = async () => {
    if (!editingInquiry) return
    
    setIsUpdating(true)
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Update the inquiry in state
      setInquiries(prev => prev.map(inquiry => 
        inquiry.id === editingInquiry.id 
          ? { ...inquiry, status: editingInquiry.status, studentType: editingInquiry.studentType, notes: editingInquiry.notes }
          : inquiry
      ))
      
      setUpdateMessage("Inquiry updated successfully!")
      setTimeout(() => {
        setIsEditDialogOpen(false)
        setUpdateMessage("")
        setEditingInquiry(null)
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


  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Image 
                src="/marketeam-logo.png" 
                alt="Marketeam Logo" 
                width={48} 
                height={48} 
                className="h-12 w-12"
              />
              <span className="text-2xl font-serif font-bold text-primary">Marketeam</span>
              <span className="text-sm text-muted-foreground ml-2">Admin Dashboard</span>
            </Link>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">Welcome, Administrator</span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar Navigation */}
        <AdminSidebar onLogout={handleLogout} />

        {/* Main Content */}
        <main className="flex-1 p-6">
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

          {/* Filters */}
          <div className="flex items-center gap-4 mb-6">
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
      </div>

      {/* Edit Inquiry Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Inquiry</DialogTitle>
            <DialogDescription>
              Update the status and priority for {editingInquiry?.name}
            </DialogDescription>
          </DialogHeader>
          
          {editingInquiry && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={editingInquiry.status} 
                  onValueChange={(value) => setEditingInquiry({...editingInquiry, status: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="New">New</SelectItem>
                    <SelectItem value="Contacted">Contacted</SelectItem>
                    <SelectItem value="Qualified">Qualified</SelectItem>
                    <SelectItem value="Enrolled">Enrolled</SelectItem>
                    <SelectItem value="Rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="studentType">Type of Student</Label>
                <Select 
                  value={editingInquiry.studentType} 
                  onValueChange={(value) => setEditingInquiry({...editingInquiry, studentType: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="College">College</SelectItem>
                    <SelectItem value="High School">High School</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={editingInquiry.notes}
                  onChange={(e) => setEditingInquiry({...editingInquiry, notes: e.target.value})}
                  placeholder="Add notes about this inquiry..."
                  rows={3}
                />
              </div>

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

              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditDialogOpen(false)}
                  disabled={isUpdating}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleUpdateInquiry}
                  disabled={isUpdating}
                >
                  {isUpdating ? "Updating..." : "Update Inquiry"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
