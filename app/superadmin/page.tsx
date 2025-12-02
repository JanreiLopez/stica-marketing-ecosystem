import { redirect } from "next/navigation"

// Simple redirect to dashboard
export default function SuperAdminPage() {
  redirect("/superadmin/dashboard")
}