import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      )
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('chatbot_provider, chatbot_model')
      .eq('id', user.id)
      .single()

    return NextResponse.json({
      chatbot_provider: profile?.chatbot_provider || 'groq',
      chatbot_model: profile?.chatbot_model || '',
    })
  } catch (error: any) {
    console.error('Preferences GET error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch preferences' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      )
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { chatbot_provider, chatbot_model } = body

    const { error } = await supabase
      .from('profiles')
      .update({
        chatbot_provider,
        chatbot_model,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (error) {
      throw new Error('Failed to update preferences')
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Preferences POST error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to save preferences' },
      { status: 500 }
    )
  }
}
