import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Home, ArrowLeft, ShieldAlert } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function Unauthorized() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="container mx-auto px-4">
        <div className="max-w-md mx-auto text-center">
          {/* Header */}
          <div className="mb-8">
            <Link href="/" className="inline-flex items-center gap-2 mb-6">
              <Image 
                src="/marketeam-logo.png" 
                alt="Marketeam Logo" 
                width={48} 
                height={48} 
                className="h-12 w-12"
              />
              <span className="text-2xl font-serif font-bold text-primary">Marketeam</span>
            </Link>
          </div>

          <Card>
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldAlert className="h-8 w-8 text-red-600" />
              </div>
              <CardTitle className="text-2xl">Access Denied</CardTitle>
              <CardDescription>You don't have permission to access this resource.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Please contact your administrator if you believe this is an error.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button asChild className="flex-1">
                  <Link href="/">
                    <Home className="mr-2 h-4 w-4" />
                    Go Home
                  </Link>
                </Button>
                <Button variant="outline" asChild className="flex-1 bg-transparent">
                  <Link href="/login">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Login
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Links */}
          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground mb-4">Other options:</p>
            <div className="flex flex-wrap justify-center gap-2">
              <Link href="/#programs" className="text-sm text-primary hover:underline">
                Programs
              </Link>
              <span className="text-muted-foreground">•</span>
              <Link href="/inquiry" className="text-sm text-primary hover:underline">
                Apply Now
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}