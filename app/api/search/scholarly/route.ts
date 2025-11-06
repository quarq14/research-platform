import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ScholarlySearchService } from '@/lib/scholarly/search'
import { CitationFormatter } from '@/lib/citations/formatter'

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

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')
    const sources = searchParams.get('sources')?.split(',') || ['semantic-scholar', 'openalex']
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      )
    }

    // Create search service
    const searchService = new ScholarlySearchService()

    // Perform search
    const results = await searchService.search(query, sources, limit)

    // Convert results to include citations
    const papersWithCitations = results.map((paper) => {
      const cslData = CitationFormatter.toCSLJSON(paper)
      const apaCitation = CitationFormatter.format(cslData, 'apa')
      const mlaCitation = CitationFormatter.format(cslData, 'mla')

      return {
        ...paper,
        citations: {
          apa: apaCitation,
          mla: mlaCitation,
          chicago: CitationFormatter.format(cslData, 'chicago'),
        },
        cslData,
      }
    })

    // Track usage
    await supabase.from('usage_events').insert({
      user_id: user.id,
      event_type: 'search',
      amount: 1,
      metadata: {
        query,
        sources,
        resultsCount: results.length,
      },
    })

    return NextResponse.json({
      results: papersWithCitations,
      query,
      sources,
      count: papersWithCitations.length,
    })
  } catch (error: any) {
    console.error('Scholarly search error:', error)
    return NextResponse.json(
      { error: error.message || 'Search failed' },
      { status: 500 }
    )
  }
}
