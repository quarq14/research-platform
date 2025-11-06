"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { AlertCircle, CheckCircle, FileSearch } from "lucide-react"

interface PlagiarismResult {
  overallScore: number
  matches: Array<{
    text: string
    source: string
    similarity: number
  }>
}

export function PlagiarismChecker() {
  const [text, setText] = useState("")
  const [isChecking, setIsChecking] = useState(false)
  const [result, setResult] = useState<PlagiarismResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleCheck = async () => {
    if (!text.trim()) {
      setError("Please enter text to check")
      return
    }

    setIsChecking(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch("/api/plagiarism-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      })

      if (!response.ok) {
        throw new Error("Failed to check plagiarism")
      }

      const data = await response.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsChecking(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Plagiarism Checker</CardTitle>
        <CardDescription>Check your text for potential plagiarism and find similar sources</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder="Paste your text here to check for plagiarism..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={10}
          className="font-mono text-sm"
        />

        <div className="flex items-center gap-2">
          <Button onClick={handleCheck} disabled={isChecking || !text.trim()}>
            <FileSearch className="h-4 w-4 mr-2" />
            {isChecking ? "Checking..." : "Check Plagiarism"}
          </Button>
          <span className="text-sm text-gray-500">{text.length} characters</span>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {result && (
          <div className="space-y-4 mt-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Originality Score</h3>
              <div className="flex items-center gap-2">
                {result.overallScore >= 90 ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                )}
                <span className="text-2xl font-bold">{result.overallScore}%</span>
              </div>
            </div>

            <Progress value={result.overallScore} className="h-2" />

            <Alert>
              <AlertDescription>
                {result.overallScore >= 90
                  ? "Your text appears to be highly original."
                  : result.overallScore >= 70
                    ? "Some similarities detected. Review the matches below."
                    : "Significant similarities found. Please review and cite sources."}
              </AlertDescription>
            </Alert>

            {result.matches.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold">Potential Matches</h4>
                {result.matches.map((match, index) => (
                  <Card key={index}>
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-medium">Match {index + 1}</span>
                        <span className="text-sm text-red-600 font-semibold">{match.similarity}% similar</span>
                      </div>
                      <p className="text-sm text-gray-700 mb-2 bg-yellow-50 p-2 rounded">{match.text}</p>
                      <p className="text-xs text-gray-500">Source: {match.source}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
