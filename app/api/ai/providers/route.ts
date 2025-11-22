/**
 * API Route: /api/ai/providers
 * Get all available AI providers and their models
 */

import { NextRequest, NextResponse } from 'next/server'
import { getActiveProviders, getProviderModels } from '@/lib/ai/model-router'

export async function GET(request: NextRequest) {
  try {
    // Get all active providers
    const providers = await getActiveProviders()

    // Get models for each provider
    const providersWithModels = await Promise.all(
      providers.map(async (provider) => {
        const models = await getProviderModels(provider.id)
        return {
          ...provider,
          models,
        }
      })
    )

    return NextResponse.json({
      success: true,
      providers: providersWithModels,
    })
  } catch (error: any) {
    console.error('Error fetching providers:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch providers',
      },
      { status: 500 }
    )
  }
}
