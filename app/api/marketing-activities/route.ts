import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

// GET /api/marketing-activities - Get all marketing activities
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('marketing_activities')
      .select('*')
      .order('date', { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    // Convert snake_case to camelCase for frontend
    const camelCaseData = data?.map((item: any) => ({
      id: item.id,
      title: item.title,
      leadsGenerated: item.leads_generated,
      school: item.school,
      budget: item.budget,
      date: item.date
    })) || null;

    return NextResponse.json(camelCaseData)
  } catch (error) {
    console.error('Marketing activities GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    )
  }
}

// POST /api/marketing-activities - Create a new marketing activity
export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Convert camelCase to snake_case for database
    const dbBody = {
      title: body.title,
      leads_generated: body.leadsGenerated,
      school: body.school,
      budget: body.budget,
      date: body.date
    };
    
    const { data, error } = await supabase
      .from('marketing_activities')
      .insert([dbBody])
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Marketing activities POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    )
  }
}

// PUT /api/marketing-activities/:id - Update a marketing activity
export async function PUT(request: Request) {
  try {
    const { id, ...body } = await request.json()
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      )
    }

    // Convert camelCase to snake_case for database
    const dbBody = {
      title: body.title,
      leads_generated: body.leadsGenerated,
      school: body.school,
      budget: body.budget,
      date: body.date
    };

    const { data, error } = await supabase
      .from('marketing_activities')
      .update(dbBody)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    // Convert snake_case to camelCase for frontend
    const camelCaseData = data ? {
      id: data.id,
      title: data.title,
      leadsGenerated: data.leads_generated,
      school: data.school,
      budget: data.budget,
      date: data.date
    } : null;

    return NextResponse.json(camelCaseData)
  } catch (error) {
    console.error('Marketing activities PUT error:', error)
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    )
  }
}

// DELETE /api/marketing-activities/:id - Delete a marketing activity
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('marketing_activities')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({ message: 'Activity deleted successfully' })
  } catch (error) {
    console.error('Marketing activities DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    )
  }
}