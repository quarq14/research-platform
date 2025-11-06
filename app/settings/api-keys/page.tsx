'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { Key, Eye, EyeOff, Trash2, Plus, Check } from 'lucide-react'
import { PROVIDER_MODELS } from '@/lib/llm/providers'

interface ApiKey {
  id: string
  provider_name: string
  masked_key: string
  is_active: boolean
  created_at: string
}

const AVAILABLE_PROVIDERS = [
  { id: 'groq', name: 'Groq (Free)', description: 'Free tier with Llama models', isFree: true },
  { id: 'openai', name: 'OpenAI', description: 'GPT-4, GPT-3.5 models' },
  { id: 'claude', name: 'Claude (Anthropic)', description: 'Claude 3.5 Sonnet, Opus, Haiku' },
  { id: 'gemini', name: 'Gemini (Google)', description: 'Gemini 1.5 Pro, Flash' },
  { id: 'openrouter', name: 'OpenRouter', description: 'Access multiple models with one key' },
]

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [selectedProvider, setSelectedProvider] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [preferredProvider, setPreferredProvider] = useState('groq')
  const [preferredModel, setPreferredModel] = useState('')

  useEffect(() => {
    fetchApiKeys()
    fetchPreferences()
  }, [])

  const fetchApiKeys = async () => {
    try {
      const response = await fetch('/api/settings/api-keys')
      if (response.ok) {
        const data = await response.json()
        setApiKeys(data.keys || [])
      }
    } catch (error) {
      console.error('Failed to fetch API keys:', error)
    }
  }

  const fetchPreferences = async () => {
    try {
      const response = await fetch('/api/settings/preferences')
      if (response.ok) {
        const data = await response.json()
        setPreferredProvider(data.chatbot_provider || 'groq')
        setPreferredModel(data.chatbot_model || '')
      }
    } catch (error) {
      console.error('Failed to fetch preferences:', error)
    }
  }

  const handleAddKey = async () => {
    if (!selectedProvider || !apiKey.trim()) {
      toast.error('Please select a provider and enter an API key')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/settings/api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: selectedProvider,
          apiKey: apiKey.trim(),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to add API key')
      }

      toast.success('API key added successfully')
      setApiKey('')
      setSelectedProvider('')
      fetchApiKeys()
    } catch (error: any) {
      toast.error(error.message || 'Failed to add API key')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to delete this API key?')) {
      return
    }

    try {
      const response = await fetch(`/api/settings/api-keys?id=${keyId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete API key')
      }

      toast.success('API key deleted')
      fetchApiKeys()
    } catch (error) {
      toast.error('Failed to delete API key')
    }
  }

  const handleSavePreferences = async () => {
    setIsLoading(true)

    try {
      const response = await fetch('/api/settings/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatbot_provider: preferredProvider,
          chatbot_model: preferredModel,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save preferences')
      }

      toast.success('Preferences saved successfully')
    } catch (error) {
      toast.error('Failed to save preferences')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">API Keys Management</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Add your own API keys to use different AI providers. Free Groq is used by default.
        </p>
      </div>

      {/* Add New API Key */}
      <Card className="p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Add New API Key
        </h2>

        <div className="space-y-4">
          <div>
            <Label htmlFor="provider">Provider</Label>
            <Select value={selectedProvider} onValueChange={setSelectedProvider}>
              <SelectTrigger>
                <SelectValue placeholder="Select a provider" />
              </SelectTrigger>
              <SelectContent>
                {AVAILABLE_PROVIDERS.map((provider) => (
                  <SelectItem key={provider.id} value={provider.id}>
                    <div>
                      <div className="font-medium">{provider.name}</div>
                      <div className="text-sm text-gray-500">{provider.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="apiKey">API Key</Label>
            <div className="relative">
              <Input
                id="apiKey"
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowKey(!showKey)}
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Your API key is encrypted and stored securely
            </p>
          </div>

          <Button onClick={handleAddKey} disabled={isLoading}>
            <Plus className="h-4 w-4 mr-2" />
            Add API Key
          </Button>
        </div>
      </Card>

      {/* Existing API Keys */}
      <Card className="p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Key className="h-5 w-5" />
          Your API Keys
        </h2>

        {apiKeys.length === 0 ? (
          <p className="text-center text-gray-500 py-8">
            No API keys added yet. Using free Groq provider.
          </p>
        ) : (
          <div className="space-y-3">
            {apiKeys.map((key) => (
              <div
                key={key.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                    <Key className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <div className="font-medium capitalize">{key.provider_name}</div>
                    <div className="text-sm text-gray-500 font-mono">{key.masked_key}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {key.is_active && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center gap-1">
                      <Check className="h-3 w-3" />
                      Active
                    </span>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteKey(key.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Chatbot Preferences */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Chatbot Preferences</h2>

        <div className="space-y-4">
          <div>
            <Label htmlFor="chatbotProvider">Preferred Provider for Chatbot</Label>
            <Select value={preferredProvider} onValueChange={setPreferredProvider}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="groq">
                  <div>
                    <div className="font-medium">Groq (Free - Default)</div>
                    <div className="text-sm text-gray-500">Llama 3.3 70B</div>
                  </div>
                </SelectItem>
                {apiKeys.filter(k => k.is_active).map((key) => (
                  <SelectItem key={key.id} value={key.provider_name}>
                    <div>
                      <div className="font-medium capitalize">{key.provider_name}</div>
                      <div className="text-sm text-gray-500">Your API key</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {preferredProvider && PROVIDER_MODELS[preferredProvider as keyof typeof PROVIDER_MODELS] && (
            <div>
              <Label htmlFor="chatbotModel">Model</Label>
              <Select value={preferredModel} onValueChange={setPreferredModel}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  {PROVIDER_MODELS[preferredProvider as keyof typeof PROVIDER_MODELS].map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Button onClick={handleSavePreferences} disabled={isLoading}>
            Save Preferences
          </Button>
        </div>

        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            💡 <strong>Tip:</strong> The chatbot will use your selected provider for all interactions. If your provider fails, it will fallback to free Groq automatically.
          </p>
        </div>
      </Card>
    </div>
  )
}
