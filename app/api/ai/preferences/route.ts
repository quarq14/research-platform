/**
 * API Route: /api/ai/preferences
 * Manage user model preferences for different features
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase configuration missing')
  }

  return createClient(supabaseUrl, supabaseKey)
}

/**
 * GET: Get user's model preferences
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()

    // Get user from session
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's preferences with model and provider info
    const { data: preferences, error } = await supabase
      .from('feature_model_preferences')
      .select(`
        *,
        model:ai_models(*),
        provider:ai_providers(*)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      preferences: preferences || [],
    })
  } catch (error: any) {
    console.error('Error fetching preferences:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch preferences',
      },
      { status: 500 }
    )
  }
}

/**
 * POST: Set or update a model preference for a feature
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()

    // Get user from session
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { feature, model_id, provider_id, use_custom_key, fallback_to_default, settings } = body

    if (!feature) {
      return NextResponse.json(
        { success: false, error: 'Missing feature type' },
        { status: 400 }
      )
    }

    // Verify model and provider exist and are active
    if (model_id) {
      const { data: model, error: modelError } = await supabase
        .from('ai_models')
        .select('*')
        .eq('id', model_id)
        .eq('is_active', true)
        .single()

      if (modelError || !model) {
        return NextResponse.json(
          { success: false, error: 'Invalid or inactive model' },
          { status: 400 }
        )
      }
    }

    if (provider_id) {
      const { data: provider, error: providerError } = await supabase
        .from('ai_providers')
        .select('*')
        .eq('id', provider_id)
        .eq('is_active', true)
        .single()

      if (providerError || !provider) {
        return NextResponse.json(
          { success: false, error: 'Invalid or inactive provider' },
          { status: 400 }
        )
      }
    }

    // Check if preference already exists
    const { data: existing } = await supabase
      .from('feature_model_preferences')
      .select('id')
      .eq('user_id', user.id)
      .eq('feature', feature)
      .single()

    let data, error

    if (existing) {
      // Update existing preference
      const result = await supabase
        .from('feature_model_preferences')
        .update({
          model_id: model_id || null,
          provider_id: provider_id || null,
          use_custom_key: use_custom_key !== undefined ? use_custom_key : false,
          fallback_to_default:
            fallback_to_default !== undefined ? fallback_to_default : true,
          settings: settings || {},
        })
        .eq('id', existing.id)
        .select(`
          *,
          model:ai_models(*),
          provider:ai_providers(*)
        `)
        .single()

      data = result.data
      error = result.error
    } else {
      // Insert new preference
      const result = await supabase
        .from('feature_model_preferences')
        .insert({
          user_id: user.id,
          feature,
          model_id: model_id || null,
          provider_id: provider_id || null,
          use_custom_key: use_custom_key !== undefined ? use_custom_key : false,
          fallback_to_default:
            fallback_to_default !== undefined ? fallback_to_default : true,
          settings: settings || {},
        })
        .select(`
          *,
          model:ai_models(*),
          provider:ai_providers(*)
        `)
        .single()

      data = result.data
      error = result.error
    }

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      preference: data,
    })
  } catch (error: any) {
    console.error('Error saving preference:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to save preference',
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE: Remove a model preference
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()

    // Get user from session
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const feature = searchParams.get('feature')

    if (!feature) {
      return NextResponse.json(
        { success: false, error: 'Missing feature type' },
        { status: 400 }
      )
    }

    // Delete the preference
    const { error } = await supabase
      .from('feature_model_preferences')
      .delete()
      .eq('user_id', user.id)
      .eq('feature', feature)

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      message: 'Preference removed successfully',
    })
  } catch (error: any) {
    console.error('Error deleting preference:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to delete preference',
      },
      { status: 500 }
    )
  }
}
