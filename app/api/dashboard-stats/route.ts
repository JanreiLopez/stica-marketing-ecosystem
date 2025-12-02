import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export async function GET() {
  try {
    const now = new Date()
    const currentYear = now.getFullYear()
    const previousYear = currentYear - 1

    // Get current year counts
    const [inquiriesCount, enrollmentsCount] = await Promise.all([
      supabase.from('inquiries').select('*', { count: 'exact', head: true }),
      supabase.from('enrollments').select('*', { count: 'exact', head: true })
    ])

    // Get previous year counts for year-over-year comparison
    const [inquiriesLastYear, enrollmentsLastYear] = await Promise.all([
      supabase
        .from('inquiries')
        .select('*', { count: 'exact', head: true })
        .lt('created_at', `${currentYear}-01-01`),
      supabase
        .from('enrollments')
        .select('*', { count: 'exact', head: true })
        .lt('created_at', `${currentYear}-01-01`)
    ])

    // Calculate year-over-year growth percentages
    const calculateGrowth = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0
      return Math.round(((current - previous) / previous) * 100)
    }

    const inquiriesGrowth = calculateGrowth(inquiriesCount.count || 0, inquiriesLastYear.count || 0)
    const enrollmentsGrowth = calculateGrowth(enrollmentsCount.count || 0, enrollmentsLastYear.count || 0)

    // Get next upcoming marketing activity
    const { data: upcomingActivity } = await supabase
      .from('marketing_activities')
      .select('title, date')
      .gte('date', new Date().toISOString().split('T')[0]) // Today's date or later
      .order('date', { ascending: true })
      .limit(1)
      .single()

    // Get top preferred courses using SQL aggregation
    const { data: topCoursesRaw } = await supabase
      .from('inquiries')
      .select('program')
      .not('program', 'is', null)
      .neq('program', '')
      .neq('program', 'Not specified')

    // Process top courses client-side (temporary until DB functions are created)
    const courseCounts: { [key: string]: number } = {}
    topCoursesRaw?.forEach(inquiry => {
      const programs = (inquiry.program || "").split(", ").filter(p => p.trim() && p.trim() !== "Not specified")
      programs.forEach(program => {
        courseCounts[program] = (courseCounts[program] || 0) + 1
      })
    })
    const topCourses = Object.entries(courseCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, value]) => ({ name, value }))

    // Get top preferred strands
    const { data: topStrandsRaw } = await supabase
      .from('inquiries')
      .select('program, student_type')
      .not('program', 'is', null)
      .neq('program', '')
      .neq('program', 'Not specified')

    const strandCounts: { [key: string]: number } = {}
    topStrandsRaw?.forEach(inquiry => {
      if (inquiry.student_type && inquiry.student_type.toLowerCase().includes("senior")) {
        const programs = (inquiry.program || "").split(", ").filter(p => p.trim() && p.trim() !== "Not specified")
        programs.forEach(program => {
          if (program.toLowerCase().includes("humms") ||
              program.toLowerCase().includes("abm") ||
              program.toLowerCase().includes("stem") ||
              program.toLowerCase().includes("gas")) {
            strandCounts[program] = (strandCounts[program] || 0) + 1
          }
        })
      }
    })
    const topStrands = Object.entries(strandCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, value]) => ({ name, value }))

    // Get enrolled students per program
    const { data: enrolledRaw } = await supabase
      .from('enrollments')
      .select('program')
      .not('program', 'is', null)
      .neq('program', '')
      .neq('program', 'Not specified')

    const programCounts: { [key: string]: number } = {}
    enrolledRaw?.forEach(enrollment => {
      const programs = (enrollment.program || "").split(", ").filter(p => p.trim() && p.trim() !== "Not specified")
      programs.forEach(program => {
        programCounts[program] = (programCounts[program] || 0) + 1
      })
    })
    const enrolledPerProgram = Object.entries(programCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([name, value]) => ({ name, value }))

    // Get enrolled students per strand
    const { data: enrolledStrandRaw } = await supabase
      .from('enrollments')
      .select('program_track_strand, program')
      .not('program_track_strand', 'is', null)
      .neq('program_track_strand', '')

    const strandEnrolledCounts: { [key: string]: number } = {}
    enrolledStrandRaw?.forEach(enrollment => {
      const strand = enrollment.program_track_strand || enrollment.program
      if (strand && strand !== "Not specified") {
        strandEnrolledCounts[strand] = (strandEnrolledCounts[strand] || 0) + 1
      }
    })
    const enrolledPerStrand = Object.entries(strandEnrolledCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([name, value]) => ({ name, value }))

    return NextResponse.json({
      inquiriesCount: inquiriesCount.count || 0,
      enrollmentsCount: enrollmentsCount.count || 0,
      inquiriesGrowth,
      enrollmentsGrowth,
      upcomingActivity: upcomingActivity || null,
      topCourses: topCourses || [],
      topStrands: topStrands || [],
      enrolledPerProgram: enrolledPerProgram || [],
      enrolledPerStrand: enrolledPerStrand || []
    }, {
      headers: {
        'Cache-Control': 'private, max-age=300', // Cache for 5 minutes
      },
    })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 })
  }
}
