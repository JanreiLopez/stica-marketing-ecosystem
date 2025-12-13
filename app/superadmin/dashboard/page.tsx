"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { PlusCircle, LogOut, FileText, Building2, Target, School, Edit, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase-client"
import { toast } from "sonner"
import { EditAdminModal } from "@/components/edit-admin-modal"
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

interface AdminUser {
  id: string
  email: string
  created_at: string
  first_name?: string
  last_name?: string
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
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [admins, setAdmins] = useState<AdminUser[]>([])
  const [selectedModules, setSelectedModules] = useState<string[]>(["inquiries", "enrollment", "marketing", "schools"])
  const router = useRouter()

  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [currentAdminToEdit, setCurrentAdminToEdit] = useState<AdminUser | null>(null)
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false) // State for delete alert dialog
  const [adminToDeleteId, setAdminToDeleteId] = useState<string | null>(null) // State to store admin ID to delete
  const [adminPasswords, setAdminPasswords] = useState<Record<string, string>>({}) // Store generated passwords by admin ID

  // Load saved passwords from localStorage on mount
  useEffect(() => {
    try {
      const savedPasswords = localStorage.getItem('adminPasswords');
      if (savedPasswords) {
        setAdminPasswords(JSON.parse(savedPasswords));
      }
    } catch (error) {
      console.error('Error loading saved passwords from localStorage:', error);
    }
  }, []);

  // Save passwords to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('adminPasswords', JSON.stringify(adminPasswords));
    } catch (error) {
      console.error('Error saving passwords to localStorage:', error);
    }
  }, [adminPasswords]);

  useEffect(() => {
    checkDatabaseStructure();
    fetchAdmins()
  }, [])

  const checkDatabaseStructure = async () => {
    try {
      const { error } = await supabase.from('profiles').select('*').limit(1);
      if (error) console.warn("Could not access profiles table:", error.message);

      const { error: tableError } = await supabase.from('profiles').select('email, role, permissions, created_at').limit(1);
      if (tableError) {
        console.warn("Could not access profiles table with specific columns:", tableError.message);
        const { error: minimalError } = await supabase.from('profiles').select('email, role').limit(1);
        if (minimalError) console.warn("Could not access profiles table with minimal columns:", minimalError.message);
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
          return []
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
      return processedData
    } catch (err) {
      console.error("Failed to fetch admins:", err)
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch admins: Unknown error"
      toast.error(errorMessage)
      return []
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
    

    try {
      // Validate email format
      const trimmedEmail = email.trim();
      if (!trimmedEmail || !/\S+@\S+\.\S+/.test(trimmedEmail)) {
        throw new Error("Please enter a valid email address")
      }

      // Validate first and last name
      if (!firstName.trim()) {
        toast.error("First name is required.");
        setIsLoading(false);
        return;
      }
      if (!lastName.trim()) {
        toast.error("Last name is required.");
        setIsLoading(false);
        return;
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
      toast.error("An admin with this email already exists");
      setIsLoading(false); // Stop loading state if validation fails
      return;
    }

    // Call the admin API route to create the user with proper permissions
    let response;
    try {
      console.log('Making API request to create admin:', { email: trimmedEmail, firstName, lastName });
      response = await fetch('/api/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: trimmedEmail,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          permissions: selectedModules
        }),
      });
      console.log('API response received:', response.status, response.statusText);
    } catch (fetchError) {
      console.error('Network error during fetch:', fetchError);
      throw new Error(`Network error: ${fetchError instanceof Error ? fetchError.message : 'Failed to connect to the server'}`);
    }
    
    // Check if response is OK before trying to parse JSON
    if (!response.ok) {
      console.error('API response not OK:', response.status, response.statusText);
      let errorText = '';
      try {
        errorText = await response.text();
        console.error('Error response body:', errorText);
      } catch (e) {
        console.error('Could not read error response body:', e);
      }
      throw new Error(`Server error: ${response.status} ${response.statusText}${errorText ? ` - ${errorText}` : ''}`);
    }
    
    let result;
    try {
      result = await response.json();
      console.log('Parsed API response:', result);
    } catch (parseError) {
      console.error('Error parsing JSON response:', parseError);
      throw new Error(`Invalid response from server: ${await response.text()}`);
    }
    
    if (!response.ok) {
      // Handle specific error cases
      if (result.error && result.error.includes('already been registered')) {
        throw new Error('An admin with this email address has already been registered');
      }
      throw new Error(result.error || `Server error: ${response.status} ${response.statusText}`);
    }
    
    // For the profileData, we'll use a placeholder since the API route handles the actual creation
    // In a real implementation, you might want to fetch the created user data
    const userId = 'placeholder-id'; // This won't be used since we're not inserting directly anymore
    
    // The API route handles user creation, so we don't need to insert into profiles directly
    
    await new Promise((resolve) => setTimeout(resolve, 1500))
    
    let finalSuccessMessage = result.message || `Admin successfully created.`;
    if (result.emailSent) {
      finalSuccessMessage += ' An email with the temporary password has been sent to the admin\'s inbox.';
    } else {
      finalSuccessMessage += ' Email service is not configured. Please provide the temporary password manually.';
    }
    
    // Always show the temporary password in the toast
    if (result.tempPassword) {
      finalSuccessMessage += ` Temporary password: ${result.tempPassword}`;
      // Store the generated password so it persists when editing
      // Fetch admins and then store the password for the newly created admin
      const tempPasswordToStore = result.tempPassword;
      const updatedAdmins = await fetchAdmins();
      // Find the newly created admin by email and store the password
      const newAdmin = updatedAdmins.find((a: AdminUser) => a.email === trimmedEmail);
      if (newAdmin) {
        setAdminPasswords(prev => ({
          ...prev,
          [newAdmin.id]: tempPasswordToStore
        }));
      }
    } else {
      await fetchAdmins(); // Refresh the admin list
    }
    toast.success(finalSuccessMessage);
    setEmail("");
    setFirstName("");
    setLastName("");
  } catch (err) {
    console.error("Create admin error:", err);
    let errorMessage = err instanceof Error ? err.message : "An unknown error occurred. Please try again."
    
    // Provide more specific guidance for common issues
    if (errorMessage.includes('Network error') || errorMessage.includes('Failed to fetch')) {
      errorMessage = "Unable to connect to the server. Please check your internet connection and try again. If the problem persists, the email service may not be properly configured.";
    } else if (errorMessage.includes('email') || errorMessage.includes('SMTP')) {
      errorMessage = "Email service is not properly configured. Please contact the system administrator to set up email delivery. The admin account was not created.";
    }
    
    toast.error(errorMessage)
  } finally {
    setIsLoading(false)
  }
}

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  const handleEditAdmin = (admin: AdminUser) => {
    setCurrentAdminToEdit(admin)
    setIsEditModalOpen(true)
  }

  const handleSaveEditedAdmin = async (updatedAdmin: AdminUser) => {
    setIsLoading(true)
    try {
      console.log("Making API request to update admin:", updatedAdmin)
      
      // Prepare the request body with proper field names
      const requestBody = {
        id: updatedAdmin.id,
        firstName: updatedAdmin.first_name,
        lastName: updatedAdmin.last_name,
        permissions: updatedAdmin.permissions,
        password: (updatedAdmin as any).password, // Include password if provided
      };
      
      const response = await fetch('/api/admin/edit', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update admin user');
      }

      // Show success message with password if it was updated
      let successMessage = result.message || `Admin ${updatedAdmin.email} updated successfully!`;
      if (result.tempPassword) {
        successMessage += ` New password: ${result.tempPassword}`;
        // Store the generated password so it persists when editing again
        setAdminPasswords(prev => ({
          ...prev,
          [updatedAdmin.id]: result.tempPassword
        }));
      }
      
      toast.success(successMessage);
      setIsEditModalOpen(false);
      fetchAdmins(); // Refresh the list after editing
    } catch (err) {
      console.error("Update admin error:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to update admin account"
      toast.error(errorMessage)
    } finally {
      setIsLoading(false);
    }
  }

  const handleDeleteAdmin = async (adminId: string) => {
    setAdminToDeleteId(adminId) // Store the ID of the admin to be deleted
    setIsDeleteAlertOpen(true) // Open the alert dialog
  }

  const confirmDeleteAdmin = async () => {
    if (!adminToDeleteId) return
  
    try {
      // Call the delete admin API route to properly delete the user from both auth and profiles
      const response = await fetch('/api/admin/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: adminToDeleteId }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete admin user');
      }
      
      // Refresh the admin list
      fetchAdmins()
      
      // Remove the password from localStorage when admin is deleted
      setAdminPasswords(prev => {
        const updated = { ...prev };
        delete updated[adminToDeleteId];
        return updated;
      });
      
      // Show success message
      toast.success("Admin account deleted successfully")
    } catch (err) {
      console.error("Delete admin error:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to delete admin account"
      toast.error(errorMessage)
    } finally {
      setIsDeleteAlertOpen(false) // Close the alert dialog
      setAdminToDeleteId(null) // Clear the admin to delete ID
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
          <Button variant="outline" onClick={handleLogout} className="border-slate-300 text-slate-700 dark:border-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800">
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Create Admin Card */}
          <Card className="bg-cyan-50/50 border-cyan-100">
            <CardHeader>
              <CardTitle className="text-slate-700">Create New Admin</CardTitle>
              <CardDescription className="text-slate-600">Enter admin details to generate account with temporary password</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateAdmin} className="space-y-4">

                {/* {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )} */}

                {/* {success && (
                  <Alert variant="default" className="border-green-500 text-green-700 bg-green-50">
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      {success}
                      {success.includes('Temporary password:') && (
                        <div className="mt-2 p-2 bg-yellow-100 border border-yellow-300 rounded text-yellow-800">
                          <strong>Temporary Password:</strong> {success.split('Temporary password: ')[1]}
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>
                )} */}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-slate-700">First Name</Label>
                    <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Enter first name" className="bg-white" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-slate-700">Last Name</Label>
                    <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Enter last name" className="bg-white" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-700">Admin Email</Label>
                  <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter admin email address" className="bg-white" />
                </div>

                {/* Module Access Permissions */}
                <div className="space-y-3">
                  <Label className="text-slate-700">Module Access Permissions</Label>
                  <div className="grid grid-cols-1 gap-3">
                    {MODULES.map(({ id, name, icon: Icon }) => (
                      <div key={id} className="flex items-center space-x-2">
                        <Checkbox id={`module-${id}`} checked={selectedModules.includes(id)} onCheckedChange={() => handleModuleToggle(id)} />
                        <Label htmlFor={`module-${id}`} className="flex items-center space-x-2 text-slate-700 font-medium">
                          <Icon className="h-4 w-4" />
                          <span>{name}</span>
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={isLoading}>
                  {isLoading ? "Creating..." : (<><PlusCircle className="mr-2 h-4 w-4" /> Create Admin Account</>)}
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
                  <TableRow className="bg-slate-50 dark:bg-slate-800/50">
                    <TableHead className="text-slate-700">Name</TableHead>
                    <TableHead className="text-slate-700">Email</TableHead>
                    <TableHead className="text-slate-700">Created</TableHead>
                    <TableHead className="text-slate-700">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {admins.length > 0 ? (
                    admins.map((admin) => (
                      <TableRow key={admin.id}>
                        <TableCell className="font-medium text-slate-700">
                          {admin.first_name || admin.last_name ? `${admin.first_name || ''} ${admin.last_name || ''}`.trim() : 'No name provided'}
                        </TableCell>
                        <TableCell className="text-slate-700">{admin.email || 'No email for ID: ' + admin.id}</TableCell>
                        <TableCell className="text-slate-600">{new Date(admin.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-blue-600/20 hover:text-blue-300" onClick={() => handleEditAdmin(admin)}><Edit className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-red-600/20 hover:text-red-300" onClick={() => handleDeleteAdmin(admin.id)}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow><TableCell colSpan={4} className="text-center text-slate-600">No admin accounts found</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
      <EditAdminModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        admin={currentAdminToEdit}
        onSave={handleSaveEditedAdmin}
        isLoading={isLoading} // Pass isLoading to the modal if it performs async ops
        savedPassword={currentAdminToEdit ? adminPasswords[currentAdminToEdit.id] : undefined}
      />
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 border-slate-200 dark:border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-800 dark:text-slate-100">Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600 dark:text-slate-400">
              Are you sure you want to delete this admin account? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteAdmin}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}