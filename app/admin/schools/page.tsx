"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Plus, Edit, Trash2, Users, BookOpen } from "lucide-react"
import { AdminBreadcrumbs } from "@/components/admin-breadcrumbs"
import { AdminSidebar } from "@/components/admin-sidebar"
import { useRouter } from "next/navigation"

export default function SchoolsPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")

  const schools = [
    { id: 1, name: "School of Technology", programs: 8, students: 342, status: "Active" },
    { id: 2, name: "School of Business", programs: 6, students: 298, status: "Active" },
    { id: 3, name: "School of Design", programs: 4, students: 156, status: "Active" },
    { id: 4, name: "School of Health Sciences", programs: 3, students: 89, status: "Inactive" },
  ]

  const filteredSchools = schools.filter((school) => school.name.toLowerCase().includes(searchTerm.toLowerCase()))

  const handleLogout = () => {
    router.push("/admin/login")
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
          <div className="flex items-center justify-between mb-6">
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search schools..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" />
              Add School
            </Button>
          </div>

          {/* Schools Table */}
          <Card>
            <CardHeader>
              <CardTitle>Schools Overview</CardTitle>
              <CardDescription>Manage all schools and their associated programs</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>School Name</TableHead>
                    <TableHead>Programs</TableHead>
                    <TableHead>Students</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSchools.map((school) => (
                    <TableRow key={school.id}>
                      <TableCell className="font-medium">{school.name}</TableCell>
                      <TableCell>{school.programs} programs</TableCell>
                      <TableCell>{school.students} students</TableCell>
                      <TableCell>
                        <Badge variant={school.status === "Active" ? "default" : "secondary"}>{school.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4" />
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
  )
}
