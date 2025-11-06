"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, RefreshCw, Copy, Check } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type ParaphraseMode = "standard" | "formal" | "simple" | "creative" | "humanize"

export function ParaphrasingTool() {
  const [inputText, setInputText] = useState("")
  const [outputText, setOutputText] = useState("")
  const [mode, setMode] = useState<ParaphraseMode>("standard")
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handleParaphrase = async () => {
    if (!inputText.trim()) {
      setError("Please enter text to paraphrase")
      return
    }

    setIsProcessing(true)
    setError(null)
    setOutputText("")

    try {
      const response = await fetch("/api/paraphrase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: inputText, mode }),
      })

      if (!response.ok) {
        throw new Error("Failed to paraphrase text")
      }

      const data = await response.json()
      setOutputText(data.paraphrasedText)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(outputText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Paraphrasing & Humanizer Tool</CardTitle>
        <CardDescription>
          Rephrase text for clarity and natural flow while maintaining meaning and citations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            This tool improves clarity and naturalness without evading detection. Always maintain factual accuracy and
            proper citations.
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <label className="text-sm font-medium">Paraphrasing Mode</label>
          <Select value={mode} onValueChange={(value) => setMode(value as ParaphraseMode)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="standard">Standard - Balanced rephrasing</SelectItem>
              <SelectItem value="formal">Formal - Academic tone</SelectItem>
              <SelectItem value="simple">Simple - Easier to understand</SelectItem>
              <SelectItem value="creative">Creative - More varied expression</SelectItem>
              <SelectItem value="humanize">Humanize - Natural, conversational flow</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Tabs defaultValue="input" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="input">Input Text</TabsTrigger>
            <TabsTrigger value="output" disabled={!outputText}>
              Output Text
            </TabsTrigger>
          </TabsList>
          <TabsContent value="input" className="space-y-4">
            <Textarea
              placeholder="Paste your text here to paraphrase..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              rows={12}
              className="font-mono text-sm"
            />
            <div className="flex items-center gap-2">
              <Button onClick={handleParaphrase} disabled={isProcessing || !inputText.trim()}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isProcessing ? "animate-spin" : ""}`} />
                {isProcessing ? "Processing..." : "Paraphrase"}
              </Button>
              <span className="text-sm text-gray-500">{inputText.length} characters</span>
            </div>
          </TabsContent>
          <TabsContent value="output" className="space-y-4">
            <div className="relative">
              <Textarea value={outputText} readOnly rows={12} className="font-mono text-sm bg-gray-50" />
              <Button
                size="sm"
                variant="outline"
                className="absolute top-2 right-2 bg-transparent"
                onClick={handleCopy}
                disabled={!outputText}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">{outputText.length} characters</span>
              <Button variant="outline" onClick={() => setInputText(outputText)}>
                Use as Input
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {outputText && (
          <Alert>
            <AlertDescription>
              <strong>Note:</strong> Review the paraphrased text for accuracy and ensure all citations are preserved.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
