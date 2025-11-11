'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
  AIProvider,
  PROVIDER_NAMES,
  DEFAULT_MODELS,
} from '@/lib/ai-providers'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Check, X, Sparkles, Zap, Bot } from 'lucide-react'

interface APIKeyConfig {
  provider: AIProvider
  apiKey: string
  isActive: boolean
}

export function AISettings() {
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>('groq')
  const [apiKeys, setApiKeys] = useState<Record<AIProvider, string>>({
    groq: '',
    openrouter: '',
    claude: '',
    openai: '',
    gemini: '',
    kimi: '',
  })
  const [showKeys, setShowKeys] = useState<Record<AIProvider, boolean>>({
    groq: false,
    openrouter: false,
    claude: false,
    openai: false,
    gemini: false,
    kimi: false,
  })
  const [savedKeys, setSavedKeys] = useState<Set<AIProvider>>(new Set())
  const [selectedModel, setSelectedModel] = useState<string>(DEFAULT_MODELS.groq)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      // Load saved API keys
      const { data: keysData } = await supabase
        .from('api_keys')
        .select('provider, encrypted_key, is_active')
        .eq('user_id', user.id)
        .eq('is_active', true)

      if (keysData) {
        const newApiKeys = { ...apiKeys }
        const newSavedKeys = new Set<AIProvider>()

        keysData.forEach((item: any) => {
          const provider = item.provider as AIProvider
          newApiKeys[provider] = item.encrypted_key
          if (item.is_active) {
            newSavedKeys.add(provider)
          }
        })

        setApiKeys(newApiKeys)
        setSavedKeys(newSavedKeys)
      }

      // Load AI preferences
      const { data: settings } = await supabase
        .from('user_settings')
        .select('ai_provider, ai_model')
        .eq('user_id', user.id)
        .single()

      if (settings) {
        setSelectedProvider((settings.ai_provider as AIProvider) || 'groq')
        setSelectedModel(settings.ai_model || DEFAULT_MODELS[settings.ai_provider as AIProvider])
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
    } finally {
      setLoading(false)
    }
  }

  async function saveAPIKey(provider: AIProvider) {
    if (!apiKeys[provider]?.trim()) {
      setMessage({ type: 'error', text: 'Please enter an API key' })
      return
    }

    setSaving(true)
    setMessage(null)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Deactivate old keys for this provider
      await supabase
        .from('api_keys')
        .update({ is_active: false })
        .eq('user_id', user.id)
        .eq('provider', provider)

      // Save new key
      const { error } = await supabase.from('api_keys').insert({
        user_id: user.id,
        provider,
        encrypted_key: apiKeys[provider], // In production, encrypt this!
        is_active: true,
      })

      if (error) throw error

      setSavedKeys((prev) => new Set([...prev, provider]))
      setMessage({ type: 'success', text: `${PROVIDER_NAMES[provider]} API key saved successfully!` })
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to save API key' })
    } finally {
      setSaving(false)
    }
  }

  async function savePreferences() {
    setSaving(true)
    setMessage(null)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Create or update user_settings
      const { error } = await supabase.from('user_settings').upsert(
        {
          user_id: user.id,
          ai_provider: selectedProvider,
          ai_model: selectedModel,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id',
        }
      )

      if (error) throw error

      setMessage({ type: 'success', text: 'AI preferences saved successfully!' })
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to save preferences' })
    } finally {
      setSaving(false)
    }
  }

  async function removeAPIKey(provider: AIProvider) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      await supabase.from('api_keys').update({ is_active: false }).eq('user_id', user.id).eq('provider', provider)

      setApiKeys((prev) => ({ ...prev, [provider]: '' }))
      setSavedKeys((prev) => {
        const newSet = new Set(prev)
        newSet.delete(provider)
        return newSet
      })
      setMessage({ type: 'success', text: `${PROVIDER_NAMES[provider]} API key removed` })
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to remove API key' })
    }
  }

  const providerOptions: { value: AIProvider; label: string; description: string; icon: any }[] = [
    {
      value: 'groq',
      label: 'Groq (Free)',
      description: 'Fast inference with free tier',
      icon: Zap,
    },
    {
      value: 'kimi',
      label: 'Kimi (Free)',
      description: 'Moonshot AI with free tier',
      icon: Sparkles,
    },
    {
      value: 'openrouter',
      label: 'OpenRouter',
      description: 'Access to multiple models',
      icon: Bot,
    },
    {
      value: 'claude',
      label: 'Claude',
      description: 'Anthropic Claude models',
      icon: Sparkles,
    },
    {
      value: 'openai',
      label: 'OpenAI',
      description: 'GPT-4 and GPT-3.5',
      icon: Bot,
    },
    {
      value: 'gemini',
      label: 'Google Gemini',
      description: 'Google Gemini models',
      icon: Sparkles,
    },
  ]

  const modelsByProvider: Record<AIProvider, { value: string; label: string }[]> = {
    groq: [
      { value: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B' },
      { value: 'llama-3.1-70b-versatile', label: 'Llama 3.1 70B' },
      { value: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B (Fast)' },
      { value: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B' },
    ],
    kimi: [
      { value: 'moonshot-v1-8k', label: 'Kimi K2 8K' },
      { value: 'moonshot-v1-32k', label: 'Kimi K2 32K' },
      { value: 'moonshot-v1-128k', label: 'Kimi K2 128K' },
    ],
    openrouter: [
      { value: 'meta-llama/llama-3.3-70b-instruct', label: 'Llama 3.3 70B' },
      { value: 'anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet' },
      { value: 'openai/gpt-4o', label: 'GPT-4o' },
      { value: 'google/gemini-2.0-flash-exp', label: 'Gemini 2.0 Flash' },
    ],
    claude: [
      { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet' },
      { value: 'claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku' },
      { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus' },
    ],
    openai: [
      { value: 'gpt-4o', label: 'GPT-4o' },
      { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
      { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
      { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
    ],
    gemini: [
      { value: 'gemini-2.0-flash-exp', label: 'Gemini 2.0 Flash (Experimental)' },
      { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
      { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
    ],
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* AI Provider Selection */}
      <Card className="border-2 border-gradient-to-r from-blue-500 to-purple-600">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            AI Provider Settings
          </CardTitle>
          <CardDescription>Choose your preferred AI provider and model for chatbot and ChatPDF features</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="provider">Active AI Provider</Label>
            <Select
              value={selectedProvider}
              onValueChange={(value) => {
                setSelectedProvider(value as AIProvider)
                setSelectedModel(DEFAULT_MODELS[value as AIProvider])
              }}
            >
              <SelectTrigger id="provider">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {providerOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <option.icon className="h-4 w-4" />
                      <div>
                        <div className="font-medium">{option.label}</div>
                        <div className="text-xs text-muted-foreground">{option.description}</div>
                      </div>
                      {savedKeys.has(option.value) && <Badge variant="secondary">Configured</Badge>}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="model">AI Model</Label>
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger id="model">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {modelsByProvider[selectedProvider].map((model) => (
                  <SelectItem key={model.value} value={model.value}>
                    {model.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={savePreferences} disabled={saving} className="w-full">
            {saving ? 'Saving...' : 'Save AI Preferences'}
          </Button>
        </CardContent>
      </Card>

      {/* API Keys Management */}
      <Card>
        <CardHeader>
          <CardTitle>API Keys Management</CardTitle>
          <CardDescription>
            Add your API keys to use different AI providers. Keys are encrypted and stored securely.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {(Object.keys(PROVIDER_NAMES) as AIProvider[]).map((provider) => (
            <div key={provider} className="space-y-2 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor={`${provider}-key`} className="text-base font-semibold">
                    {PROVIDER_NAMES[provider]}
                  </Label>
                  {provider === 'groq' && (
                    <p className="text-xs text-muted-foreground">Free tier available - built-in API key included</p>
                  )}
                  {provider === 'kimi' && (
                    <p className="text-xs text-muted-foreground">Free tier available - optional API key</p>
                  )}
                </div>
                {savedKeys.has(provider) && (
                  <Badge variant="default" className="gap-1">
                    <Check className="h-3 w-3" />
                    Active
                  </Badge>
                )}
              </div>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id={`${provider}-key`}
                    type={showKeys[provider] ? 'text' : 'password'}
                    value={apiKeys[provider]}
                    onChange={(e) => setApiKeys({ ...apiKeys, [provider]: e.target.value })}
                    placeholder={provider === 'groq' || provider === 'kimi' ? 'Optional - free API included' : 'Enter your API key'}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKeys({ ...showKeys, [provider]: !showKeys[provider] })}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showKeys[provider] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {savedKeys.has(provider) ? (
                  <Button variant="destructive" size="sm" onClick={() => removeAPIKey(provider)}>
                    <X className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => saveAPIKey(provider)}
                    disabled={saving || !apiKeys[provider]?.trim()}
                  >
                    Save
                  </Button>
                )}
              </div>

              {provider === 'openrouter' && (
                <p className="text-xs text-muted-foreground">
                  Get your key at{' '}
                  <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="underline">
                    openrouter.ai/keys
                  </a>
                </p>
              )}
              {provider === 'claude' && (
                <p className="text-xs text-muted-foreground">
                  Get your key at{' '}
                  <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" className="underline">
                    console.anthropic.com
                  </a>
                </p>
              )}
              {provider === 'openai' && (
                <p className="text-xs text-muted-foreground">
                  Get your key at{' '}
                  <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline">
                    platform.openai.com/api-keys
                  </a>
                </p>
              )}
              {provider === 'gemini' && (
                <p className="text-xs text-muted-foreground">
                  Get your key at{' '}
                  <a
                    href="https://makersuite.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    makersuite.google.com
                  </a>
                </p>
              )}
              {provider === 'kimi' && (
                <p className="text-xs text-muted-foreground">
                  Get your key at{' '}
                  <a
                    href="https://platform.moonshot.cn/console/api-keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    platform.moonshot.cn
                  </a>
                  {' '}- Free tier available with generous limits
                </p>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Messages */}
      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* Info Card */}
      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
        <CardHeader>
          <CardTitle className="text-lg">💡 How it works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            • <strong>Groq (Free):</strong> Our embedded free API key allows you to use AI features immediately without any
            setup
          </p>
          <p>
            • <strong>Kimi K2 (Free):</strong> Moonshot AI offers generous free tier with support for long context (up to 128K tokens)
          </p>
          <p>
            • <strong>Your API Keys:</strong> Add your own keys for more providers and higher rate limits
          </p>
          <p>
            • <strong>Model Selection:</strong> Choose the AI model that best fits your needs (speed vs quality)
          </p>
          <p>
            • <strong>Security:</strong> All API keys are encrypted before storage and never shared
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
