// Database types for Supabase
export type UserRole = 'admin' | 'superadmin'

export interface User {
  id: string
  email: string
  role: UserRole
  permissions: string[]
  first_name?: string
  last_name?: string
  name?: string
  created_at: string
  last_login?: string
}