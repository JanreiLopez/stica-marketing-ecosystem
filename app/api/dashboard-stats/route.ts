import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export async function GET(request: Request) {
  // Parse query parameters for date range
  const { searchParams } = new URL(request.url)
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')
  
  console.log('Dashboard stats request with date range:', { startDate, endDate })
  try {
    const now = new Date()
    const currentYear = now.getFullYear()
    const previousYear = currentYear - 1

    // Get current year counts with date filtering
    const inquiriesQuery = supabase.from('inquiries').select('*', { count: 'exact', head: true })
    const enrollmentsQuery = supabase.from('enrollments').select('*', { count: 'exact', head: true })
    
    // Apply date filters if provided
    if (startDate) {
      inquiriesQuery.gte('created_at', startDate)
      enrollmentsQuery.gte('created_at', startDate)
    }
    
    if (endDate) {
      inquiriesQuery.lte('created_at', endDate)
      enrollmentsQuery.lte('created_at', endDate)
    }
    
    const [inquiriesCount, enrollmentsCount] = await Promise.all([
      inquiriesQuery,
      enrollmentsQuery
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

    // Get top preferred courses (college programs only)
    let topCoursesQuery = supabase
      .from('inquiries')
      .select('program, student_type')
      .not('program', 'is', null)
      .neq('program', '')
      .neq('program', 'Not specified')
      .eq('student_type', 'college')
      
    // Apply date filters
    if (startDate) {
      topCoursesQuery = topCoursesQuery.gte('created_at', startDate)
    }
    
    if (endDate) {
      topCoursesQuery = topCoursesQuery.lte('created_at', endDate)
    }
    
    const { data: topCoursesRaw } = await topCoursesQuery

    // Process top courses client-side (temporary until DB functions are created)
    console.log('Processing top courses raw data:', topCoursesRaw)
    const courseCounts: { [key: string]: number } = {}
    topCoursesRaw?.forEach((inquiry: any) => {
      const programs = (inquiry.program || "").split(", ").filter((p: string) => p.trim() && p.trim() !== "Not specified")
      console.log('Processing inquiry programs:', { inquiry, programs })
      programs.forEach((program: string) => {
        // Only count college programs (exclude senior high strands)
        // College programs have specific prefixes that distinguish them from senior high strands
        const isSeniorHighProgram = 
          program.toLowerCase().includes('humms') || 
          program.toLowerCase().includes('abm') || 
          program.toLowerCase().includes('mobile app') ||
          program.toLowerCase().includes('it-mobile') ||
          program.toLowerCase().includes('humanities and social sciences') ||
          program.toLowerCase().includes('accountancy, business, and management');
          
        console.log('Program classification:', { program, isSeniorHighProgram })
        if (!isSeniorHighProgram) {
          courseCounts[program] = (courseCounts[program] || 0) + 1
        }
      })
    })
    console.log('Final course counts:', courseCounts)
    const topCourses = Object.entries(courseCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, value]) => ({ name, value }))

    // Get top preferred strands (senior high school strands only)
    let topStrandsQuery = supabase
      .from('inquiries')
      .select('program, student_type')
      .not('program', 'is', null)
      .neq('program', '')
      .neq('program', 'Not specified')
      .eq('student_type', 'senior-high')
      
    // Apply date filters
    if (startDate) {
      topStrandsQuery = topStrandsQuery.gte('created_at', startDate)
    }
    
    if (endDate) {
      topStrandsQuery = topStrandsQuery.lte('created_at', endDate)
    }
    
    const { data: topStrandsRaw } = await topStrandsQuery

    console.log('Processing top strands raw data:', topStrandsRaw)
    const strandCounts: { [key: string]: number } = {}
    topStrandsRaw?.forEach((inquiry: any) => {
      const programs = (inquiry.program || "").split(", ").filter((p: string) => p.trim() && p.trim() !== "Not specified")
      console.log('Processing inquiry strands:', { inquiry, programs })
      programs.forEach((program: string) => {
        // Only count senior high school strands
        const isSeniorHighStrand = 
          program.toLowerCase().includes("humms") ||
          program.toLowerCase().includes("abm") ||
          program.toLowerCase().includes("mobile app") ||
          program.toLowerCase().includes("it-mobile") ||
          program.toLowerCase().includes("humanities and social sciences") ||
          program.toLowerCase().includes("accountancy, business, and management");
          
        console.log('Strand classification:', { program, isSeniorHighStrand })
        if (isSeniorHighStrand) {
          strandCounts[program] = (strandCounts[program] || 0) + 1
        }
      })
    })
    console.log('Final strand counts:', strandCounts)
    const topStrands = Object.entries(strandCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, value]) => ({ name, value }))

    // Get enrolled students per program
    let enrolledQuery = supabase
      .from('enrollments')
      .select('program')
      .not('program', 'is', null)
      .neq('program', '')
      .neq('program', 'Not specified')
      
    // Apply date filters
    if (startDate) {
      enrolledQuery = enrolledQuery.gte('created_at', startDate)
    }
    
    if (endDate) {
      enrolledQuery = enrolledQuery.lte('created_at', endDate)
    }
    
    const { data: enrolledRaw } = await enrolledQuery

    const programCounts: { [key: string]: number } = {}
    enrolledRaw?.forEach((enrollment: any) => {
      const programs = (enrollment.program || "").split(", ").filter((p: string) => p.trim() && p.trim() !== "Not specified")
      programs.forEach((program: string) => {
        // Only count college programs (exclude senior high strands)
        const isSeniorHighProgram = 
          program.toLowerCase().includes('humms') || 
          program.toLowerCase().includes('abm') || 
          program.toLowerCase().includes('mobile app') ||
          program.toLowerCase().includes('it-mobile') ||
          program.toLowerCase().includes('humanities and social sciences') ||
          program.toLowerCase().includes('accountancy, business, and management');
          
        if (!isSeniorHighProgram) {
          programCounts[program] = (programCounts[program] || 0) + 1
        }
      })
    })
    const enrolledPerProgram = Object.entries(programCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([name, value]) => ({ name, value }))

    // Get enrolled students per strand
    let enrolledStrandQuery = supabase
      .from('enrollments')
      .select('program_track_strand, program')
      .not('program_track_strand', 'is', null)
      .neq('program_track_strand', '')
      
    // Apply date filters
    if (startDate) {
      enrolledStrandQuery = enrolledStrandQuery.gte('created_at', startDate)
    }
    
    if (endDate) {
      enrolledStrandQuery = enrolledStrandQuery.lte('created_at', endDate)
    }
    
    const { data: enrolledStrandRaw } = await enrolledStrandQuery

    const strandEnrolledCounts: { [key: string]: number } = {}
    enrolledStrandRaw?.forEach((enrollment: any) => {
      const strand = enrollment.program_track_strand || enrollment.program
      if (strand && strand !== "Not specified") {
        // Only count senior high school strands
        const isSeniorHighStrand = 
          strand.toLowerCase().includes("humms") ||
          strand.toLowerCase().includes("abm") ||
          strand.toLowerCase().includes("mobile app") ||
          strand.toLowerCase().includes("it-mobile") ||
          strand.toLowerCase().includes("humanities and social sciences") ||
          strand.toLowerCase().includes("accountancy, business, and management");
          
        if (isSeniorHighStrand) {
          strandEnrolledCounts[strand] = (strandEnrolledCounts[strand] || 0) + 1
        }
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
