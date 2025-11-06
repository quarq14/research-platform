import { Button } from "@/components/ui/button"
import { BookOpen, FileText, MessageSquare, Search, Sparkles, Bot, Zap, Shield } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-blue-950 dark:to-purple-950">
      <header className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="relative">
              <BookOpen className="h-7 w-7 text-blue-600" />
              <Sparkles className="h-3 w-3 absolute -top-1 -right-1 text-purple-600 animate-pulse" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Academic AI Platform
            </span>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" asChild>
              <Link href="/auth/login">Sign In</Link>
            </Button>
            <Button asChild className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <Link href="/auth/signup">Get Started Free</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-20 text-center relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 via-purple-400/20 to-pink-400/20 blur-3xl" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm px-4 py-2 rounded-full mb-6 border border-purple-200 dark:border-purple-800">
              <Sparkles className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Powered by Multiple AI Providers
              </span>
            </div>
            <h1 className="text-6xl font-bold tracking-tight mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              AI-Powered Academic
              <br />
              Research Platform
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-3xl mx-auto">
              Upload PDFs, chat with documents, search scholarly sources, and create academic papers with AI-powered
              writing assistance. Choose from multiple AI providers including Groq (free), OpenAI, Claude, Gemini, and
              OpenRouter.
            </p>
            <div className="flex gap-4 justify-center mb-12">
              <Button size="lg" asChild className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg">
                <Link href="/auth/signup">
                  <Sparkles className="mr-2 h-5 w-5" />
                  Start Free Now
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="border-2">
                <Link href="/dashboard">
                  <Bot className="mr-2 h-5 w-5" />
                  Try Demo
                </Link>
              </Button>
            </div>
            {/* Feature badges */}
            <div className="flex flex-wrap gap-3 justify-center text-sm">
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm px-4 py-2 rounded-full border border-gray-200 dark:border-gray-700">
                <Zap className="inline h-4 w-4 text-yellow-500 mr-1" />
                Free Groq API included
              </div>
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm px-4 py-2 rounded-full border border-gray-200 dark:border-gray-700">
                <Shield className="inline h-4 w-4 text-green-500 mr-1" />
                Secure & Private
              </div>
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm px-4 py-2 rounded-full border border-gray-200 dark:border-gray-700">
                <Bot className="inline h-4 w-4 text-blue-500 mr-1" />
                5+ AI Providers
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="container mx-auto px-4 py-16">
          <h2 className="text-3xl font-bold text-center mb-12 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Powerful Research Tools
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow border border-purple-100 dark:border-purple-900 group hover:scale-105 transition-transform">
              <div className="bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 p-3 rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform">
                <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">PDF Upload & Analysis</h3>
              <p className="text-gray-600 dark:text-gray-400">Upload academic papers and analyze them with AI</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow border border-purple-100 dark:border-purple-900 group hover:scale-105 transition-transform">
              <div className="bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900 dark:to-purple-800 p-3 rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform">
                <MessageSquare className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">ChatPDF with AI</h3>
              <p className="text-gray-600 dark:text-gray-400">Chat with your documents using multiple AI models</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow border border-purple-100 dark:border-purple-900 group hover:scale-105 transition-transform">
              <div className="bg-gradient-to-br from-pink-100 to-pink-200 dark:from-pink-900 dark:to-pink-800 p-3 rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform">
                <Search className="h-8 w-8 text-pink-600 dark:text-pink-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Academic Search</h3>
              <p className="text-gray-600 dark:text-gray-400">Find sources with Semantic Scholar & OpenAlex</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow border border-purple-100 dark:border-purple-900 group hover:scale-105 transition-transform">
              <div className="bg-gradient-to-br from-indigo-100 to-indigo-200 dark:from-indigo-900 dark:to-indigo-800 p-3 rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform">
                <BookOpen className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Writing Assistant</h3>
              <p className="text-gray-600 dark:text-gray-400">Write papers with AI-powered editor & citations</p>
            </div>
          </div>
        </section>

        {/* AI Providers Section */}
        <section className="container mx-auto px-4 py-16">
          <h2 className="text-3xl font-bold text-center mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Choose Your AI Provider
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto">
            Start with our free embedded Groq API, or bring your own API keys for OpenAI, Claude, Gemini, or OpenRouter
          </p>
          <div className="grid md:grid-cols-5 gap-4 max-w-4xl mx-auto">
            {[
              { name: "Groq", subtitle: "Free", color: "from-yellow-500 to-orange-500" },
              { name: "OpenAI", subtitle: "GPT-4", color: "from-green-500 to-teal-500" },
              { name: "Claude", subtitle: "Anthropic", color: "from-purple-500 to-pink-500" },
              { name: "Gemini", subtitle: "Google", color: "from-blue-500 to-cyan-500" },
              { name: "OpenRouter", subtitle: "Multi-Model", color: "from-red-500 to-orange-500" },
            ].map((provider) => (
              <div
                key={provider.name}
                className="bg-white dark:bg-gray-800 p-4 rounded-xl text-center border border-gray-200 dark:border-gray-700 hover:scale-105 transition-transform"
              >
                <div className={`h-12 w-12 mx-auto mb-2 rounded-full bg-gradient-to-r ${provider.color} flex items-center justify-center`}>
                  <Bot className="h-6 w-6 text-white" />
                </div>
                <p className="font-semibold text-sm">{provider.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{provider.subtitle}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm py-8">
        <div className="container mx-auto px-4 text-center text-gray-600 dark:text-gray-400">
          <p>&copy; 2025 Academic AI Platform. Powered by Multi-AI Technology.</p>
        </div>
      </footer>
    </div>
  )
}
