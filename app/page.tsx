import { Button } from "@/components/ui/button"
import { BookOpen, FileText, MessageSquare, Search } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-blue-600" />
            <span className="text-xl font-bold">Academic AI</span>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" asChild>
              <Link href="/auth/login">Sign In</Link>
            </Button>
            <Button asChild>
              <Link href="/auth/signup">Sign Up</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-5xl font-bold tracking-tight text-gray-900 mb-6">
            AI-Powered Academic Writing Assistant
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Upload PDFs, search scholarly sources, and create academic papers with AI-powered writing assistance and
            proper citations.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/auth/signup">Start Free</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/auth/login">Sign In</Link>
            </Button>
          </div>
        </section>

        <section className="container mx-auto px-4 py-16">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <FileText className="h-10 w-10 text-blue-600 mb-4" />
              <h3 className="text-lg font-semibold mb-2">PDF Upload</h3>
              <p className="text-gray-600">Upload academic papers and research documents</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <MessageSquare className="h-10 w-10 text-blue-600 mb-4" />
              <h3 className="text-lg font-semibold mb-2">RAG Chat</h3>
              <p className="text-gray-600">Chat with your documents using AI</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <Search className="h-10 w-10 text-blue-600 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Academic Search</h3>
              <p className="text-gray-600">Find sources with Semantic Scholar and OpenAlex</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <BookOpen className="h-10 w-10 text-blue-600 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Writing Assistant</h3>
              <p className="text-gray-600">Write papers with AI-powered editor</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t bg-white/80 backdrop-blur-sm py-8">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>&copy; 2025 Academic AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
