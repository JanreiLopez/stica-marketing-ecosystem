"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Users, BookOpen, Award, ArrowRight, Menu, Laptop, Code, Hotel, Plane, Calculator, Smartphone, Globe, GraduationCap, Building2 } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"
import Image from "next/image"

export default function LandingPage() {
  const [isOpen, setIsOpen] = useState(false)
  const [formData, setFormData] = useState({
    inquiryType: "",
    studentType: "",
    firstName: "",
    lastName: "",
    presentSchool: "",
    email: "",
    phone: "",
    programs: [] as string[],
    howDidYouFindOut: [] as string[],
    referralSource: [] as string[],
    eventsDescription: "",
    othersSpecify: "",
  })

  const handleProgramChange = (programId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      programs: checked 
        ? [...prev.programs, programId]
        : prev.programs.filter(id => id !== programId)
    }))
  }

  const handleHowDidYouFindOutChange = (optionId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      howDidYouFindOut: checked 
        ? [...prev.howDidYouFindOut, optionId]
        : prev.howDidYouFindOut.filter(id => id !== optionId)
    }))
  }

  const handleReferralChange = (optionId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      referralSource: checked 
        ? [...prev.referralSource, optionId]
        : prev.referralSource.filter(id => id !== optionId)
    }))
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Image 
                src="/marketeam-logo.png" 
                alt="Marketeam Logo" 
                width={48} 
                height={48} 
                className="h-12 w-12"
              />
              <span className="text-2xl font-serif font-bold" style={{color: '#193366'}}>Marketeam</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <Link href="#programs" className="text-foreground hover:transition-colors" style={{'--hover-color': '#193366'} as React.CSSProperties}>
                Programs
              </Link>
              <Link href="#about" className="text-foreground hover:transition-colors" style={{'--hover-color': '#193366'} as React.CSSProperties}>
                About
              </Link>
              <Link href="#footer" className="text-foreground hover:transition-colors" style={{'--hover-color': '#193366'} as React.CSSProperties}>
                Contact
              </Link>
              <Link href="#ready-to-get-started">
                <Button variant="default" size="sm" style={{backgroundColor: '#193366'}}>
                  Get Started
                </Button>
              </Link>
              <Link href="/admin/login">
                <Button variant="outline" size="sm">
                  Admin Login
                </Button>
              </Link>
            </nav>

            {/* Mobile Navigation */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="outline" size="sm">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <nav className="flex flex-col gap-4 mt-8">
                  <Link
                    href="#programs"
                    className="text-foreground hover:transition-colors py-2"
                    style={{'--hover-color': '#193366'} as React.CSSProperties}
                    onClick={() => setIsOpen(false)}
                  >
                    Programs
                  </Link>
                  <Link
                    href="#about"
                    className="text-foreground hover:transition-colors py-2"
                    style={{'--hover-color': '#193366'} as React.CSSProperties}
                    onClick={() => setIsOpen(false)}
                  >
                    About
                  </Link>
                  <Link
                    href="#footer"
                    className="text-foreground hover:transition-colors py-2"
                    style={{'--hover-color': '#193366'} as React.CSSProperties}
                    onClick={() => setIsOpen(false)}
                  >
                    Contact
                  </Link>
                  <div className="flex flex-col gap-3 mt-4">
                    <Link href="#ready-to-get-started" onClick={() => setIsOpen(false)}>
                      <Button className="w-full" style={{backgroundColor: '#193366'}}>
                        Get Started
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href="/admin/login" onClick={() => setIsOpen(false)}>
                      <Button variant="outline" className="w-full bg-transparent">
                        Admin Login
                      </Button>
                    </Link>
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-card to-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-serif font-bold text-foreground mb-6">
              Be future-ready. Be <span style={{color: '#193366'}}>STI</span>.
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join our data-driven educational ecosystem designed to unlock your potential and accelerate your career
              growth through innovative learning experiences.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" style={{backgroundColor: '#193366'}} asChild>
                <Link href="#ready-to-get-started">
                  Start Your Journey
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button variant="outline" size="lg">
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* College Programs Header */}
      <section id="programs" className="py-8 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h1 className="text-5xl font-serif font-bold text-foreground mb-4">Our Programs</h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Choose from our comprehensive range of programs designed to meet your educational and career goals.
            </p>
          </div>
        </div>
      </section>

      {/* Program Highlights */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-left mb-12">
            <h2 className="text-4xl font-serif font-bold text-foreground mb-4">College Programs</h2>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Discover our comprehensive range of bachelor's degree programs designed to prepare you for successful careers in today's dynamic industries.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{backgroundColor: 'rgba(25, 51, 102, 0.1)'}}>
                  <Laptop className="h-6 w-6" style={{color: '#193366'}} />
                </div>
                <CardTitle className="text-lg">BS Information Technology</CardTitle>
                <CardDescription className="text-sm">BSIT - Comprehensive IT education</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Software Development</li>
                  <li>• Database Management</li>
                  <li>• Network Administration</li>
                  <li>• IT Project Management</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
                  <Code className="h-6 w-6 text-secondary" />
                </div>
                <CardTitle className="text-lg">BS Computer Science</CardTitle>
                <CardDescription className="text-sm">BSCS - Advanced computing studies</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Programming & Algorithms</li>
                  <li>• Data Structures</li>
                  <li>• AI & Machine Learning</li>
                  <li>• Software Engineering</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                  <Hotel className="h-6 w-6 text-accent" />
                </div>
                <CardTitle className="text-lg">BS Hospitality Management</CardTitle>
                <CardDescription className="text-sm">BSHM - Hotel & tourism industry</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Hotel Operations</li>
                  <li>• Event Management</li>
                  <li>• Customer Service</li>
                  <li>• Tourism Planning</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{backgroundColor: 'rgba(25, 51, 102, 0.2)'}}>
                  <Plane className="h-6 w-6" style={{color: '#193366'}} />
                </div>
                <CardTitle className="text-lg">BS Tourism Management</CardTitle>
                <CardDescription className="text-sm">BSTM - Travel & tourism expertise</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Travel Planning</li>
                  <li>• Tourism Marketing</li>
                  <li>• Cultural Heritage</li>
                  <li>• Sustainable Tourism</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-secondary/20 rounded-lg flex items-center justify-center mb-4">
                  <Building2 className="h-6 w-6 text-secondary" />
                </div>
                <CardTitle className="text-lg">BS Business Administration</CardTitle>
                <CardDescription className="text-sm">BSBA - Business leadership skills</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Management Principles</li>
                  <li>• Marketing Strategy</li>
                  <li>• Financial Analysis</li>
                  <li>• Entrepreneurship</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Senior High School Programs */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-left mb-12">
            <h2 className="text-4xl font-serif font-bold text-foreground mb-4">Senior High School</h2>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Prepare for your future with our comprehensive senior high school programs designed to build strong foundations for college and career success.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{backgroundColor: 'rgba(25, 51, 102, 0.1)'}}>
                  <Smartphone className="h-6 w-6" style={{color: '#193366'}} />
                </div>
                <CardTitle className="text-lg">IT in Mobile App and Web Development</CardTitle>
                <CardDescription className="text-sm">STEM Track - Technology and innovation focus</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Mobile App Development</li>
                  <li>• Web Programming</li>
                  <li>• Database Design</li>
                  <li>• Digital Marketing</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
                  <GraduationCap className="h-6 w-6 text-secondary" />
                </div>
                <CardTitle className="text-lg">Humanities and Social Sciences</CardTitle>
                <CardDescription className="text-sm">HUMMS - Liberal arts and social studies</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Psychology & Sociology</li>
                  <li>• Literature & Languages</li>
                  <li>• History & Philosophy</li>
                  <li>• Communication Arts</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                  <Calculator className="h-6 w-6 text-accent" />
                </div>
                <CardTitle className="text-lg">Accountancy, Business, and Management</CardTitle>
                <CardDescription className="text-sm">ABM - Business and entrepreneurship track</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Accounting Principles</li>
                  <li>• Business Management</li>
                  <li>• Economics & Finance</li>
                  <li>• Entrepreneurship</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Inquiry Form Section */}
      <section id="ready-to-get-started" className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-serif font-bold text-card-foreground mb-4">Start Your Educational Journey</h2>
              <p className="text-muted-foreground">
                Complete this comprehensive inquiry form to help us understand your goals and recommend the best programs for you.
              </p>
            </div>

            <Card>
              <CardHeader>
                {/* Progress Indicator */}
                <div className="mb-6 max-w-md mx-auto">
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                    <span>Form Progress {Math.round((Object.values(formData).filter(value => 
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
                
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{backgroundColor: 'rgba(25, 51, 102, 0.1)'}}>
                  <Image 
                    src="/marketeam-logo.png" 
                    alt="Marketeam Logo" 
                    width={48} 
                    height={48} 
                    className="h-12 w-12"
                  />
                </div>
                <CardTitle className="text-center">Program Inquiry</CardTitle>
                <CardDescription className="text-center">
                  Tell us about your educational goals and interests
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Type of Inquiry and Type of Student */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold text-foreground uppercase">TYPE OF INQUIRY</Label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="online"
                          name="inquiryType"
                          value="online"
                          checked={formData.inquiryType === "online"}
                          onChange={(e) => setFormData(prev => ({ ...prev, inquiryType: e.target.value }))}
                          className="border-2 border-gray-300 focus:border-[#193366] focus:ring-2 focus:ring-[#193366]/20"
                        />
                        <Label htmlFor="online" className="text-sm">Online</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="walk-in"
                          name="inquiryType"
                          value="walk-in"
                          checked={formData.inquiryType === "walk-in"}
                          onChange={(e) => setFormData(prev => ({ ...prev, inquiryType: e.target.value }))}
                          className="border-2 border-gray-300 focus:border-[#193366] focus:ring-2 focus:ring-[#193366]/20"
                        />
                        <Label htmlFor="walk-in" className="text-sm">Walk-in</Label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold text-foreground uppercase">TYPE OF STUDENT</Label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="senior-high"
                          name="studentType"
                          value="senior-high"
                          checked={formData.studentType === "senior-high"}
                          onChange={(e) => setFormData(prev => ({ ...prev, studentType: e.target.value }))}
                          className="border-2 border-gray-300 focus:border-[#193366] focus:ring-2 focus:ring-[#193366]/20"
                        />
                        <Label htmlFor="senior-high" className="text-sm">Senior High School</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="tertiary"
                          name="studentType"
                          value="tertiary"
                          checked={formData.studentType === "tertiary"}
                          onChange={(e) => setFormData(prev => ({ ...prev, studentType: e.target.value }))}
                          className="border-2 border-gray-300 focus:border-[#193366] focus:ring-2 focus:ring-[#193366]/20"
                        />
                        <Label htmlFor="tertiary" className="text-sm">Tertiary</Label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Personal Information Section */}
                <div className="space-y-4">
                  <Label className="text-sm font-semibold text-foreground uppercase">PERSONAL INFORMATION</Label>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                    <Input 
                      id="firstName" 
                      placeholder="Enter your first name" 
                      className="border-2 border-gray-300 focus:border-[#193366] focus:ring-2 focus:ring-[#193366]/20"
                      value={formData.firstName}
                      onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input 
                      id="lastName" 
                      placeholder="Enter your last name" 
                      className="border-2 border-gray-300 focus:border-[#193366] focus:ring-2 focus:ring-[#193366]/20"
                      value={formData.lastName}
                      onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="presentSchool">Present School</Label>
                  <Input 
                    id="presentSchool" 
                    placeholder="Enter your current school" 
                    className="border-2 border-gray-300 focus:border-[#193366] focus:ring-2 focus:ring-[#193366]/20"
                    value={formData.presentSchool}
                    onChange={(e) => setFormData(prev => ({ ...prev, presentSchool: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="Enter your email address" 
                    className="border-2 border-gray-300 focus:border-[#193366] focus:ring-2 focus:ring-[#193366]/20"
                    value={formData.email}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Allow typing but require @ symbol for valid email
                      setFormData(prev => ({ ...prev, email: value }));
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input 
                    id="phone" 
                    type="tel" 
                    placeholder="Enter your phone number" 
                    className="border-2 border-gray-300 focus:border-[#193366] focus:ring-2 focus:ring-[#193366]/20"
                    value={formData.phone}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Only allow numbers
                      if (/^\d*$/.test(value)) {
                        setFormData(prev => ({ ...prev, phone: value }));
                      }
                    }}
                  />
                </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-sm font-semibold text-foreground uppercase">PROGRAMS OF INTEREST</Label>
                  
                  {/* Show programs based on student type selection */}
                  {formData.studentType === "tertiary" && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-foreground">College Programs</h4>
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="bsit" 
                            className="border-2 border-gray-300 focus:border-[#193366] focus:ring-2 focus:ring-[#193366]/20"
                            checked={formData.programs.includes('bsit')}
                            onCheckedChange={(checked) => handleProgramChange('bsit', checked as boolean)}
                          />
                          <Label htmlFor="bsit" className="text-sm">
                            BS Information Technology (BSIT)
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="bscs" 
                            className="border-2 border-gray-300 focus:border-[#193366] focus:ring-2 focus:ring-[#193366]/20"
                            checked={formData.programs.includes('bscs')}
                            onCheckedChange={(checked) => handleProgramChange('bscs', checked as boolean)}
                          />
                          <Label htmlFor="bscs" className="text-sm">
                            BS Computer Science (BSCS)
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="bshm" 
                            className="border-2 border-gray-300 focus:border-[#193366] focus:ring-2 focus:ring-[#193366]/20"
                            checked={formData.programs.includes('bshm')}
                            onCheckedChange={(checked) => handleProgramChange('bshm', checked as boolean)}
                          />
                          <Label htmlFor="bshm" className="text-sm">
                            BS Hospitality Management (BSHM)
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="bstm" 
                            className="border-2 border-gray-300 focus:border-[#193366] focus:ring-2 focus:ring-[#193366]/20"
                            checked={formData.programs.includes('bstm')}
                            onCheckedChange={(checked) => handleProgramChange('bstm', checked as boolean)}
                          />
                          <Label htmlFor="bstm" className="text-sm">
                            BS Tourism Management (BSTM)
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="bsba" 
                            className="border-2 border-gray-300 focus:border-[#193366] focus:ring-2 focus:ring-[#193366]/20"
                            checked={formData.programs.includes('bsba')}
                            onCheckedChange={(checked) => handleProgramChange('bsba', checked as boolean)}
                          />
                          <Label htmlFor="bsba" className="text-sm">
                            BS Business Administration (BSBA)
                          </Label>
                        </div>
                      </div>
                    </div>
                  )}

                  {formData.studentType === "senior-high" && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-foreground">Senior High School Programs</h4>
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="it-mobile" 
                            className="border-2 border-gray-300 focus:border-[#193366] focus:ring-2 focus:ring-[#193366]/20"
                            checked={formData.programs.includes('it-mobile')}
                            onCheckedChange={(checked) => handleProgramChange('it-mobile', checked as boolean)}
                          />
                          <Label htmlFor="it-mobile" className="text-sm">
                            IT in Mobile App and Web Development
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="humms" 
                            className="border-2 border-gray-300 focus:border-[#193366] focus:ring-2 focus:ring-[#193366]/20"
                            checked={formData.programs.includes('humms')}
                            onCheckedChange={(checked) => handleProgramChange('humms', checked as boolean)}
                          />
                          <Label htmlFor="humms" className="text-sm">
                            Humanities and Social Sciences (HUMMS)
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="abm" 
                            className="border-2 border-gray-300 focus:border-[#193366] focus:ring-2 focus:ring-[#193366]/20"
                            checked={formData.programs.includes('abm')}
                            onCheckedChange={(checked) => handleProgramChange('abm', checked as boolean)}
                          />
                          <Label htmlFor="abm" className="text-sm">
                            Accountancy, Business, and Management (ABM)
                          </Label>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Show message when no student type is selected */}
                  {!formData.studentType && (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>Please select your student type above to see available programs.</p>
                    </div>
                  )}
                </div>

                {/* How Did You Find Out About STI Section */}
                <div className="space-y-4">
                  <Label className="text-sm font-semibold text-foreground uppercase">HOW DID YOU FIND OUT ABOUT STI?</Label>
                  
                  <div className="space-y-4">
                    {/* Main Options */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="tv" 
                          className="border-2 border-gray-300 focus:border-[#193366] focus:ring-2 focus:ring-[#193366]/20"
                          checked={formData.howDidYouFindOut.includes('tv')}
                          onCheckedChange={(checked) => handleHowDidYouFindOutChange('tv', checked as boolean)}
                        />
                        <Label htmlFor="tv" className="text-sm">TV</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="outdoor" 
                          className="border-2 border-gray-300 focus:border-[#193366] focus:ring-2 focus:ring-[#193366]/20"
                          checked={formData.howDidYouFindOut.includes('outdoor')}
                          onCheckedChange={(checked) => handleHowDidYouFindOutChange('outdoor', checked as boolean)}
                        />
                        <Label htmlFor="outdoor" className="text-sm">OUTDOOR (Billboard, Banners, Streamers)</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="radio" 
                          className="border-2 border-gray-300 focus:border-[#193366] focus:ring-2 focus:ring-[#193366]/20"
                          checked={formData.howDidYouFindOut.includes('radio')}
                          onCheckedChange={(checked) => handleHowDidYouFindOutChange('radio', checked as boolean)}
                        />
                        <Label htmlFor="radio" className="text-sm">RADIO</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="print" 
                          className="border-2 border-gray-300 focus:border-[#193366] focus:ring-2 focus:ring-[#193366]/20"
                          checked={formData.howDidYouFindOut.includes('print')}
                          onCheckedChange={(checked) => handleHowDidYouFindOutChange('print', checked as boolean)}
                        />
                        <Label htmlFor="print" className="text-sm">PRINT (Newspaper)</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="magazine" 
                          className="border-2 border-gray-300 focus:border-[#193366] focus:ring-2 focus:ring-[#193366]/20"
                          checked={formData.howDidYouFindOut.includes('magazine')}
                          onCheckedChange={(checked) => handleHowDidYouFindOutChange('magazine', checked as boolean)}
                        />
                        <Label htmlFor="magazine" className="text-sm">MAGAZINE/FLYERS</Label>
                      </div>
                    </div>

                    {/* ONLINE Section */}
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="online-find" 
                          className="border-2 border-gray-300 focus:border-[#193366] focus:ring-2 focus:ring-[#193366]/20"
                          checked={formData.howDidYouFindOut.includes('online')}
                          onCheckedChange={(checked) => handleHowDidYouFindOutChange('online', checked as boolean)}
                        />
                        <Label htmlFor="online-find" className="text-sm font-semibold">ONLINE</Label>
                      </div>
                      
                      {formData.howDidYouFindOut.includes('online') && (
                        <div className="ml-6 space-y-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="website" 
                              className="border-2 border-gray-300 focus:border-[#193366] focus:ring-2 focus:ring-[#193366]/20"
                              checked={formData.howDidYouFindOut.includes('website')}
                              onCheckedChange={(checked) => handleHowDidYouFindOutChange('website', checked as boolean)}
                            />
                            <Label htmlFor="website" className="text-sm">Website</Label>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="facebook" 
                              className="border-2 border-gray-300 focus:border-[#193366] focus:ring-2 focus:ring-[#193366]/20"
                              checked={formData.howDidYouFindOut.includes('facebook')}
                              onCheckedChange={(checked) => handleHowDidYouFindOutChange('facebook', checked as boolean)}
                            />
                            <Label htmlFor="facebook" className="text-sm">Facebook</Label>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="others-online" 
                              className="border-2 border-gray-300 focus:border-[#193366] focus:ring-2 focus:ring-[#193366]/20"
                              checked={formData.howDidYouFindOut.includes('others-online')}
                              onCheckedChange={(checked) => handleHowDidYouFindOutChange('others-online', checked as boolean)}
                            />
                            <Label htmlFor="others-online" className="text-sm">Others</Label>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* EVENTS Section */}
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="events" 
                          className="border-2 border-gray-300 focus:border-[#193366] focus:ring-2 focus:ring-[#193366]/20"
                          checked={formData.howDidYouFindOut.includes('events')}
                          onCheckedChange={(checked) => handleHowDidYouFindOutChange('events', checked as boolean)}
                        />
                        <Label htmlFor="events" className="text-sm">EVENTS</Label>
                      </div>
                      
                      {formData.howDidYouFindOut.includes('events') && (
                        <div className="ml-6">
                          <Input 
                            placeholder="Please describe the event" 
                            className="border-2 border-gray-300 focus:border-[#193366] focus:ring-2 focus:ring-[#193366]/20"
                            value={formData.eventsDescription}
                            onChange={(e) => setFormData(prev => ({ ...prev, eventsDescription: e.target.value }))}
                          />
                        </div>
                      )}
                    </div>

                    {/* REFERRAL Section */}
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="referral" 
                          className="border-2 border-gray-300 focus:border-[#193366] focus:ring-2 focus:ring-[#193366]/20"
                          checked={formData.howDidYouFindOut.includes('referral')}
                          onCheckedChange={(checked) => handleHowDidYouFindOutChange('referral', checked as boolean)}
                        />
                        <Label htmlFor="referral" className="text-sm font-semibold">REFERRAL</Label>
                      </div>
                      
                      {formData.howDidYouFindOut.includes('referral') && (
                        <div className="ml-6 space-y-2">
                          <div className="grid md:grid-cols-2 gap-2">
                            <div className="flex items-center space-x-2">
                              <Checkbox 
                                id="sti-students" 
                                className="border-2 border-gray-300 focus:border-[#193366] focus:ring-2 focus:ring-[#193366]/20"
                                checked={formData.referralSource.includes('sti-students')}
                                onCheckedChange={(checked) => handleReferralChange('sti-students', checked as boolean)}
                              />
                              <Label htmlFor="sti-students" className="text-sm">STI Students</Label>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <Checkbox 
                                id="sti-alumni" 
                                className="border-2 border-gray-300 focus:border-[#193366] focus:ring-2 focus:ring-[#193366]/20"
                                checked={formData.referralSource.includes('sti-alumni')}
                                onCheckedChange={(checked) => handleReferralChange('sti-alumni', checked as boolean)}
                              />
                              <Label htmlFor="sti-alumni" className="text-sm">STI Alumni</Label>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <Checkbox 
                                id="friends" 
                                className="border-2 border-gray-300 focus:border-[#193366] focus:ring-2 focus:ring-[#193366]/20"
                                checked={formData.referralSource.includes('friends')}
                                onCheckedChange={(checked) => handleReferralChange('friends', checked as boolean)}
                              />
                              <Label htmlFor="friends" className="text-sm">Friends</Label>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <Checkbox 
                                id="parents" 
                                className="border-2 border-gray-300 focus:border-[#193366] focus:ring-2 focus:ring-[#193366]/20"
                                checked={formData.referralSource.includes('parents')}
                                onCheckedChange={(checked) => handleReferralChange('parents', checked as boolean)}
                              />
                              <Label htmlFor="parents" className="text-sm">Parents</Label>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <Checkbox 
                                id="relatives" 
                                className="border-2 border-gray-300 focus:border-[#193366] focus:ring-2 focus:ring-[#193366]/20"
                                checked={formData.referralSource.includes('relatives')}
                                onCheckedChange={(checked) => handleReferralChange('relatives', checked as boolean)}
                              />
                              <Label htmlFor="relatives" className="text-sm">Relatives</Label>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <Checkbox 
                                id="others-referral" 
                                className="border-2 border-gray-300 focus:border-[#193366] focus:ring-2 focus:ring-[#193366]/20"
                                checked={formData.referralSource.includes('others-referral')}
                                onCheckedChange={(checked) => handleReferralChange('others-referral', checked as boolean)}
                              />
                              <Label htmlFor="others-referral" className="text-sm">Others: (Pls specify)</Label>
                            </div>
                          </div>
                          
                          {formData.referralSource.includes('others-referral') && (
                            <div className="mt-2">
                              <Input 
                                placeholder="Please specify" 
                                className="border-2 border-gray-300 focus:border-[#193366] focus:ring-2 focus:ring-[#193366]/20"
                                value={formData.othersSpecify}
                                onChange={(e) => setFormData(prev => ({ ...prev, othersSpecify: e.target.value }))}
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <Button className="w-full" size="lg" style={{backgroundColor: '#193366'}} asChild>
                  <Link href="/inquiry">
                    Submit Inquiry
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="footer" className="py-12" style={{backgroundColor: '#193366', color: 'white'}}>
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Image 
                  src="/marketeam-logo.png" 
                  alt="Marketeam Logo" 
                  width={36} 
                  height={36} 
                  className="h-9 w-9"
                />
                <span className="text-xl font-serif font-bold">Marketeam</span>
              </div>
              <p className="text-white/80 text-sm">
                Empowering students through innovative education and data-driven learning experiences.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Programs</h4>
              <ul className="space-y-2 text-sm text-white/80">
                <li>Technology</li>
                <li>Business</li>
                <li>Certifications</li>
                <li>Continuing Education</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-white/80">
                <li>Student Services</li>
                <li>Academic Advising</li>
                <li>Career Services</li>
                <li>Technical Support</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-sm text-white/80">
                <li>1-800-Marketeam-EDU</li>
                <li>info@stica.edu</li>
                <li>Montillano St, Muntinlupa</li>
                <li>1780 Metro Manila</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/20 mt-8 pt-8 text-center text-sm text-white/80">
            <p>&copy; 2024 Marketeam Educational Institution. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
