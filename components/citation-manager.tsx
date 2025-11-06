"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { BookOpen, Search, Copy, Check, Trash2 } from "lucide-react"
import { formatCitation, formatInTextCitation, type CitationStyle, type Source } from "@/lib/citations"

interface CitationManagerProps {
  initialSources: any[]
  userId: string
}

export function CitationManager({ initialSources, userId }: CitationManagerProps) {
  const [sources, setSources] = useState<Source[]>(
    initialSources.map((s) => ({
      id: s.id,
      title: s.title,
      authors: s.authors || [],
      year: s.year,
      journal: s.journal,
      doi: s.doi,
      url: s.url,
      type: "article",
    })),
  )
  const [style, setStyle] = useState<CitationStyle>("APA")
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    try {
      const response = await fetch("/api/search-sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery }),
      })

      if (response.ok) {
        const { results } = await response.json()
        // Add search results to sources
        const newSources = results.map((r: any) => ({
          title: r.title,
          authors: r.authors || [],
          year: r.year,
          journal: r.journal,
          doi: r.doi,
          url: r.url,
          type: "article" as const,
        }))
        setSources([...newSources, ...sources])
      }
    } catch (error) {
      console.error("[v0] Search error:", error)
    } finally {
      setIsSearching(false)
    }
  }

  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleDelete = (id: string) => {
    setSources(sources.filter((s) => s.id !== id))
  }

  const filteredSources = sources

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Search Academic Sources</CardTitle>
          <CardDescription>Find papers from Semantic Scholar, OpenAlex, and Crossref</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Search for papers, authors, or topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={isSearching}>
              <Search className="h-4 w-4 mr-2" />
              {isSearching ? "Searching..." : "Search"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Label>Citation Style:</Label>
          <Select value={style} onValueChange={(v) => setStyle(v as CitationStyle)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="APA">APA</SelectItem>
              <SelectItem value="MLA">MLA</SelectItem>
              <SelectItem value="Chicago">Chicago</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Badge variant="secondary">{sources.length} sources</Badge>
      </div>

      {sources.length === 0 ? (
        <Alert>
          <BookOpen className="h-4 w-4" />
          <AlertDescription>
            No sources yet. Search for academic papers or add sources manually to get started.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-4">
          {filteredSources.map((source, index) => {
            const citation = formatCitation(source, style)
            const inText = formatInTextCitation(source, style)
            const sourceId = source.id || `source-${index}`

            return (
              <Card key={sourceId}>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">{source.title}</h3>
                      <p className="text-sm text-gray-600">
                        {source.authors.map((a) => `${a.firstName} ${a.lastName}`).join(", ")} ({source.year})
                      </p>
                      {source.journal && <p className="text-sm text-gray-500 italic">{source.journal}</p>}
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(sourceId)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <Tabs defaultValue="reference" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="reference">Reference</TabsTrigger>
                      <TabsTrigger value="in-text">In-Text</TabsTrigger>
                    </TabsList>
                    <TabsContent value="reference" className="space-y-2">
                      <div className="bg-gray-50 p-3 rounded-lg relative">
                        <p className="text-sm" dangerouslySetInnerHTML={{ __html: citation }} />
                        <Button
                          size="sm"
                          variant="ghost"
                          className="absolute top-2 right-2"
                          onClick={() => handleCopy(citation.replace(/<[^>]*>/g, ""), `ref-${sourceId}`)}
                        >
                          {copiedId === `ref-${sourceId}` ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TabsContent>
                    <TabsContent value="in-text" className="space-y-2">
                      <div className="bg-gray-50 p-3 rounded-lg relative">
                        <p className="text-sm font-mono">{inText}</p>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="absolute top-2 right-2"
                          onClick={() => handleCopy(inText, `in-${sourceId}`)}
                        >
                          {copiedId === `in-${sourceId}` ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    </TabsContent>
                  </Tabs>

                  {source.doi && (
                    <p className="text-xs text-gray-500 mt-2">
                      DOI:{" "}
                      <a
                        href={`https://doi.org/${source.doi}`}
                        className="underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {source.doi}
                      </a>
                    </p>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
