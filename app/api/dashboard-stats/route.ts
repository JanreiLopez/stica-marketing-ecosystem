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
    const now = new Date() // Current date for calculations
    const currentYear = now.getFullYear()
    const previousYear = currentYear - 1

    // Get current year counts with date filtering
    let inquiriesQuery = supabase.from('inquiries').select('*', { count: 'exact', head: true })
    let enrollmentsQuery = supabase.from('enrollments').select('*', { count: 'exact', head: true })
    
    // Apply date filters if provided
    if (startDate) {
      inquiriesQuery = inquiriesQuery.gte('created_at', startDate)
      enrollmentsQuery = enrollmentsQuery.gte('created_at', startDate)
    }
    
    if (endDate) {
      inquiriesQuery = inquiriesQuery.lte('created_at', endDate)
      enrollmentsQuery = enrollmentsQuery.lte('created_at', endDate)
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

    // Calculate month-over-month growth
    // Use the 'now' variable declared at line 17
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

    const [currentMonthInquiries, lastMonthInquiries] = await Promise.all([
      supabase
        .from('inquiries')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', currentMonthStart.toISOString()),
      supabase
        .from('inquiries')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', lastMonthStart.toISOString())
        .lte('created_at', lastMonthEnd.toISOString())
    ])

    const [currentMonthEnrollments, lastMonthEnrollments] = await Promise.all([
      supabase
        .from('enrollments')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', currentMonthStart.toISOString()),
      supabase
        .from('enrollments')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', lastMonthStart.toISOString())
        .lte('created_at', lastMonthEnd.toISOString())
    ])

    const monthOverMonthInquiries = calculateGrowth(
      currentMonthInquiries.count || 0,
      lastMonthInquiries.count || 0
    )
    const monthOverMonthEnrollments = calculateGrowth(
      currentMonthEnrollments.count || 0,
      lastMonthEnrollments.count || 0
    )

    // Get next upcoming marketing activity
    const { data: upcomingActivity } = await supabase
      .from('marketing_activities')
      .select('title, date')
      .gte('date', new Date().toISOString().split('T')[0]) // Today's date or later
      .order('date', { ascending: true })
      .limit(1)
      .single()

    // Get top preferred courses (college programs only)
    // Query all inquiries and filter by student_type in code to handle case variations
    let topCoursesQuery = supabase
      .from('inquiries')
      .select('id, program, student_type, created_at, date')
      .order('created_at', { ascending: false }) // Order by most recent first
      
    // Apply date filters - use created_at for filtering (date field may not be reliable)
    // If no date filters provided, get all inquiries
    if (startDate) {
      // Ensure startDate includes time to capture all records from that day
      const startDateTime = `${startDate}T00:00:00.000Z`
      topCoursesQuery = topCoursesQuery.gte('created_at', startDateTime)
      console.log('Applied startDate filter:', startDateTime)
    }
    
    if (endDate) {
      // Ensure endDate includes end of day to capture all records from that day
      const endDateTime = `${endDate}T23:59:59.999Z`
      topCoursesQuery = topCoursesQuery.lte('created_at', endDateTime)
      console.log('Applied endDate filter:', endDateTime)
    }
    
    if (!startDate && !endDate) {
      console.log('No date filters applied - fetching ALL inquiries')
    }
    
    const { data: topCoursesRaw, error: topCoursesError } = await topCoursesQuery
    
    console.log('Top courses query result:', {
      count: topCoursesRaw?.length || 0,
      error: topCoursesError,
      sample: topCoursesRaw?.slice(0, 3) // Show first 3 for debugging
    })
    
    if (topCoursesError) {
      console.error('Error fetching top courses:', topCoursesError)
    }

    // Process top courses - filter for college students and count programs
    console.log('Processing top courses raw data:', topCoursesRaw?.length, 'inquiries found')
    console.log('Date range:', { startDate, endDate })
    
    const courseCounts: { [key: string]: number } = {}
    let processedCount = 0
    let skippedNonCollege = 0
    let skippedNoProgram = 0
    let skippedSeniorHighProgram = 0
    
    topCoursesRaw?.forEach((inquiry: any) => {
      // Log each inquiry for debugging
      console.log('Processing inquiry:', {
        id: inquiry.id,
        student_type: inquiry.student_type,
        program: inquiry.program,
        created_at: inquiry.created_at
      })
      
      // Filter for college students (case-insensitive check)
      const studentType = (inquiry.student_type || "").toLowerCase().trim()
      const isCollege = studentType === "college" || studentType.includes("college")
      
      if (!isCollege) {
        skippedNonCollege++
        console.log('Skipped non-college inquiry:', { student_type: inquiry.student_type, studentType })
        return // Skip non-college inquiries
      }
      
      // Get program field - handle null, empty, or "Not specified"
      const programField = (inquiry.program || "").trim()
      if (!programField || programField === "Not specified" || programField === "") {
        skippedNoProgram++
        console.log('Skipped inquiry with no program:', { program: inquiry.program })
        return // Skip inquiries without valid programs
      }
      
      // Try multiple delimiters: ", ", ",", ";", "|"
      const programs = programField
        .split(/, |,|;|\|/)
        .map((p: string) => p.trim())
        .filter((p: string) => {
          const trimmed = p.trim()
          return trimmed && trimmed !== "Not specified" && trimmed !== ""
        })
      
      programs.forEach((program: string) => {
        const trimmedProgram = program.trim()
        if (!trimmedProgram) return
        
        // Only count college programs (exclude senior high strands)
        // College programs have specific prefixes that distinguish them from senior high strands
        const isSeniorHighProgram = 
          trimmedProgram.toLowerCase().includes('humms') || 
          trimmedProgram.toLowerCase().includes('abm') || 
          trimmedProgram.toLowerCase().includes('mobile app') ||
          trimmedProgram.toLowerCase().includes('it-mobile') ||
          trimmedProgram.toLowerCase().includes('humanities and social sciences') ||
          trimmedProgram.toLowerCase().includes('accountancy, business, and management');
          
        if (!isSeniorHighProgram) {
          courseCounts[trimmedProgram] = (courseCounts[trimmedProgram] || 0) + 1
          processedCount++
        } else {
          skippedSeniorHighProgram++
        }
      })
    })
    
    console.log('Top courses processing summary:', {
      totalInquiries: topCoursesRaw?.length || 0,
      processedCount,
      skippedNonCollege,
      skippedNoProgram,
      skippedSeniorHighProgram,
      finalCourseCounts: Object.keys(courseCounts).length
    })
    console.log('Final course counts:', courseCounts)
    const topCourses = Object.entries(courseCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, value]) => ({ name, value }))

    // Get top preferred strands (senior high school strands only)
    // Query all inquiries and filter by student_type in code to handle case variations
    let topStrandsQuery = supabase
      .from('inquiries')
      .select('id, program, student_type, created_at, date')
      .order('created_at', { ascending: false }) // Order by most recent first
      
    // Apply date filters - use created_at for filtering (date field may not be reliable)
    // If no date filters provided, get all inquiries
    if (startDate) {
      // Ensure startDate includes time to capture all records from that day
      const startDateTime = `${startDate}T00:00:00.000Z`
      topStrandsQuery = topStrandsQuery.gte('created_at', startDateTime)
      console.log('Applied startDate filter to strands:', startDateTime)
    }
    
    if (endDate) {
      // Ensure endDate includes end of day to capture all records from that day
      const endDateTime = `${endDate}T23:59:59.999Z`
      topStrandsQuery = topStrandsQuery.lte('created_at', endDateTime)
      console.log('Applied endDate filter to strands:', endDateTime)
    }
    
    if (!startDate && !endDate) {
      console.log('No date filters applied to strands - fetching ALL inquiries')
    }
    
    const { data: topStrandsRaw, error: topStrandsError } = await topStrandsQuery
    
    if (topStrandsError) {
      console.error('Error fetching top strands:', topStrandsError)
    }

    console.log('Top strands query result:', {
      count: topStrandsRaw?.length || 0,
      error: topStrandsError,
      sample: topStrandsRaw?.slice(0, 3) // Show first 3 for debugging
    })
    console.log('Processing top strands raw data:', topStrandsRaw?.length, 'inquiries found')
    console.log('Date range for strands:', { startDate, endDate })
    
    const strandCounts: { [key: string]: number } = {}
    let processedStrandCount = 0
    let skippedNonSeniorHigh = 0
    let skippedNoStrandProgram = 0
    let skippedNonStrand = 0
    
    topStrandsRaw?.forEach((inquiry: any) => {
      // Log each inquiry for debugging
      console.log('Processing strand inquiry:', {
        id: inquiry.id,
        student_type: inquiry.student_type,
        program: inquiry.program,
        created_at: inquiry.created_at
      })
      
      // Filter for senior high students (case-insensitive check)
      const studentType = (inquiry.student_type || "").toLowerCase().trim()
      const isSeniorHigh = studentType.includes("senior") || studentType.includes("high") || studentType === "senior high"
      
      if (!isSeniorHigh) {
        skippedNonSeniorHigh++
        console.log('Skipped non-senior high inquiry:', { student_type: inquiry.student_type, studentType })
        return // Skip non-senior high inquiries
      }
      
      // Get program field - handle null, empty, or "Not specified"
      const programField = (inquiry.program || "").trim()
      if (!programField || programField === "Not specified" || programField === "") {
        skippedNoStrandProgram++
        console.log('Skipped inquiry with no program:', { program: inquiry.program })
        return // Skip inquiries without valid programs
      }
      
      // Try multiple delimiters: ", ", ",", ";", "|"
      const programs = programField
        .split(/, |,|;|\|/)
        .map((p: string) => p.trim())
        .filter((p: string) => {
          const trimmed = p.trim()
          return trimmed && trimmed !== "Not specified" && trimmed !== ""
        })
      
      programs.forEach((program: string) => {
        const trimmedProgram = program.trim()
        if (!trimmedProgram) return
        
        // Only count senior high school strands
        const isSeniorHighStrand = 
          trimmedProgram.toLowerCase().includes("humms") ||
          trimmedProgram.toLowerCase().includes("abm") ||
          trimmedProgram.toLowerCase().includes("mobile app") ||
          trimmedProgram.toLowerCase().includes("it-mobile") ||
          trimmedProgram.toLowerCase().includes("humanities and social sciences") ||
          trimmedProgram.toLowerCase().includes("accountancy, business, and management");
          
        if (isSeniorHighStrand) {
          strandCounts[trimmedProgram] = (strandCounts[trimmedProgram] || 0) + 1
          processedStrandCount++
        } else {
          skippedNonStrand++
        }
      })
    })
    
    console.log('Top strands processing summary:', {
      totalInquiries: topStrandsRaw?.length || 0,
      processedStrandCount,
      skippedNonSeniorHigh,
      skippedNoStrandProgram,
      skippedNonStrand,
      finalStrandCounts: Object.keys(strandCounts).length
    })
    console.log('Final strand counts:', strandCounts)
    const topStrands = Object.entries(strandCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, value]) => ({ name, value }))

    // Get enrolled students per program
    // Define designated college programs that should always be displayed
    const designatedPrograms = [
      "BS Information Technology (BSIT)",
      "BS Computer Science (BSCS)",
      "BS Hospitality Management (BSHM)",
      "BS Tourism Management (BSTM)",
      "BS Business Administration (BSBA)"
    ]
    
    // Initialize all designated programs with 0
    const programCounts: { [key: string]: number } = {}
    designatedPrograms.forEach(program => {
      programCounts[program] = 0
    })
    
    let enrolledQuery = supabase
      .from('enrollments')
      .select('program, student_type')
      .not('program', 'is', null)
      .neq('program', '')
      
    // Apply date filters
    if (startDate) {
      enrolledQuery = enrolledQuery.gte('created_at', startDate)
    }
    
    if (endDate) {
      enrolledQuery = enrolledQuery.lte('created_at', endDate)
    }
    
    const { data: enrolledRaw, error: enrolledError } = await enrolledQuery

    if (enrolledError) {
      console.error('Error fetching enrollments for programs:', enrolledError)
    }

    enrolledRaw?.forEach((enrollment: any) => {
      // Only count college students (exclude senior high students)
      // Handle case variations and null/undefined values
      const studentType = (enrollment.student_type || "").toLowerCase().trim()
      const isCollegeStudent = studentType === "college" || studentType.includes("college")
      
      if (isCollegeStudent && enrollment.program) {
        // Handle different separators: ", " or ","
        const programs = (enrollment.program || "")
          .split(/, |,/)
          .map((p: string) => p.trim())
          .filter((p: string) => p && p !== "Not specified" && p.length > 0)
        
        programs.forEach((program: string) => {
          if (program) {
            // Match program to designated program (case-insensitive, flexible matching)
            const programLower = program.toLowerCase().trim()
            let matchedProgram: string | null = null
            
            // Match programs
            if (programLower.includes("information technology") || programLower.includes("bsit")) {
              matchedProgram = "BS Information Technology (BSIT)"
            } else if (programLower.includes("computer science") || programLower.includes("bscs")) {
              matchedProgram = "BS Computer Science (BSCS)"
            } else if (programLower.includes("hospitality management") || programLower.includes("bshm")) {
              matchedProgram = "BS Hospitality Management (BSHM)"
            } else if (programLower.includes("tourism management") || programLower.includes("bstm")) {
              matchedProgram = "BS Tourism Management (BSTM)"
            } else if (programLower.includes("business administration") || programLower.includes("bsba")) {
              matchedProgram = "BS Business Administration (BSBA)"
            }
            
            // If matched to a designated program, increment count
            if (matchedProgram && programCounts.hasOwnProperty(matchedProgram)) {
              programCounts[matchedProgram] = (programCounts[matchedProgram] || 0) + 1
            } else if (!matchedProgram) {
              // If it doesn't match a designated program, still count it (for other programs)
              programCounts[program] = (programCounts[program] || 0) + 1
            }
          }
        })
      }
    })
    
    console.log('Enrolled per program calculation:', {
      totalEnrollments: enrolledRaw?.length || 0,
      programCounts,
      sampleEnrollments: enrolledRaw?.slice(0, 3).map((e: any) => ({ 
        student_type: e.student_type, 
        program: e.program 
      }))
    })
    
    // Return all designated programs plus any other programs found, sorted by value (descending)
    const enrolledPerProgram = Object.entries(programCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([name, value]) => ({ name, value }))

    // Get enrolled students per strand
    // Define designated strands that should always be displayed
    const designatedStrands = [
      "IT in Mobile App and Web Development",
      "Humanities and Social Sciences (HUMMS)",
      "Accountancy, Business, and Management (ABM)"
    ]
    
    // Initialize all designated strands with 0
    const strandEnrolledCounts: { [key: string]: number } = {}
    designatedStrands.forEach(strand => {
      strandEnrolledCounts[strand] = 0
    })
    
    let enrolledStrandQuery = supabase
      .from('enrollments')
      .select('program_track_strand, program, student_type')
      
    // Apply date filters
    if (startDate) {
      enrolledStrandQuery = enrolledStrandQuery.gte('created_at', startDate)
    }
    
    if (endDate) {
      enrolledStrandQuery = enrolledStrandQuery.lte('created_at', endDate)
    }
    
    const { data: enrolledStrandRaw, error: enrolledStrandError } = await enrolledStrandQuery

    if (enrolledStrandError) {
      console.error('Error fetching enrollments for strands:', enrolledStrandError)
    }

    // Map enrollment data to designated strands
    enrolledStrandRaw?.forEach((enrollment: any) => {
      // Only count Senior High students (exclude college students)
      const studentType = (enrollment.student_type || "").toLowerCase().trim()
      const isSeniorHighStudent = studentType.includes("senior") || studentType.includes("high") || studentType === "senior high"
      
      if (isSeniorHighStudent) {
        // Try program_track_strand first, then fall back to program
        const strand = enrollment.program_track_strand || enrollment.program
        
        if (strand && strand.trim() && strand !== "Not specified") {
          // Match enrollment strand to designated strand (case-insensitive, flexible matching)
          const strandLower = strand.toLowerCase().trim()
          let matchedStrand: string | null = null
          
          // Match IT-related strands: IT + (mobile OR app OR web OR development)
          if (strandLower.includes("it") && (
            strandLower.includes("mobile") || 
            strandLower.includes("app") || 
            strandLower.includes("web") || 
            strandLower.includes("development")
          )) {
            matchedStrand = "IT in Mobile App and Web Development"
          } else if (strandLower.includes("humms") || (strandLower.includes("humanities") && strandLower.includes("social"))) {
            matchedStrand = "Humanities and Social Sciences (HUMMS)"
          } else if (strandLower.includes("abm") || (strandLower.includes("accountancy") && strandLower.includes("business") && strandLower.includes("management"))) {
            matchedStrand = "Accountancy, Business, and Management (ABM)"
          }
          
          // If matched to a designated strand, increment count
          if (matchedStrand && strandEnrolledCounts.hasOwnProperty(matchedStrand)) {
            strandEnrolledCounts[matchedStrand] = (strandEnrolledCounts[matchedStrand] || 0) + 1
          }
        }
      }
    })
    
    console.log('Enrolled per strand calculation:', {
      totalEnrollments: enrolledStrandRaw?.length || 0,
      strandCounts: strandEnrolledCounts,
      sampleEnrollments: enrolledStrandRaw?.slice(0, 3).map((e: any) => ({ 
        student_type: e.student_type, 
        program_track_strand: e.program_track_strand,
        program: e.program 
      }))
    })
    
    // Return all designated strands sorted by value (descending - highest on top)
    const enrolledPerStrand = designatedStrands
      .map(strand => ({
        name: strand,
        value: strandEnrolledCounts[strand] || 0
      }))
      .sort((a, b) => b.value - a.value) // Sort descending - highest value first

    // Calculate source conversion rates
    // Get inquiries with sources
    let sourceInquiriesQuery = supabase
      .from('inquiries')
      .select('id, how_did_you_find_out, created_at')
      .not('how_did_you_find_out', 'is', null)

    if (startDate) {
      sourceInquiriesQuery = sourceInquiriesQuery.gte('created_at', `${startDate}T00:00:00.000Z`)
    }
    if (endDate) {
      sourceInquiriesQuery = sourceInquiriesQuery.lte('created_at', `${endDate}T23:59:59.999Z`)
    }

    const { data: sourceInquiries } = await sourceInquiriesQuery

    console.log('Source inquiries count:', sourceInquiries?.length || 0)
    console.log('Sample source inquiry:', sourceInquiries?.[0])

    // Get all inquiry IDs from the filtered inquiries
    const inquiryIds = Array.from(new Set((sourceInquiries || []).map((inq: any) => inq.id).filter(Boolean)))

    console.log('Inquiry IDs to match:', inquiryIds.length)

    // Get enrollments that match any of these inquiry IDs (regardless of enrollment date)
    // This ensures we count enrollments even if they were created after the inquiry date range
    let enrollments: any[] = []
    
    if (inquiryIds.length > 0) {
      const enrollmentsForSourceQuery = supabase
        .from('enrollments')
        .select('id, inquiry_id, created_at')
        .in('inquiry_id', inquiryIds)
      
      const { data: enrollmentsData, error: enrollmentsError } = await enrollmentsForSourceQuery
      
      if (enrollmentsError) {
        console.error('Error fetching enrollments:', enrollmentsError)
      }
      
      enrollments = enrollmentsData || []
      console.log('Matched enrollments count:', enrollments.length)
      console.log('Sample enrollment:', enrollments[0])
    }

    // Map enrollments to inquiry IDs
    const enrollmentInquiryIds = new Set((enrollments || []).map((e: any) => e.inquiry_id).filter(Boolean))
    
    console.log('Enrollment inquiry IDs:', Array.from(enrollmentInquiryIds))
    
    // Create a map of inquiry ID to sources
    const inquirySourceMap = new Map<string, string[]>()
    const sourceNameMap: { [key: string]: string } = {
      'tv': 'TV',
      'outdoor': 'Outdoor',
      'radio': 'Radio',
      'print': 'Print',
      'magazine': 'Magazine',
      'online': 'Online',
      'website': 'Website',
      'facebook': 'Facebook',
      'others-online': 'Others Online',
      'events': 'Events',
      'referral': 'Referral',
      'career-orientation': 'Career Orientation'
    }

    sourceInquiries?.forEach((inquiry: any) => {
      if (inquiry.how_did_you_find_out && Array.isArray(inquiry.how_did_you_find_out)) {
        inquirySourceMap.set(inquiry.id, inquiry.how_did_you_find_out)
      }
    })

    // Calculate source conversion rates
    const sourceStats: { [key: string]: { inquiries: number; enrollments: number; conversionRate: number } } = {}
    
    sourceInquiries?.forEach((inquiry: any) => {
      if (inquiry.how_did_you_find_out && Array.isArray(inquiry.how_did_you_find_out)) {
        inquiry.how_did_you_find_out.forEach((source: string) => {
          const displayName = sourceNameMap[source] || source
          if (!sourceStats[displayName]) {
            sourceStats[displayName] = { inquiries: 0, enrollments: 0, conversionRate: 0 }
          }
          sourceStats[displayName].inquiries++
          if (enrollmentInquiryIds.has(inquiry.id)) {
            sourceStats[displayName].enrollments++
          }
        })
      }
    })

    // Calculate conversion rates
    Object.keys(sourceStats).forEach(source => {
      const stats = sourceStats[source]
      stats.conversionRate = stats.inquiries > 0 
        ? Math.round((stats.enrollments / stats.inquiries) * 100 * 10) / 10 
        : 0
    })

    const sourceEffectiveness = Object.entries(sourceStats)
      .map(([name, stats]) => ({
        name,
        inquiries: stats.inquiries,
        enrollments: stats.enrollments,
        conversionRate: stats.conversionRate
      }))
      .sort((a, b) => b.conversionRate - a.conversionRate)

    console.log('Source effectiveness:', JSON.stringify(sourceEffectiveness, null, 2))

    // Get last year's data for comparison
    let previousStartDate: string | null = null
    let previousEndDate: string | null = null
    
    if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      
      // Calculate the same date range but one year ago
      const lastYearStart = new Date(start)
      lastYearStart.setFullYear(lastYearStart.getFullYear() - 1)
      
      const lastYearEnd = new Date(end)
      lastYearEnd.setFullYear(lastYearEnd.getFullYear() - 1)
      
      previousStartDate = lastYearStart.toISOString().split('T')[0]
      previousEndDate = lastYearEnd.toISOString().split('T')[0]
    } else {
      // Default to same dates one year ago
      const lastYearEnd = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
      const lastYearStart = new Date(now.getFullYear() - 1, 0, 1) // January 1 of last year
      previousStartDate = lastYearStart.toISOString().split('T')[0]
      previousEndDate = lastYearEnd.toISOString().split('T')[0]
    }

    // Get previous period counts
    const [prevInquiries, prevEnrollments] = await Promise.all([
      supabase
        .from('inquiries')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', `${previousStartDate}T00:00:00.000Z`)
        .lte('created_at', `${previousEndDate}T23:59:59.999Z`),
      supabase
        .from('enrollments')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', `${previousStartDate}T00:00:00.000Z`)
        .lte('created_at', `${previousEndDate}T23:59:59.999Z`)
    ])

    return NextResponse.json({
      inquiriesCount: inquiriesCount.count || 0,
      enrollmentsCount: enrollmentsCount.count || 0,
      inquiriesGrowth,
      enrollmentsGrowth,
      monthOverMonthInquiries,
      monthOverMonthEnrollments,
      previousPeriodInquiries: prevInquiries.count || 0,
      previousPeriodEnrollments: prevEnrollments.count || 0,
      upcomingActivity: upcomingActivity || null,
      topCourses: topCourses || [],
      topStrands: topStrands || [],
      enrolledPerProgram: enrolledPerProgram || [],
      enrolledPerStrand: enrolledPerStrand || [],
      sourceEffectiveness: sourceEffectiveness || []
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate', // Disable caching for real-time data
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 })
  }
}
