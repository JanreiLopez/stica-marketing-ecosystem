"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { User, Lock, ArrowRight, AlertCircle, CheckCircle } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase-client"

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<'admin' | 'superadmin'>('admin')
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      console.log("Login attempt with email:", formData.email, "and tab:", activeTab)
      
      // Sign in with Supabase Auth
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })

      if (signInError) {
        console.error("Sign in error:", signInError)
        throw new Error(`Authentication failed: ${signInError.message}`)
      }

      console.log("Auth successful, user data:", data.user)
      console.log("Active tab:", activeTab)

      // For superadmin tab, check if user is superadmin
      if (activeTab === 'superadmin') {
        console.log("Superadmin tab selected, checking credentials...")
        // In a real implementation, you would check against your superadmin table
        // For now, we'll use a simple email check
        if (formData.email === "superadmin@stica.edu") {
          setSuccess("Login successful! Redirecting to superadmin dashboard...")
          console.log("Redirecting superadmin to dashboard...")
          // Add a small delay to show the success message before redirecting
          setTimeout(() => {
            console.log("Performing redirect to superadmin dashboard...")
            window.location.href = "/superadmin/dashboard";
          }, 1500)
          return
        } else {
          console.log("Invalid superadmin credentials")
          throw new Error("Not authorized as superadmin")
        }
      }

      console.log("Admin tab selected, checking admin data...")
      // For admin tab, check if user is admin
      const { data: adminData, error: adminError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()

      if (adminError) {
        console.error("Admin data fetch error:", adminError)
        throw new Error(`User not found in admin system. Please contact administrator.`)
      }

      console.log("Admin data:", adminData)

      // Redirect based on role
      if (adminData.role === 'superadmin') {
        setSuccess("Login successful! Redirecting to superadmin dashboard...")
        console.log("Redirecting superadmin to dashboard...")
        setTimeout(() => {
          console.log("Performing redirect to superadmin dashboard...")
          window.location.href = "/superadmin/dashboard";
        }, 1500)
      } else if (adminData.role === 'admin') {
        setSuccess("Login successful! Redirecting to admin dashboard...")
        console.log("Redirecting admin to dashboard...")
        setTimeout(() => {
          console.log("Performing redirect to admin dashboard...")
          window.location.href = "/admin/dashboard";
        }, 1500)
      } else {
        throw new Error("Unauthorized role")
      }
    } catch (err) {
      console.error("Login error:", err)
      setError(err instanceof Error ? err.message : "Invalid email or password")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="container mx-auto px-4">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 mb-6">
              <Image 
                src="/marketeam-logo.png" 
                alt="Marketeam Logo" 
                width={48} 
                height={48} 
                className="h-12 w-12"
              />
              <span className="text-2xl font-serif font-bold text-slate-700">Marketeam</span>
            </Link>
            <h1 className="text-3xl font-serif font-bold text-slate-700 mb-2">Admin Portal</h1>
            <p className="text-slate-600">Sign in to access the administrative dashboard</p>
          </div>

          <Card className="bg-cyan-50/50 border-cyan-100">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="h-8 w-8 text-slate-600" />
              </div>
              <CardTitle className="text-slate-700">Administrator Login</CardTitle>
              <CardDescription className="text-slate-600">Enter your credentials to access the admin dashboard</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Tabs */}
              <div className="flex border-b border-slate-200 mb-6">
                <button
                  className={`py-2 px-4 font-medium text-sm ${
                    activeTab === 'admin'
                      ? 'text-slate-700 border-b-2 border-teal-700'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                  onClick={() => setActiveTab('admin')}
                >
                  Admin Login
                </button>
                <button
                  className={`py-2 px-4 font-medium text-sm ${
                    activeTab === 'superadmin'
                      ? 'text-slate-700 border-b-2 border-teal-700'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                  onClick={() => setActiveTab('superadmin')}
                >
                  Super Admin Login
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
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
                  <Label htmlFor="email" className="text-slate-700">Email Address</Label>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                      placeholder="Enter your email address"
                      className="pl-10 bg-white"
                    />
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-700">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type="password"
                      required
                      value={formData.password}
                      onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                      placeholder="Enter your password"
                      className="pl-10 bg-white"
                    />
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
                  </div>
                </div>

                <Button type="submit" className="w-full bg-teal-700 hover:bg-teal-800 text-white" size="lg" disabled={isLoading}>
                  {isLoading ? (
                    "Signing in..."
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>


          {/* Security Notice */}
          <div className="mt-6 text-center">
            <p className="text-xs text-slate-600">
              This is a secure admin portal. All login attempts are monitored and logged.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}