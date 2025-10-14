import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { GraduationCap, Home, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="container mx-auto px-4">
        <div className="max-w-md mx-auto text-center">
          {/* Header */}
          <div className="mb-8">
            <Link href="/" className="inline-flex items-center gap-2 mb-6">
              <GraduationCap className="h-8 w-8 text-primary" />
              <span className="text-2xl font-serif font-bold text-primary">STICA</span>
            </Link>
          </div>

          <Card>
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-muted-foreground">404</span>
              </div>
              <CardTitle className="text-2xl">Page Not Found</CardTitle>
              <CardDescription>The page you're looking for doesn't exist or has been moved.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Don't worry, you can find your way back to our educational programs and resources.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button asChild className="flex-1">
                  <Link href="/">
                    <Home className="mr-2 h-4 w-4" />
                    Go Home
                  </Link>
                </Button>
                <Button variant="outline" asChild className="flex-1 bg-transparent">
                  <Link href="/inquiry">Start Inquiry</Link>
                </Button>
              </div>
              <Button variant="ghost" asChild className="w-full">
                <Link href="javascript:history.back()">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Go Back
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Quick Links */}
          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground mb-4">Popular pages:</p>
            <div className="flex flex-wrap justify-center gap-2">
              <Link href="/#programs" className="text-sm text-primary hover:underline">
                Programs
              </Link>
              <span className="text-muted-foreground">•</span>
              <Link href="/inquiry" className="text-sm text-primary hover:underline">
                Apply Now
              </Link>
              <span className="text-muted-foreground">•</span>
              <Link href="/admin/login" className="text-sm text-primary hover:underline">
                Admin Portal
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
