import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

export const runtime = 'nodejs'

// Simple encryption (in production, use a proper encryption library)
function encryptKey(apiKey: string): string {
  const algorithm = 'aes-256-cbc'
  const key = Buffer.from(process.env.ENCRYPTION_KEY || 'default-key-32-characters-long!!', 'utf-8').slice(0, 32)
  const iv = crypto.randomBytes(16)

  const cipher = crypto.createCipheriv(algorithm, key, iv)
  let encrypted = cipher.update(apiKey, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  return iv.toString('hex') + ':' + encrypted
}

function maskKey(apiKey: string): string {
  if (apiKey.length <= 8) return '****'
  return apiKey.slice(0, 4) + '****' + apiKey.slice(-4)
}

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

    // Fetch user's API keys with provider info
    const { data: keys, error } = await supabase
      .from('api_keys')
      .select('id, provider_id, is_active, created_at, api_providers(name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error('Failed to fetch API keys')
    }

    // Format response with masked keys
    const formattedKeys = keys?.map(key => ({
      id: key.id,
      provider_name: (key.api_providers as any)?.name || 'unknown',
      masked_key: '****' + key.id.slice(-4), // Just show last 4 chars of ID
      is_active: key.is_active,
      created_at: key.created_at,
    })) || []

    return NextResponse.json({ keys: formattedKeys })
  } catch (error: any) {
    console.error('API keys GET error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch API keys' },
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
    const { provider, apiKey } = body

    if (!provider || !apiKey) {
      return NextResponse.json(
        { error: 'Provider and API key are required' },
        { status: 400 }
      )
    }

    // Get provider ID
    const { data: providerData, error: providerError } = await supabase
      .from('api_providers')
      .select('id')
      .eq('name', provider)
      .single()

    if (providerError || !providerData) {
      // Create provider if it doesn't exist
      const { data: newProvider } = await supabase
        .from('api_providers')
        .insert({
          name: provider,
          type: 'llm',
          enabled_default: false,
        })
        .select('id')
        .single()

      if (!newProvider) {
        return NextResponse.json(
          { error: 'Failed to create provider' },
          { status: 500 }
        )
      }
    }

    // Check if user already has a key for this provider
    const { data: existingKey } = await supabase
      .from('api_keys')
      .select('id')
      .eq('user_id', user.id)
      .eq('provider_id', providerData.id)
      .single()

    if (existingKey) {
      // Update existing key
      const { error: updateError } = await supabase
        .from('api_keys')
        .update({
          encrypted_key: encryptKey(apiKey),
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingKey.id)

      if (updateError) {
        throw new Error('Failed to update API key')
      }
    } else {
      // Insert new key
      const { error: insertError } = await supabase
        .from('api_keys')
        .insert({
          user_id: user.id,
          provider_id: providerData.id,
          encrypted_key: encryptKey(apiKey),
          is_active: true,
        })

      if (insertError) {
        throw new Error('Failed to save API key')
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('API keys POST error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to save API key' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
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

    const keyId = request.nextUrl.searchParams.get('id')

    if (!keyId) {
      return NextResponse.json(
        { error: 'Key ID is required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('api_keys')
      .delete()
      .eq('id', keyId)
      .eq('user_id', user.id) // Ensure user owns the key

    if (error) {
      throw new Error('Failed to delete API key')
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('API keys DELETE error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete API key' },
      { status: 500 }
    )
  }
}
