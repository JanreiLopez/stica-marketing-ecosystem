"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { User, Bell, Shield, Database } from "lucide-react"
import { AdminBreadcrumbs } from "@/components/admin-breadcrumbs"
import { AdminSidebar } from "@/components/admin-sidebar"
import { useRouter } from "next/navigation"

export default function SettingsPage() {
  const router = useRouter()

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
            <h1 className="text-3xl font-serif font-bold text-foreground mb-2">System Settings</h1>
            <p className="text-muted-foreground">
              Configure system preferences, user management, and security settings
            </p>
          </div>

          <div className="space-y-6">
            {/* Profile Settings */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  <CardTitle>Profile Settings</CardTitle>
                </div>
                <CardDescription>Manage your administrator profile information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" defaultValue="System" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" defaultValue="Administrator" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" defaultValue="admin@stica.edu" />
                </div>
                <Button>Save Profile Changes</Button>
              </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  <CardTitle>Notification Preferences</CardTitle>
                </div>
                <CardDescription>Configure how you receive system notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>New Inquiry Notifications</Label>
                    <p className="text-sm text-muted-foreground">Get notified when new inquiries are submitted</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enrollment Alerts</Label>
                    <p className="text-sm text-muted-foreground">Receive alerts for enrollment milestones</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Marketing Campaign Updates</Label>
                    <p className="text-sm text-muted-foreground">Get updates on campaign performance</p>
                  </div>
                  <Switch />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>System Maintenance</Label>
                    <p className="text-sm text-muted-foreground">Notifications about system updates and maintenance</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>

            {/* Security Settings */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  <CardTitle>Security Settings</CardTitle>
                </div>
                <CardDescription>Manage security preferences and access controls</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input id="currentPassword" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input id="newPassword" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input id="confirmPassword" type="password" />
                </div>
                <Button>Update Password</Button>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>

            {/* System Configuration */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  <CardTitle>System Configuration</CardTitle>
                </div>
                <CardDescription>Configure system-wide settings and preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto-assign Inquiries</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically assign new inquiries to available staff
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Confirmations</Label>
                    <p className="text-sm text-muted-foreground">Send automatic email confirmations for inquiries</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Data Analytics</Label>
                    <p className="text-sm text-muted-foreground">Enable advanced analytics and reporting</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Button className="mt-4">Save System Settings</Button>
              </CardContent>
            </Card>
          </div>
        </main>
    </div>
  )
}
