"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { User, Bell, Shield, Moon } from "lucide-react"
import { AdminSidebar } from "@/components/admin-sidebar"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { toast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase-client"

export default function SettingsPage() {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [isDarkMode, setIsDarkMode] = useState(theme === "dark")
  const [isLoading, setIsLoading] = useState(true)
  const [userPermissions, setUserPermissions] = useState<string[]>([]); // New state for user permissions
  
  // Profile settings state
  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    email: ""
  })
  
  // Notification settings state
  const [notificationSettings, setNotificationSettings] = useState({
    newInquiries: true,
    enrollmentAlerts: true,
    marketingUpdates: false
  })
  
  // Security settings state
  const [securityData, setSecurityData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  })

  // Fetch current user profile data
  useEffect(() => {
    const fetchProfileAndPermissions = async () => {
      try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError) throw new Error(`Failed to get user: ${userError.message}`)

        if (user) {
          // Fetch profile data from profiles table
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('first_name, last_name, email, permissions') // Fetch permissions here
            .eq('id', user.id)
            .single()

          if (profileError) throw new Error(`Failed to fetch profile: ${profileError.message}`)

          setProfileData({
            firstName: profile.first_name || "",
            lastName: profile.last_name || "",
            email: profile.email || user.email || ""
          })

          // Parse and set permissions
          try {
            const permissions = typeof profile.permissions === 'string'
              ? JSON.parse(profile.permissions)
              : profile.permissions;
            setUserPermissions(permissions || []);
          } catch (parseError) {
            console.error('Error parsing permissions:', parseError);
            setUserPermissions([]);
          }
        } else {
          router.push('/login'); // Redirect to login if not authenticated
          return;
        }
      } catch (error) {
        console.error("Error fetching profile data:", error)
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to load profile data",
          variant: "destructive"
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfileAndPermissions()
  }, [router]) // Added router to dependency array

  const handleLogout = () => {
    router.push("/login")
  }

  const toggleDarkMode = (checked: boolean) => {
    setIsDarkMode(checked)
    setTheme(checked ? "dark" : "light")
  }
  
  const handleProfileChange = (field: string, value: string) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }))
  }
  
  const handleNotificationChange = (setting: string, value: boolean) => {
    setNotificationSettings(prev => ({
      ...prev,
      [setting]: value
    }))
  }
  
  const handleSecurityChange = (field: string, value: string) => {
    setSecurityData(prev => ({
      ...prev,
      [field]: value
    }))
  }
  
  const saveProfileChanges = async () => {
    try {
      setIsLoading(true)
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError) throw new Error(`Failed to get user: ${userError.message}`)

      if (user) {
        // Update profile data in profiles table
        const { data, error: updateError } = await supabase
          .from('profiles')
          .update({
            first_name: profileData.firstName,
            last_name: profileData.lastName,
            name: `${profileData.firstName} ${profileData.lastName}`.trim() || user.email?.split('@')[0] || ""
          })
          .eq('id', user.id)
          .select()

        if (updateError) {
          throw new Error(`Failed to update profile: ${updateError.message} (Code: ${updateError.code})`)
        }

        toast({
          title: "Profile Updated",
          description: "Your profile settings have been saved successfully."
        })
      } else {
        throw new Error("No user found")
      }
    } catch (error) {
      console.error("Error saving profile data:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save profile data",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  const saveNotificationSettings = () => {
    // In a real implementation, this would save to the database
    toast({
      title: "Notification Settings Updated",
      description: "Your notification preferences have been saved."
    })
  }
  
  const updatePassword = async () => {
    if (!securityData.currentPassword) {
      toast({
        title: "Password Error",
        description: "Please enter your current password.",
        variant: "destructive"
      })
      return
    }

    if (securityData.newPassword !== securityData.confirmPassword) {
      toast({
        title: "Password Error",
        description: "New passwords do not match.",
        variant: "destructive"
      })
      return
    }
    
    if (securityData.newPassword.length < 8) {
      toast({
        title: "Password Error",
        description: "Password must be at least 8 characters long.",
        variant: "destructive"
      })
      return
    }

    try {
      setIsLoading(true)

      // First, verify the current password by attempting to sign in
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error("Failed to get current user")
      }

      // Verify current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: securityData.currentPassword
      })

      if (signInError) {
        toast({
          title: "Password Error",
          description: "Current password is incorrect.",
          variant: "destructive"
        })
        return
      }

      // Update password using Supabase Auth
      const { error: updateError } = await supabase.auth.updateUser({
        password: securityData.newPassword
      })

      if (updateError) {
        throw new Error(`Failed to update password: ${updateError.message}`)
      }

      toast({
        title: "Password Updated",
        description: "Your password has been changed successfully."
      })
      
      setSecurityData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      })
    } catch (error) {
      console.error("Error updating password:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update password",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900 flex items-center justify-center">
        <div className="text-slate-700 dark:text-slate-200">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      {/* Sidebar Navigation - Fixed */}
      <AdminSidebar onLogout={handleLogout} userPermissions={userPermissions} />

        {/* Main Content - Account for fixed sidebar */}
        <main className="ml-64 p-6">
          
          <div className="mb-6">
            <h1 className="text-3xl font-serif font-bold text-slate-700 dark:text-slate-200 mb-2">System Settings</h1>
            <p className="text-slate-600 dark:text-slate-400">
              Configure system preferences, user management, and security settings
            </p>
          </div>

          <div className="space-y-6">
            {/* Appearance Settings */}
            <Card className="bg-cyan-50/50 dark:bg-slate-800 border-cyan-100 dark:border-slate-700">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Moon className="h-5 w-5 text-slate-700 dark:text-slate-200" />
                  <CardTitle className="text-slate-700 dark:text-slate-200">Appearance</CardTitle>
                </div>
                <CardDescription className="text-slate-600 dark:text-slate-400">Customize the visual appearance of the dashboard</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-slate-700 dark:text-slate-200">Dark Mode</Label>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Toggle between light and dark theme</p>
                  </div>
                  <Switch checked={isDarkMode} onCheckedChange={toggleDarkMode} />
                </div>
              </CardContent>
            </Card>

            {/* Profile Settings */}
            <Card className="bg-cyan-50/50 dark:bg-slate-800 border-cyan-100 dark:border-slate-700">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-slate-700 dark:text-slate-200" />
                  <CardTitle className="text-slate-700 dark:text-slate-200">Profile Settings</CardTitle>
                </div>
                <CardDescription className="text-slate-600 dark:text-slate-400">Manage your administrator profile information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-slate-700 dark:text-slate-200">First Name</Label>
                    <Input 
                      id="firstName" 
                      value={profileData.firstName} 
                      onChange={(e) => handleProfileChange('firstName', e.target.value)}
                      className="bg-white dark:bg-slate-700 dark:text-slate-200" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-slate-700 dark:text-slate-200">Last Name</Label>
                    <Input 
                      id="lastName" 
                      value={profileData.lastName} 
                      onChange={(e) => handleProfileChange('lastName', e.target.value)}
                      className="bg-white dark:bg-slate-700 dark:text-slate-200" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-700 dark:text-slate-200">Email Address</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={profileData.email} 
                    onChange={(e) => handleProfileChange('email', e.target.value)}
                    className="bg-white dark:bg-slate-700 dark:text-slate-200" 
                    disabled
                  />
                </div>
                <Button 
                  className="bg-primary hover:bg-primary/90"
                  onClick={saveProfileChanges}
                  disabled={isLoading}
                >
                  {isLoading ? "Saving..." : "Save Profile Changes"}
                </Button>
              </CardContent>
            </Card>

            {/* Security Settings */}
            <Card className="bg-cyan-50/50 dark:bg-slate-800 border-cyan-100 dark:border-slate-700">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-slate-700 dark:text-slate-200" />
                  <CardTitle className="text-slate-700 dark:text-slate-200">Security Settings</CardTitle>
                </div>
                <CardDescription className="text-slate-600 dark:text-slate-400">Manage security preferences and access controls</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword" className="text-slate-700 dark:text-slate-200">Current Password</Label>
                  <Input 
                    id="currentPassword" 
                    type="password" 
                    value={securityData.currentPassword}
                    onChange={(e) => handleSecurityChange('currentPassword', e.target.value)}
                    className="bg-white dark:bg-slate-700 dark:text-slate-200" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-slate-700 dark:text-slate-200">New Password</Label>
                  <Input 
                    id="newPassword" 
                    type="password" 
                    value={securityData.newPassword}
                    onChange={(e) => handleSecurityChange('newPassword', e.target.value)}
                    className="bg-white dark:bg-slate-700 dark:text-slate-200" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-slate-700 dark:text-slate-200">Confirm New Password</Label>
                  <Input 
                    id="confirmPassword" 
                    type="password" 
                    value={securityData.confirmPassword}
                    onChange={(e) => handleSecurityChange('confirmPassword', e.target.value)}
                    className="bg-white dark:bg-slate-700 dark:text-slate-200" 
                  />
                </div>
                <Button 
                  className="bg-primary hover:bg-primary/90"
                  onClick={updatePassword}
                >
                  Update Password
                </Button>
              </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card className="bg-cyan-50/50 dark:bg-slate-800 border-cyan-100 dark:border-slate-700">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-slate-700 dark:text-slate-200" />
                  <CardTitle className="text-slate-700 dark:text-slate-200">Notification Preferences</CardTitle>
                </div>
                <CardDescription className="text-slate-600 dark:text-slate-400">Configure how you receive system notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-slate-700 dark:text-slate-200">New Inquiry Notifications</Label>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Get notified when new inquiries are submitted</p>
                  </div>
                  <Switch 
                    checked={notificationSettings.newInquiries} 
                    onCheckedChange={(checked) => handleNotificationChange('newInquiries', checked)} 
                  />
                </div>
                <Separator className="dark:bg-slate-700" />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-slate-700 dark:text-slate-200">Enrollment Alerts</Label>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Receive alerts for enrollment milestones</p>
                  </div>
                  <Switch 
                    checked={notificationSettings.enrollmentAlerts} 
                    onCheckedChange={(checked) => handleNotificationChange('enrollmentAlerts', checked)} 
                  />
                </div>
                <Separator className="dark:bg-slate-700" />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-slate-700 dark:text-slate-200">Marketing Campaign Updates</Label>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Get updates on campaign performance</p>
                  </div>
                  <Switch 
                    checked={notificationSettings.marketingUpdates} 
                    onCheckedChange={(checked) => handleNotificationChange('marketingUpdates', checked)} 
                  />
                </div>
                <Button 
                  className="mt-4 bg-primary hover:bg-primary/90"
                  onClick={saveNotificationSettings}
                >
                  Save Notification Settings
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
    </div>
  )
}