"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { Search, Plus, Edit, Trash2, Users, BookOpen, X, School } from "lucide-react"
import { AdminBreadcrumbs } from "@/components/admin-breadcrumbs"
import { AdminSidebar } from "@/components/admin-sidebar"
import { useRouter } from "next/navigation"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

export default function SchoolsPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [schoolTypeFilter, setSchoolTypeFilter] = useState("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [schoolFormData, setSchoolFormData] = useState({
    name: "",
    status: "Active",
    type: "feeder" as "feeder" | "competitor" | "non-feeder",
    kmAway: "",
    schoolType: "public" as "public" | "private",
    grade10Students: "",
    grade12Students: "",
    description: "",
    courses: [] as Array<{ id: number; name: string; tuitionFee: string }>,
  })

  const [schoolPartners, setSchoolPartners] = useState([
    { id: 1, name: "School of Technology", programs: 8, students: 342, status: "Active", schoolType: "public", kmAway: "5" },
    { id: 2, name: "School of Business", programs: 6, students: 298, status: "Active", schoolType: "private", kmAway: "10" },
  ])

  const [schoolCompetitors, setSchoolCompetitors] = useState([
    { id: 3, name: "School of Design", programs: 4, students: 156, status: "Active", schoolType: "public", kmAway: "15" },
    { id: 4, name: "School of Health Sciences", programs: 3, students: 89, status: "Inactive", schoolType: "private", kmAway: "20" },
  ])

  const [nonFeederSchools, setNonFeederSchools] = useState<Array<{
    id: number
    name: string
    programs: number
    students: number
    status: string
    schoolType: string
    kmAway: string
  }>>([])

  const filteredPartners = schoolPartners.filter((school) => {
    const matchesSearch = school.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || school.status.toLowerCase() === statusFilter.toLowerCase()
    const matchesSchoolType = schoolTypeFilter === "all" || (school.schoolType && school.schoolType.toLowerCase() === schoolTypeFilter.toLowerCase())
    return matchesSearch && matchesStatus && matchesSchoolType
  })

  const filteredCompetitors = schoolCompetitors.filter((school) => {
    const matchesSearch = school.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || school.status.toLowerCase() === statusFilter.toLowerCase()
    const matchesSchoolType = schoolTypeFilter === "all" || (school.schoolType && school.schoolType.toLowerCase() === schoolTypeFilter.toLowerCase())
    return matchesSearch && matchesStatus && matchesSchoolType
  })

  const filteredNonFeeder = nonFeederSchools.filter((school) => {
    const matchesSearch = school.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || school.status.toLowerCase() === statusFilter.toLowerCase()
    const matchesSchoolType = schoolTypeFilter === "all" || (school.schoolType && school.schoolType.toLowerCase() === schoolTypeFilter.toLowerCase())
    return matchesSearch && matchesStatus && matchesSchoolType
  })

  const handleLogout = () => {
    router.push("/admin/login")
  }

  const handleAddSchool = () => {
    if (!schoolFormData.name.trim()) return
    
    const newSchool = {
      id: Math.max(
        ...schoolPartners.map(s => s.id),
        ...schoolCompetitors.map(s => s.id),
        ...nonFeederSchools.map(s => s.id),
        0
      ) + 1,
      name: schoolFormData.name,
      programs: 0,
      students: 0,
      status: schoolFormData.status,
      schoolType: schoolFormData.schoolType,
      kmAway: schoolFormData.kmAway,
    }
    
    if (schoolFormData.type === "feeder") {
      setSchoolPartners(prev => [newSchool, ...prev])
    } else if (schoolFormData.type === "competitor") {
      setSchoolCompetitors(prev => [newSchool, ...prev])
    } else if (schoolFormData.type === "non-feeder") {
      setNonFeederSchools(prev => [newSchool, ...prev])
    }
    
    resetForm()
    setIsAddDialogOpen(false)
  }

  const resetForm = () => {
    setSchoolFormData({ 
      name: "", 
      status: "Active", 
      type: "feeder",
      kmAway: "",
      schoolType: "public",
      grade10Students: "",
      grade12Students: "",
      description: "",
      courses: [],
    })
  }

  const addCourse = () => {
    const newCourse = {
      id: Date.now(),
      name: "",
      tuitionFee: "",
    }
    setSchoolFormData(prev => ({
      ...prev,
      courses: [...prev.courses, newCourse],
    }))
  }

  const removeCourse = (id: number) => {
    setSchoolFormData(prev => ({
      ...prev,
      courses: prev.courses.filter(course => course.id !== id),
    }))
  }

  const updateCourse = (id: number, field: "name" | "tuitionFee", value: string) => {
    setSchoolFormData(prev => ({
      ...prev,
      courses: prev.courses.map(course =>
        course.id === id ? { ...course, [field]: value } : course
      ),
    }))
  }

  return (
    <div className="min-h-screen bg-background">
        {/* Sidebar Navigation - Fixed */}
        <AdminSidebar onLogout={handleLogout} />

        {/* Main Content - Account for fixed sidebar */}
        <main className="ml-64 p-6">
          <AdminBreadcrumbs />
          
          <div className="mb-6">
            <h1 className="text-3xl font-serif font-bold text-foreground mb-2">Schools Management</h1>
            <p className="text-muted-foreground">Manage schools, programs, and academic departments</p>
          </div>

          {/* Actions Bar */}
          <div className="flex items-center justify-between mb-6 gap-4">
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search schools..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <Select value={schoolTypeFilter} onValueChange={setSchoolTypeFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="School Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button 
              className="bg-primary hover:bg-primary/90"
              onClick={() => setIsAddDialogOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add School
            </Button>
          </div>

          {/* Tabs-based School Tables */}
          <Card className="shadow-lg border-border">
            <CardContent className="p-6">
              <Tabs defaultValue="feeder" className="w-full">
                <TabsList className="mb-6 bg-muted/50 p-1 h-auto">
                  <TabsTrigger 
                    value="feeder" 
                    className="px-6 py-2.5 text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
                  >
                    Feeder Schools
                  </TabsTrigger>
                  <TabsTrigger 
                    value="competitors" 
                    className="px-6 py-2.5 text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
                  >
                    Competitors
                  </TabsTrigger>
                  <TabsTrigger 
                    value="non-feeder" 
                    className="px-6 py-2.5 text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
                  >
                    Non-Feeder Schools
                  </TabsTrigger>
                </TabsList>

                {/* Feeder Schools Tab */}
                <TabsContent value="feeder" className="mt-0">
                  <div className="rounded-lg border border-border bg-background">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-b border-border hover:bg-transparent">
                          <TableHead className="font-semibold text-foreground">School Name</TableHead>
                          <TableHead className="font-semibold text-foreground">Programs</TableHead>
                          <TableHead className="font-semibold text-foreground">Students</TableHead>
                          <TableHead className="font-semibold text-foreground">Status</TableHead>
                          <TableHead className="font-semibold text-foreground text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredPartners.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground py-12">
                              <div className="flex flex-col items-center gap-2">
                                <School className="h-8 w-8 text-muted-foreground/50" />
                                <p className="text-sm">No feeder schools found</p>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredPartners.map((school) => (
                            <TableRow 
                              key={school.id}
                              className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                            >
                              <TableCell className="font-medium py-4">{school.name}</TableCell>
                              <TableCell className="py-4">{school.programs} programs</TableCell>
                              <TableCell className="py-4">{school.students} students</TableCell>
                              <TableCell className="py-4">
                                <Badge 
                                  className={
                                    school.status === "Active" 
                                      ? "bg-teal-500 hover:bg-teal-600 text-white border-teal-500" 
                                      : "bg-amber-500 hover:bg-amber-600 text-white border-amber-500"
                                  }
                                >
                                  {school.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="py-4">
                                <div className="flex items-center justify-end gap-2">
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
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

                {/* Competitors Tab */}
                <TabsContent value="competitors" className="mt-0">
                  <div className="rounded-lg border border-border bg-background">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-b border-border hover:bg-transparent">
                          <TableHead className="font-semibold text-foreground">School Name</TableHead>
                          <TableHead className="font-semibold text-foreground">Programs</TableHead>
                          <TableHead className="font-semibold text-foreground">Students</TableHead>
                          <TableHead className="font-semibold text-foreground">Status</TableHead>
                          <TableHead className="font-semibold text-foreground text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredCompetitors.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground py-12">
                              <div className="flex flex-col items-center gap-2">
                                <School className="h-8 w-8 text-muted-foreground/50" />
                                <p className="text-sm">No competitor schools found</p>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredCompetitors.map((school) => (
                            <TableRow 
                              key={school.id}
                              className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                            >
                              <TableCell className="font-medium py-4">{school.name}</TableCell>
                              <TableCell className="py-4">{school.programs} programs</TableCell>
                              <TableCell className="py-4">{school.students} students</TableCell>
                              <TableCell className="py-4">
                                <Badge 
                                  className={
                                    school.status === "Active" 
                                      ? "bg-teal-500 hover:bg-teal-600 text-white border-teal-500" 
                                      : "bg-amber-500 hover:bg-amber-600 text-white border-amber-500"
                                  }
                                >
                                  {school.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="py-4">
                                <div className="flex items-center justify-end gap-2">
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
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

                {/* Non-Feeder Schools Tab */}
                <TabsContent value="non-feeder" className="mt-0">
                  <div className="rounded-lg border border-border bg-background">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-b border-border hover:bg-transparent">
                          <TableHead className="font-semibold text-foreground">School Name</TableHead>
                          <TableHead className="font-semibold text-foreground">Programs</TableHead>
                          <TableHead className="font-semibold text-foreground">Students</TableHead>
                          <TableHead className="font-semibold text-foreground">Status</TableHead>
                          <TableHead className="font-semibold text-foreground text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredNonFeeder.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground py-12">
                              <div className="flex flex-col items-center gap-2">
                                <School className="h-8 w-8 text-muted-foreground/50" />
                                <p className="text-sm">No non-feeder schools found</p>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredNonFeeder.map((school) => (
                            <TableRow 
                              key={school.id}
                              className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                            >
                              <TableCell className="font-medium py-4">{school.name}</TableCell>
                              <TableCell className="py-4">{school.programs} programs</TableCell>
                              <TableCell className="py-4">{school.students} students</TableCell>
                              <TableCell className="py-4">
                                <Badge 
                                  className={
                                    school.status === "Active" 
                                      ? "bg-teal-500 hover:bg-teal-600 text-white border-teal-500" 
                                      : "bg-amber-500 hover:bg-amber-600 text-white border-amber-500"
                                  }
                                >
                                  {school.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="py-4">
                                <div className="flex items-center justify-end gap-2">
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
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
            </CardContent>
          </Card>
        </main>

      {/* Add School Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
        setIsAddDialogOpen(open)
        if (!open) {
          resetForm()
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New School</DialogTitle>
            <DialogDescription>
              Create a new school entry in the system
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-base font-medium">School Type</Label>
              <RadioGroup
                value={schoolFormData.type}
                onValueChange={(value) => setSchoolFormData(prev => ({ ...prev, type: value as "feeder" | "competitor" | "non-feeder" }))}
                className="flex gap-6"
              >
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="feeder" id="feeder" className="size-5 border border-gray-400" />
                  <Label htmlFor="feeder" className="font-medium cursor-pointer">Feeder School</Label>
                </div>
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="non-feeder" id="non-feeder" className="size-5 border border-gray-400" />
                  <Label htmlFor="non-feeder" className="font-medium cursor-pointer">Non-Feeder</Label>
                </div>
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="competitor" id="competitor" className="size-5 border border-gray-400" />
                  <Label htmlFor="competitor" className="font-medium cursor-pointer">School Competitor</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="school-name">School Name</Label>
              <Input
                id="school-name"
                placeholder="Enter school name (e.g., School of Engineering)"
                value={schoolFormData.name}
                onChange={(e) => setSchoolFormData(prev => ({ ...prev, name: e.target.value }))}
                className="border border-gray-400 focus-visible:ring-orange-500 focus-visible:border-orange-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="km-away">Enter km away from school</Label>
              <Input
                id="km-away"
                type="number"
                placeholder="Enter distance in kilometers"
                value={schoolFormData.kmAway}
                onChange={(e) => setSchoolFormData(prev => ({ ...prev, kmAway: e.target.value }))}
                className="border border-gray-400 focus-visible:ring-orange-500 focus-visible:border-orange-500"
              />
            </div>

            {(schoolFormData.type === "competitor" || schoolFormData.type === "feeder" || schoolFormData.type === "non-feeder") && (
              <div className="space-y-2">
                <Label className="text-base font-medium">Type of School</Label>
                <RadioGroup
                  value={schoolFormData.schoolType}
                  onValueChange={(value) => setSchoolFormData(prev => ({ ...prev, schoolType: value as "public" | "private" }))}
                  className="flex gap-6"
                >
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="public" id="public" className="size-5 border border-gray-400" />
                    <Label htmlFor="public" className="font-medium cursor-pointer">Public</Label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="private" id="private" className="size-5 border border-gray-400" />
                    <Label htmlFor="private" className="font-medium cursor-pointer">Private</Label>
                  </div>
                </RadioGroup>
              </div>
            )}

            {schoolFormData.type === "feeder" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="grade10-students">Total Students for Grade 10</Label>
                  <Input
                    id="grade10-students"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={schoolFormData.grade10Students}
                    onChange={(e) => {
                      const value = e.target.value
                      // Only allow non-negative numbers
                      if (value === "" || (!isNaN(Number(value)) && Number(value) >= 0)) {
                        setSchoolFormData(prev => ({ ...prev, grade10Students: value }))
                      }
                    }}
                    className="border border-gray-400 focus-visible:ring-orange-500 focus-visible:border-orange-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="grade12-students">Total Students for Grade 12</Label>
                  <Input
                    id="grade12-students"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={schoolFormData.grade12Students}
                    onChange={(e) => {
                      const value = e.target.value
                      // Only allow non-negative numbers
                      if (value === "" || (!isNaN(Number(value)) && Number(value) >= 0)) {
                        setSchoolFormData(prev => ({ ...prev, grade12Students: value }))
                      }
                    }}
                    className="border border-gray-400 focus-visible:ring-orange-500 focus-visible:border-orange-500"
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter school description"
                value={schoolFormData.description}
                onChange={(e) => setSchoolFormData(prev => ({ ...prev, description: e.target.value }))}
                className="border border-gray-400 focus-visible:ring-orange-500 focus-visible:border-orange-500 min-h-24"
                rows={4}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Courses Offered</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addCourse}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Course
                </Button>
              </div>
              
              {schoolFormData.courses.length === 0 ? (
                <p className="text-sm text-muted-foreground">No courses added yet. Click "Add Course" to add one.</p>
              ) : (
                <div className="space-y-3">
                  {schoolFormData.courses.map((course) => (
                    <div key={course.id} className="flex gap-2 items-start p-3 border border-gray-300 rounded-md">
                      <div className="flex-1 space-y-2">
                        <Input
                          placeholder="Course name"
                          value={course.name}
                          onChange={(e) => updateCourse(course.id, "name", e.target.value)}
                          className="border border-gray-400 focus-visible:ring-orange-500 focus-visible:border-orange-500"
                        />
                        <Input
                          type="number"
                          placeholder="Estimated tuition fee"
                          value={course.tuitionFee}
                          onChange={(e) => {
                            const value = e.target.value
                            if (value === "" || (!isNaN(Number(value)) && Number(value) >= 0)) {
                              updateCourse(course.id, "tuitionFee", value)
                            }
                          }}
                          className="border border-gray-400 focus-visible:ring-orange-500 focus-visible:border-orange-500"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCourse(course.id)}
                        className="h-8 w-8 p-0 hover:bg-destructive hover:text-destructive-foreground"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="school-status">Status</Label>
              <Select
                value={schoolFormData.status}
                onValueChange={(value) => setSchoolFormData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger id="school-status" className="border border-gray-400 focus-visible:ring-orange-500 focus-visible:border-orange-500">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

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
              onClick={handleAddSchool}
              disabled={!schoolFormData.name.trim()}
            >
              Add School
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
