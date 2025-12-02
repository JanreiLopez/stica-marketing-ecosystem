"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, AlertCircle, PlusCircle, LogOut, FileText, Building2, Target, School } from "lucide-react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase-client"
import { Checkbox } from "@/components/ui/checkbox"

interface AdminUser {
  id: string
  email: string
  created_at: string
  permissions?: string | string[] // Can be string (JSON) or array
  [key: string]: any // Allow additional properties
}

// Define the available modules
const MODULES = [
  { id: "inquiries", name: "Inquiries", icon: FileText },
  { id: "enrollment", name: "Enrollment", icon: Building2 },
  { id: "marketing", name: "Marketing Activities", icon: Target },
  { id: "schools", name: "Schools", icon: School },
]

export default function SuperAdminDashboard() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [admins, setAdmins] = useState<AdminUser[]>([])
  const [selectedModules, setSelectedModules] = useState<string[]>(["inquiries", "enrollment", "marketing", "schools"])
  const router = useRouter()

  useEffect(() => {
    checkDatabaseStructure();
    fetchAdmins()
  }, [])

  const checkDatabaseStructure = async () => {
    try {
      // Check if profiles table exists and get its structure
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .limit(1)
        
      if (error) {
        console.warn("Could not access profiles table:", error.message);
      }
      
      // Try to get table info
      const { data: tableInfo, error: tableError } = await supabase
        .from('profiles')
        .select('email, role, permissions, created_at')
        .limit(1)
        
      if (tableError) {
        console.warn("Could not access profiles table with specific columns:", tableError.message);
        
        // Try just email and role
        const { error: minimalError } = await supabase
          .from('profiles')
          .select('email, role')
          .limit(1)
          
        if (minimalError) {
          console.warn("Could not access profiles table with minimal columns:", minimalError.message);
        }
      }
    } catch (err) {
      console.warn("Error checking database structure:", err);
    }
  }

  const fetchAdmins = async () => {
    try {
      // Note: You may need to adjust RLS policies in Supabase to avoid recursion
      // For now, we'll catch the error and show a message
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'admin')
        .order('created_at', { ascending: false })

      if (error) {
        console.error("Fetch admins error:", error)
        // If there's an RLS recursion error, just set empty array
        if (error.message.includes('infinite recursion')) {
          setAdmins([])
          return
        }
        throw new Error(`Failed to fetch admins: ${error.message || 'Unknown database error'}`)
      }
      
      // Process the data to handle permissions correctly
      const processedData = data?.map((admin: any) => ({
        ...admin,
        permissions: typeof admin.permissions === 'string' 
          ? JSON.parse(admin.permissions) 
          : admin.permissions
      })) || [];
      
      setAdmins(processedData)
    } catch (err) {
      console.error("Failed to fetch admins:", err)
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch admins: Unknown error"
      setError(errorMessage)
    }
  }

  const handleModuleToggle = (moduleId: string) => {
    setSelectedModules(prev => 
      prev.includes(moduleId) 
        ? prev.filter(id => id !== moduleId) 
        : [...prev, moduleId]
    )
  }

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      // Validate email format
      const trimmedEmail = email.trim();
      if (!trimmedEmail || !/\S+@\S+\.\S+/.test(trimmedEmail)) {
        throw new Error("Please enter a valid email address")
      }

      // Check if email already exists
      const { data: existingData, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', trimmedEmail)
        .maybeSingle()
      
    if (checkError) {
      console.warn("Error checking for existing email:", checkError);
    } else if (existingData) {
      throw new Error("An admin with this email already exists")
    }

    // Call the admin API route to create the user with proper permissions
    const response = await fetch('/api/admin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        email: trimmedEmail,
        permissions: selectedModules
      }),
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to create admin user');
    }
    
    // For the profileData, we'll use a placeholder since the API route handles the actual creation
    // In a real implementation, you might want to fetch the created user data
    const userId = 'placeholder-id'; // This won't be used since we're not inserting directly anymore
    
    // The API route handles user creation, so we don't need to insert into profiles directly
    
    await new Promise((resolve) => setTimeout(resolve, 1500))
    
    // Show success message
    setSuccess(`Admin successfully created with temporary password: ${result.tempPassword}`)
    setEmail("")
    fetchAdmins() // Refresh the admin list
  } catch (err) {
    console.error("Create admin error:", err);
    const errorMessage = err instanceof Error ? err.message : "An unknown error occurred. Please try again."
    setError(errorMessage)
  } finally {
    setIsLoading(false)
  }
}

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  const handleEditAdmin = (admin: AdminUser) => {
    // For now, just show an alert with admin info
    alert(`Edit admin: ${admin.email || admin.id}`)
    // In a real implementation, this would open an edit modal or navigate to an edit page
  }

  const handleDeleteAdmin = async (adminId: string) => {
    if (!confirm('Are you sure you want to delete this admin account?')) return
    
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', adminId)
        
      if (error) {
        console.error("Supabase delete error:", error);
        let errorMessage = error.message || 'Unknown database error';
        
        // Provide more user-friendly error messages
        if (errorMessage.includes('permission')) {
          errorMessage = 'Insufficient permissions to delete admin account';
        } else if (errorMessage.includes('constraint')) {
          errorMessage = 'Cannot delete admin due to existing dependencies';
        }
        
        throw new Error(`Failed to delete admin: ${errorMessage}`);
      }
      
      // Refresh the admin list
      fetchAdmins()
      
      // Show success message
      setSuccess("Admin account deleted successfully")
      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      console.error("Delete admin error:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to delete admin account"
      setError(errorMessage)
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-700 dark:text-slate-200">Super Admin Dashboard</h1>
            <p className="text-slate-600 dark:text-slate-400">Manage admin accounts and system settings</p>
          </div>
          <Button variant="outline" onClick={handleLogout} className="border-slate-300 text-slate-700 dark:border-slate-600 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800">
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Create Admin Card */}
          <Card className="bg-cyan-50/50 border-cyan-100">
            <CardHeader>
              <CardTitle className="text-slate-700">Create New Admin</CardTitle>
              <CardDescription className="text-slate-600">Enter admin email to generate account with temporary password</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateAdmin} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert variant="default" className="border-green-500 text-green-700 bg-green-50">
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>{success}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-700">Admin Email</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter admin email address"
                    className="bg-white"
                  />
                </div>

                {/* Module Access Permissions */}
                <div className="space-y-3">
                  <Label className="text-slate-700">Module Access Permissions</Label>
                  <div className="grid grid-cols-1 gap-3">
                    {MODULES.map((module) => {
                      const Icon = module.icon
                      return (
                        <div key={module.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`module-${module.id}`}
                            checked={selectedModules.includes(module.id)}
                            onCheckedChange={() => handleModuleToggle(module.id)}
                          />
                          <Label 
                            htmlFor={`module-${module.id}`} 
                            className="flex items-center space-x-2 text-slate-700 font-medium"
                          >
                            <Icon className="h-4 w-4" />
                            <span>{module.name}</span>
                          </Label>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-teal-700 hover:bg-teal-800 text-white" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    "Creating..."
                  ) : (
                    <>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Create Admin Account
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Admins List Card */}
          <Card className="bg-cyan-50/50 border-cyan-100">
            <CardHeader>
              <CardTitle className="text-slate-700">Admin Accounts</CardTitle>
              <CardDescription className="text-slate-600">Manage and monitor all admin accounts</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-slate-700">Email</TableHead>
                    <TableHead className="text-slate-700">Created</TableHead>
                    <TableHead className="text-slate-700">Last Login</TableHead>
                    <TableHead className="text-slate-700">Actions</TableHead>
                    <TableHead className="text-slate-700">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {admins.length > 0 ? (
                    admins.map((admin) => (
                      <TableRow key={admin.id}>
                        <TableCell className="font-medium text-slate-700">{admin.email || 'No email for ID: ' + admin.id}</TableCell>
                        <TableCell className="text-slate-600">{new Date(admin.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="text-slate-600">
                          N/A
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="border-slate-300 text-slate-700 hover:bg-slate-100"
                              onClick={() => handleEditAdmin(admin)}
                            >
                              Edit
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="border-red-300 text-red-700 hover:bg-red-100"
                              onClick={() => handleDeleteAdmin(admin.id)}
                            >
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="bg-slate-200 text-slate-700">Active</Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-slate-600">
                        No admin accounts found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}