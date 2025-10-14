"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { GraduationCap, ArrowRight, CheckCircle, ArrowLeft, AlertCircle, Loader2, Save } from "lucide-react"
import Link from "next/link"

export default function InquiryPage() {
  const [submitted, setSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isDraftSaved, setIsDraftSaved] = useState(false)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    programs: [] as string[],
    studyMode: "",
    startDate: "",
    experience: "",
    goals: "",
    hearAbout: "",
    newsletter: false,
  })

  // Load draft from localStorage on component mount
  useEffect(() => {
    const savedDraft = localStorage.getItem('stica-inquiry-draft')
    if (savedDraft) {
      try {
        const parsedDraft = JSON.parse(savedDraft)
        setFormData(parsedDraft)
      } catch (error) {
        console.error('Error loading draft:', error)
      }
    }
  }, [])

  // Save draft to localStorage whenever form data changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      localStorage.setItem('stica-inquiry-draft', JSON.stringify(formData))
      setIsDraftSaved(true)
      setTimeout(() => setIsDraftSaved(false), 2000)
    }, 1000)
    
    return () => clearTimeout(timeoutId)
  }, [formData])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.firstName.trim()) newErrors.firstName = "First name is required"
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required"
    if (!formData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address"
    }
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required"
    } else if (!/^[\+]?[1-9][\d]{0,15}$/.test(formData.phone.replace(/[\s\-\(\)]/g, ''))) {
      newErrors.phone = "Please enter a valid phone number"
    }
    if (formData.programs.length === 0) newErrors.programs = "Please select at least one program"
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Here you would typically send the data to your backend
      console.log("Form submitted:", formData)
      
      // Clear the draft from localStorage
      localStorage.removeItem('stica-inquiry-draft')
      
      setSubmitted(true)
    } catch (error) {
      console.error('Submission error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleProgramChange = (program: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      programs: checked ? [...prev.programs, program] : prev.programs.filter((p) => p !== program),
    }))
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="container mx-auto px-4">
          <Card className="max-w-2xl mx-auto text-center">
            <CardHeader>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl text-green-600">Thank You!</CardTitle>
              <CardDescription>
                Your inquiry has been successfully submitted. Our admissions team will contact you within 24 hours.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                We've sent a confirmation email to <strong>{formData.email}</strong>
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/">
                  <Button variant="outline">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Home
                  </Button>
                </Link>
                <Button onClick={() => setSubmitted(false)}>Submit Another Inquiry</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <GraduationCap className="h-8 w-8 text-primary" />
              <span className="text-2xl font-serif font-bold text-primary">STICA</span>
            </Link>
            <Link href="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-serif font-bold text-foreground mb-4">Start Your Educational Journey</h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Complete this comprehensive inquiry form to help us understand your goals and recommend the best
                programs for you.
              </p>
              
              {/* Progress Indicator */}
              <div className="mt-6 max-w-md mx-auto">
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                  <span>Form Progress</span>
                  <span>{Math.round((Object.values(formData).filter(value => 
                    Array.isArray(value) ? value.length > 0 : value !== "" && value !== false
                  ).length / Object.keys(formData).length) * 100)}%</span>
                </div>
                <Progress 
                  value={(Object.values(formData).filter(value => 
                    Array.isArray(value) ? value.length > 0 : value !== "" && value !== false
                  ).length / Object.keys(formData).length) * 100} 
                  className="h-2"
                />
              </div>

              {/* Draft Saved Indicator */}
              {isDraftSaved && (
                <div className="mt-4 flex items-center justify-center gap-2 text-sm text-green-600">
                  <Save className="h-4 w-4" />
                  Draft saved automatically
                </div>
              )}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Program Inquiry Form</CardTitle>
                <CardDescription>Please provide detailed information to help us serve you better</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Personal Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground">Personal Information</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name *</Label>
                        <Input
                          id="firstName"
                          required
                          value={formData.firstName}
                          onChange={(e) => setFormData((prev) => ({ ...prev, firstName: e.target.value }))}
                          placeholder="Enter your first name"
                          className={errors.firstName ? "border-red-500" : ""}
                        />
                        {errors.firstName && (
                          <p className="text-sm text-red-500 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {errors.firstName}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name *</Label>
                        <Input
                          id="lastName"
                          required
                          value={formData.lastName}
                          onChange={(e) => setFormData((prev) => ({ ...prev, lastName: e.target.value }))}
                          placeholder="Enter your last name"
                          className={errors.lastName ? "border-red-500" : ""}
                        />
                        {errors.lastName && (
                          <p className="text-sm text-red-500 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {errors.lastName}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address *</Label>
                        <Input
                          id="email"
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                          placeholder="Enter your email address"
                          className={errors.email ? "border-red-500" : ""}
                        />
                        {errors.email && (
                          <p className="text-sm text-red-500 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {errors.email}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number *</Label>
                        <Input
                          id="phone"
                          type="tel"
                          required
                          value={formData.phone}
                          onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                          placeholder="Enter your phone number"
                          className={errors.phone ? "border-red-500" : ""}
                        />
                        {errors.phone && (
                          <p className="text-sm text-red-500 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {errors.phone}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Program Interest */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground">Program Interest</h3>
                    <div className="space-y-3">
                      <Label>Which programs interest you? (Select all that apply) *</Label>
                      <div className="grid md:grid-cols-2 gap-3">
                        {[
                          "Software Development",
                          "Data Science & Analytics",
                          "Cybersecurity",
                          "AI & Machine Learning",
                          "Business Administration",
                          "Digital Marketing",
                          "Project Management",
                          "Entrepreneurship",
                        ].map((program) => (
                          <div key={program} className="flex items-center space-x-2">
                            <Checkbox
                              id={program}
                              checked={formData.programs.includes(program)}
                              onCheckedChange={(checked) => handleProgramChange(program, checked as boolean)}
                            />
                            <Label htmlFor={program} className="text-sm">
                              {program}
                            </Label>
                          </div>
                        ))}
                      </div>
                      {errors.programs && (
                        <p className="text-sm text-red-500 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.programs}
                        </p>
                      )}
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Preferred Study Mode</Label>
                        <RadioGroup
                          value={formData.studyMode}
                          onValueChange={(value) => setFormData((prev) => ({ ...prev, studyMode: value }))}
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="online" id="online" />
                            <Label htmlFor="online">Online</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="onsite" id="onsite" />
                            <Label htmlFor="onsite">On-site</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="hybrid" id="hybrid" />
                            <Label htmlFor="hybrid">Hybrid</Label>
                          </div>
                        </RadioGroup>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="startDate">Preferred Start Date</Label>
                        <Select
                          value={formData.startDate}
                          onValueChange={(value) => setFormData((prev) => ({ ...prev, startDate: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select start date" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="immediate">Immediately</SelectItem>
                            <SelectItem value="next-month">Next Month</SelectItem>
                            <SelectItem value="next-quarter">Next Quarter</SelectItem>
                            <SelectItem value="next-semester">Next Semester</SelectItem>
                            <SelectItem value="flexible">Flexible</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Additional Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground">Additional Information</h3>

                    <div className="space-y-2">
                      <Label htmlFor="experience">Previous Experience/Education</Label>
                      <Textarea
                        id="experience"
                        value={formData.experience}
                        onChange={(e) => setFormData((prev) => ({ ...prev, experience: e.target.value }))}
                        placeholder="Tell us about your educational background and relevant experience..."
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="goals">Career Goals</Label>
                      <Textarea
                        id="goals"
                        value={formData.goals}
                        onChange={(e) => setFormData((prev) => ({ ...prev, goals: e.target.value }))}
                        placeholder="What are your career goals and how can STICA help you achieve them?"
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="hearAbout">How did you hear about STICA?</Label>
                      <Select
                        value={formData.hearAbout}
                        onValueChange={(value) => setFormData((prev) => ({ ...prev, hearAbout: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select an option" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="search-engine">Search Engine</SelectItem>
                          <SelectItem value="social-media">Social Media</SelectItem>
                          <SelectItem value="friend-referral">Friend/Family Referral</SelectItem>
                          <SelectItem value="advertisement">Advertisement</SelectItem>
                          <SelectItem value="education-fair">Education Fair</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="newsletter"
                        checked={formData.newsletter}
                        onCheckedChange={(checked) =>
                          setFormData((prev) => ({ ...prev, newsletter: checked as boolean }))
                        }
                      />
                      <Label htmlFor="newsletter" className="text-sm">
                        I would like to receive updates and newsletters from STICA
                      </Label>
                    </div>
                  </div>

                  <Button type="submit" className="w-full bg-primary hover:bg-primary/90" size="lg" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Submitting Inquiry...
                      </>
                    ) : (
                      <>
                        Submit Inquiry
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </>
                    )}
                  </Button>

                  {/* Show validation errors summary */}
                  {Object.keys(errors).length > 0 && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Please fix the {Object.keys(errors).length} error{Object.keys(errors).length > 1 ? 's' : ''} above before submitting.
                      </AlertDescription>
                    </Alert>
                  )}
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
