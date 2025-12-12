"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { User, Lock, ArrowRight, AlertCircle, CheckCircle, Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase-client"
import { toast } from "sonner"

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<'admin' | 'superadmin'>('admin')
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      console.log("Login attempt with email:", formData.email, "and tab:", activeTab)
      
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email: formData.email, password: formData.password });
      if (signInError) throw new Error(`Authentication failed: ${signInError.message}`);

      console.log("Auth successful, user data:", data.user);
      console.log("Active tab:", activeTab);

      if (activeTab === 'superadmin') {
        console.log("Superadmin tab selected, checking credentials...");
        if (formData.email === "superadmin@stica.edu") {
          toast.success("Login successful! Redirecting to superadmin dashboard...");
          setTimeout(() => { window.location.href = "/superadmin/dashboard"; }, 1500);
          return;
        } else {
          toast.error("Not authorized as superadmin");
        }
      }

      console.log("Admin tab selected, checking admin data...");
      const { data: adminData, error: adminError } = await supabase.from('profiles').select('role').eq('id', data.user.id).single();
      if (adminError) { toast.error("User not found in admin system. Please contact administrator."); setIsLoading(false); return; }

      if (adminData.role === 'superadmin') {
        toast.success("Login successful! Redirecting to superadmin dashboard...");
        setTimeout(() => { window.location.href = "/superadmin/dashboard"; }, 1500);
      } else if (adminData.role === 'admin') {
        toast.success("Login successful! Redirecting to admin dashboard...");
        setTimeout(() => { window.location.href = "/admin/dashboard"; }, 1500);
      } else {
        throw new Error("Unauthorized role");
      }
    } catch (err) {
      console.error("Login error:", err);
      toast.error(err instanceof Error ? err.message : "Invalid email or password");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background graphic */}
      <div className="absolute inset-0 z-0 opacity-5 dark:opacity-10">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 animate-gradient-xy"></div>
      </div>

      <div className="relative z-10 w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <span className="text-2xl font-serif font-bold text-gray-900 dark:text-white">Marketeam</span>
          </Link>
          <h1 className="text-4xl font-serif font-bold text-gray-900 dark:text-white mb-2">Admin Portal</h1>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">Sign in to access the administrative dashboard</p>
        </div>

        <Card className="mx-auto w-full bg-white shadow-xl border border-gray-200 dark:border-gray-700 rounded-lg">
          <CardHeader className="space-y-1 text-center">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg overflow-hidden">
              <Image src="/marketeam-logo.png" alt="Marketeam Logo" width={48} height={48} className="h-12 w-12 object-contain" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">Administrator Login</CardTitle>
            <CardDescription className="text-gray-500 dark:text-gray-400">Enter your credentials to access the admin dashboard</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {/* Tabs */}
            <div className="flex w-full bg-gray-100 dark:bg-gray-700 rounded-md p-1 mb-6">
              <button
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'admin' ? 'bg-blue-700 dark:bg-blue-700 text-white shadow' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                onClick={() => setActiveTab('admin')}
              >Admin Login</button>
              <button
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'superadmin' ? 'bg-blue-700 dark:bg-blue-700 text-white shadow' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                onClick={() => setActiveTab('superadmin')}
              >Super Admin Login</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 dark:text-gray-200">Email Address</Label>
                <div className="relative">
                  <Input id="email" type="email" required value={formData.email} onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))} placeholder="Enter your email address" className="pl-10 bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500" />
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700 dark:text-gray-200">Password</Label>
                <div className="relative">
                  <Input id="password" type={showPassword ? "text" : "password"} required value={formData.password} onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))} placeholder="Enter your password" className="pl-10 pr-10 bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500" />
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <button type="button" onClick={() => setShowPassword(prev => !prev)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {activeTab === 'admin' && (<Link href="/forgot-password" className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-200">Forgot password?</Link>)}
              </div>

              <Button type="submit" className="w-full bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white font-semibold py-2 px-4 rounded-md transition-colors" size="lg" disabled={isLoading}>
                {isLoading ? "Signing in..." : (<><ArrowRight className="ml-2 h-5 w-5" /> Sign In</>)}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">This is a secure admin portal. All login attempts are monitored and logged.</p>
        </div>
      </div>
    </div>
  )
}