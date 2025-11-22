/**
 * API Route: /api/ai/api-keys
 * Manage user API keys for AI providers
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { encryptApiKey, decryptApiKey, validateApiKeyFormat, maskApiKey } from '@/lib/encryption'

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase configuration missing')
  }

  return createClient(supabaseUrl, supabaseKey)
}

/**
 * GET: List user's API keys (masked)
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

    // Get user's API keys with provider info
    const { data: apiKeys, error } = await supabase
      .from('api_keys')
      .select(`
        *,
        provider:ai_providers(*)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    // Mask the keys for security
    const maskedKeys = apiKeys?.map((key: any) => ({
      id: key.id,
      provider: key.provider,
      key_name: key.key_name,
      masked_key: maskApiKey(decryptApiKey(key.encrypted_key)),
      is_active: key.is_active,
      last_used_at: key.last_used_at,
      usage_count: key.usage_count,
      created_at: key.created_at,
    })) || []

    return NextResponse.json({
      success: true,
      api_keys: maskedKeys,
    })
  } catch (error: any) {
    console.error('Error fetching API keys:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch API keys',
      },
      { status: 500 }
    )
  }
}

/**
 * POST: Add a new API key
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
    const { provider_id, api_key, key_name } = body

    if (!provider_id || !api_key) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate API key format
    if (!validateApiKeyFormat(api_key)) {
      return NextResponse.json(
        { success: false, error: 'Invalid API key format' },
        { status: 400 }
      )
    }

    // Encrypt the API key
    const encryptedKey = encryptApiKey(api_key)

    // Deactivate old keys for this provider (if any)
    await supabase
      .from('api_keys')
      .update({ is_active: false })
      .eq('user_id', user.id)
      .eq('provider_id', provider_id)
      .eq('is_active', true)

    // Insert new API key
    const { data, error } = await supabase
      .from('api_keys')
      .insert({
        user_id: user.id,
        provider_id,
        encrypted_key: encryptedKey,
        key_name: key_name || null,
        is_active: true,
      })
      .select(`
        *,
        provider:ai_providers(*)
      `)
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      api_key: {
        id: data.id,
        provider: data.provider,
        key_name: data.key_name,
        masked_key: maskApiKey(api_key),
        is_active: data.is_active,
        created_at: data.created_at,
      },
    })
  } catch (error: any) {
    console.error('Error adding API key:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to add API key',
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE: Remove an API key
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
    const keyId = searchParams.get('id')

    if (!keyId) {
      return NextResponse.json(
        { success: false, error: 'Missing key ID' },
        { status: 400 }
      )
    }

    // Delete the API key (ensure it belongs to the user)
    const { error } = await supabase
      .from('api_keys')
      .delete()
      .eq('id', keyId)
      .eq('user_id', user.id)

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      message: 'API key deleted successfully',
    })
  } catch (error: any) {
    console.error('Error deleting API key:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to delete API key',
      },
      { status: 500 }
    )
  }
}
