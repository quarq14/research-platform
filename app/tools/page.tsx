export const dynamic = "force-dynamic"

import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { SetupRequired } from "@/components/setup-required"
import { PlagiarismChecker } from "@/components/plagiarism-checker"
import { AIDetector } from "@/components/ai-detector"
import { ParaphrasingTool } from "@/components/paraphrasing-tool"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function ToolsPage() {
  const supabase = await createServerClient()

  if (!supabase) {
    return <SetupRequired />
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Academic Writing Tools</h1>
        <p className="text-gray-600">Check originality, detect AI content, and improve your writing</p>
      </div>

      <Tabs defaultValue="plagiarism" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="plagiarism">Plagiarism Checker</TabsTrigger>
          <TabsTrigger value="ai-detection">AI Detection</TabsTrigger>
          <TabsTrigger value="paraphrasing">Paraphrasing & Humanizer</TabsTrigger>
        </TabsList>
        <TabsContent value="plagiarism">
          <PlagiarismChecker />
        </TabsContent>
        <TabsContent value="ai-detection">
          <AIDetector />
        </TabsContent>
        <TabsContent value="paraphrasing">
          <ParaphrasingTool />
        </TabsContent>
      </Tabs>
    </div>
  )
}
