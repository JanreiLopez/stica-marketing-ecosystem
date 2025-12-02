"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { User, Bell, Shield, Database, Moon } from "lucide-react"
import { AdminSidebar } from "@/components/admin-sidebar"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"

export default function SettingsPage() {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [isDarkMode, setIsDarkMode] = useState(theme === "dark")

  const handleLogout = () => {
    router.push("/login")
  }

  const toggleDarkMode = (checked: boolean) => {
    setIsDarkMode(checked)
    setTheme(checked ? "dark" : "light")
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      {/* Sidebar Navigation - Fixed */}
      <AdminSidebar onLogout={handleLogout} />

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
                    <Input id="firstName" defaultValue="System" className="bg-white dark:bg-slate-700 dark:text-slate-200" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-slate-700 dark:text-slate-200">Last Name</Label>
                    <Input id="lastName" defaultValue="Administrator" className="bg-white dark:bg-slate-700 dark:text-slate-200" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-700 dark:text-slate-200">Email Address</Label>
                  <Input id="email" type="email" defaultValue="admin@stica.edu" className="bg-white dark:bg-slate-700 dark:text-slate-200" />
                </div>
                <Button className="bg-teal-700 hover:bg-teal-800 text-white">Save Profile Changes</Button>
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
                  <Switch defaultChecked />
                </div>
                <Separator className="dark:bg-slate-700" />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-slate-700 dark:text-slate-200">Enrollment Alerts</Label>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Receive alerts for enrollment milestones</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator className="dark:bg-slate-700" />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-slate-700 dark:text-slate-200">Marketing Campaign Updates</Label>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Get updates on campaign performance</p>
                  </div>
                  <Switch />
                </div>
                <Separator className="dark:bg-slate-700" />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-slate-700 dark:text-slate-200">System Maintenance</Label>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Notifications about system updates and maintenance</p>
                  </div>
                  <Switch defaultChecked />
                </div>
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
                  <Input id="currentPassword" type="password" className="bg-white dark:bg-slate-700 dark:text-slate-200" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-slate-700 dark:text-slate-200">New Password</Label>
                  <Input id="newPassword" type="password" className="bg-white dark:bg-slate-700 dark:text-slate-200" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-slate-700 dark:text-slate-200">Confirm New Password</Label>
                  <Input id="confirmPassword" type="password" className="bg-white dark:bg-slate-700 dark:text-slate-200" />
                </div>
                <Button className="bg-teal-700 hover:bg-teal-800 text-white">Update Password</Button>
                <Separator className="dark:bg-slate-700" />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-slate-700 dark:text-slate-200">Two-Factor Authentication</Label>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Add an extra layer of security to your account</p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>

            {/* System Configuration */}
            <Card className="bg-cyan-50/50 dark:bg-slate-800 border-cyan-100 dark:border-slate-700">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-slate-700 dark:text-slate-200" />
                  <CardTitle className="text-slate-700 dark:text-slate-200">System Configuration</CardTitle>
                </div>
                <CardDescription className="text-slate-600 dark:text-slate-400">Configure system-wide settings and preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-slate-700 dark:text-slate-200">Auto-assign Inquiries</Label>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Automatically assign new inquiries to available staff
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator className="dark:bg-slate-700" />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-slate-700 dark:text-slate-200">Email Confirmations</Label>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Send automatic email confirmations for inquiries</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator className="dark:bg-slate-700" />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-slate-700 dark:text-slate-200">Data Analytics</Label>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Enable advanced analytics and reporting</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Button className="mt-4 bg-teal-700 hover:bg-teal-800 text-white">Save System Settings</Button>
              </CardContent>
            </Card>
          </div>
        </main>
    </div>
  )
}