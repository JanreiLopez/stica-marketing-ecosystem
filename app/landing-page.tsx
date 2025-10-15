"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Users, BookOpen, Award, ArrowRight, Menu } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function LandingPage() {
  const [isOpen, setIsOpen] = useState(false)

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
              <span className="text-2xl font-serif font-bold text-primary">Marketeam</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <Link href="#programs" className="text-foreground hover:text-primary transition-colors">
                Programs
              </Link>
              <Link href="#about" className="text-foreground hover:text-primary transition-colors">
                About
              </Link>
              <Link href="#contact" className="text-foreground hover:text-primary transition-colors">
                Contact
              </Link>
              <Link href="/inquiry">
                <Button variant="default" size="sm">
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
                    className="text-foreground hover:text-primary transition-colors py-2"
                    onClick={() => setIsOpen(false)}
                  >
                    Programs
                  </Link>
                  <Link
                    href="#about"
                    className="text-foreground hover:text-primary transition-colors py-2"
                    onClick={() => setIsOpen(false)}
                  >
                    About
                  </Link>
                  <Link
                    href="#contact"
                    className="text-foreground hover:text-primary transition-colors py-2"
                    onClick={() => setIsOpen(false)}
                  >
                    Contact
                  </Link>
                  <div className="flex flex-col gap-3 mt-4">
                    <Link href="/inquiry" onClick={() => setIsOpen(false)}>
                      <Button className="w-full">
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
              Transform Your Future with <span className="text-primary">Marketeam</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join our data-driven educational ecosystem designed to unlock your potential and accelerate your career
              growth through innovative learning experiences.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-primary hover:bg-primary/90" asChild>
                <Link href="/inquiry">
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

      {/* Program Highlights */}
      <section id="programs" className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-serif font-bold text-foreground mb-4">Our Programs</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose from our comprehensive range of programs designed to meet your educational and career goals.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">Technology Programs</CardTitle>
                <CardDescription>Cutting-edge technology courses designed for the digital age</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Software Development</li>
                  <li>• Data Science & Analytics</li>
                  <li>• Cybersecurity</li>
                  <li>• AI & Machine Learning</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-secondary" />
                </div>
                <CardTitle className="text-xl">Business Programs</CardTitle>
                <CardDescription>Comprehensive business education for future leaders</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Business Administration</li>
                  <li>• Digital Marketing</li>
                  <li>• Project Management</li>
                  <li>• Entrepreneurship</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                  <Award className="h-6 w-6 text-accent" />
                </div>
                <CardTitle className="text-xl">Certification Programs</CardTitle>
                <CardDescription>Industry-recognized certifications to boost your career</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Professional Certificates</li>
                  <li>• Industry Partnerships</li>
                  <li>• Continuing Education</li>
                  <li>• Skills Assessment</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Inquiry Form Section */}
      <section className="py-16 bg-card">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-serif font-bold text-card-foreground mb-4">Ready to Get Started?</h2>
              <p className="text-muted-foreground">
                Fill out the form below and our admissions team will contact you within 24 hours.
              </p>
            </div>

            <Card>
              <CardHeader>
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
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
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" placeholder="Enter your first name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" placeholder="Enter your last name" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" placeholder="Enter your email address" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" type="tel" placeholder="Enter your phone number" />
                </div>

                <div className="space-y-3">
                  <Label>Programs of Interest</Label>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="tech" />
                      <Label htmlFor="tech" className="text-sm">
                        Technology Programs
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="business" />
                      <Label htmlFor="business" className="text-sm">
                        Business Programs
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="cert" />
                      <Label htmlFor="cert" className="text-sm">
                        Certification Programs
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="other" />
                      <Label htmlFor="other" className="text-sm">
                        Other Programs
                      </Label>
                    </div>
                  </div>
                </div>

                <Button className="w-full bg-primary hover:bg-primary/90" size="lg" asChild>
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
      <footer className="bg-primary text-primary-foreground py-12">
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
              <p className="text-primary-foreground/80 text-sm">
                Empowering students through innovative education and data-driven learning experiences.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Programs</h4>
              <ul className="space-y-2 text-sm text-primary-foreground/80">
                <li>Technology</li>
                <li>Business</li>
                <li>Certifications</li>
                <li>Continuing Education</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-primary-foreground/80">
                <li>Student Services</li>
                <li>Academic Advising</li>
                <li>Career Services</li>
                <li>Technical Support</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-sm text-primary-foreground/80">
                <li>1-800-Marketeam-EDU</li>
                <li>info@stica.edu</li>
                <li>123 Education Blvd</li>
                <li>Learning City, LC 12345</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-primary-foreground/20 mt-8 pt-8 text-center text-sm text-primary-foreground/80">
            <p>&copy; 2024 Marketeam Educational Institution. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
