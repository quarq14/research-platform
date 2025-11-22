'use client'

/**
 * AI Model Settings Component
 * Allows users to:
 * 1. Add and manage their own API keys
 * 2. Select models for different features
 * 3. View usage statistics
 */

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import {
  Plus,
  Trash2,
  Key,
  Sparkles,
  Check,
  ExternalLink,
  AlertCircle,
} from 'lucide-react'

interface Provider {
  id: string
  name: string
  display_name: string
  is_free: boolean
  is_default: boolean
  requires_user_key: boolean
  documentation_url: string
  models: Model[]
}

interface Model {
  id: string
  name: string
  display_name: string
  is_recommended: boolean
  context_window: number
  max_tokens: number
}

interface ApiKey {
  id: string
  provider: Provider
  key_name: string
  masked_key: string
  is_active: boolean
  last_used_at: string
  usage_count: number
  created_at: string
}

interface Preference {
  id: string
  feature: string
  model: Model
  provider: Provider
  use_custom_key: boolean
  fallback_to_default: boolean
}

const FEATURES = [
  { value: 'global_default', label: 'Global Default' },
  { value: 'chat', label: 'Chat' },
  { value: 'paraphrase', label: 'Paraphrasing' },
  { value: 'summarize', label: 'Summarization' },
  { value: 'translate', label: 'Translation' },
  { value: 'academic_search', label: 'Academic Search' },
  { value: 'pdf_chat', label: 'PDF Chat' },
  { value: 'writing_assistant', label: 'Writing Assistant' },
]

export function AIModelSettings() {
  const [providers, setProviders] = useState<Provider[]>([])
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [preferences, setPreferences] = useState<Preference[]>([])
  const [loading, setLoading] = useState(true)

  // Add API key form state
  const [selectedProvider, setSelectedProvider] = useState<string>('')
  const [newApiKey, setNewApiKey] = useState('')
  const [keyName, setKeyName] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)

      // Get auth token (you'll need to implement this based on your auth setup)
      const token = await getAuthToken()

      // Load providers
      const providersRes = await fetch('/api/ai/providers')
      const providersData = await providersRes.json()
      if (providersData.success) {
        setProviders(providersData.providers)
      }

      // Load API keys
      const keysRes = await fetch('/api/ai/api-keys', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const keysData = await keysRes.json()
      if (keysData.success) {
        setApiKeys(keysData.api_keys)
      }

      // Load preferences
      const prefsRes = await fetch('/api/ai/preferences', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const prefsData = await prefsRes.json()
      if (prefsData.success) {
        setPreferences(prefsData.preferences)
      }
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  async function getAuthToken(): Promise<string> {
    // Implement based on your auth setup
    // This is a placeholder
    return ''
  }

  async function addApiKey() {
    if (!selectedProvider || !newApiKey) {
      toast.error('Please select a provider and enter an API key')
      return
    }

    try {
      const token = await getAuthToken()

      const res = await fetch('/api/ai/api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          provider_id: selectedProvider,
          api_key: newApiKey,
          key_name: keyName || null,
        }),
      })

      const data = await res.json()

      if (data.success) {
        toast.success('API key added successfully')
        setNewApiKey('')
        setKeyName('')
        setSelectedProvider('')
        loadData()
      } else {
        toast.error(data.error || 'Failed to add API key')
      }
    } catch (error) {
      console.error('Error adding API key:', error)
      toast.error('Failed to add API key')
    }
  }

  async function deleteApiKey(keyId: string) {
    try {
      const token = await getAuthToken()

      const res = await fetch(`/api/ai/api-keys?id=${keyId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await res.json()

      if (data.success) {
        toast.success('API key deleted')
        loadData()
      } else {
        toast.error(data.error || 'Failed to delete API key')
      }
    } catch (error) {
      console.error('Error deleting API key:', error)
      toast.error('Failed to delete API key')
    }
  }

  async function savePreference(
    feature: string,
    modelId: string,
    useCustomKey: boolean
  ) {
    try {
      const token = await getAuthToken()

      const model = providers
        .flatMap((p) => p.models)
        .find((m) => m.id === modelId)

      const provider = providers.find((p) =>
        p.models.some((m) => m.id === modelId)
      )

      const res = await fetch('/api/ai/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          feature,
          model_id: modelId,
          provider_id: provider?.id,
          use_custom_key: useCustomKey,
          fallback_to_default: true,
        }),
      })

      const data = await res.json()

      if (data.success) {
        toast.success('Preference saved')
        loadData()
      } else {
        toast.error(data.error || 'Failed to save preference')
      }
    } catch (error) {
      console.error('Error saving preference:', error)
      toast.error('Failed to save preference')
    }
  }

  if (loading) {
    return <div className="p-6">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Sparkles className="h-6 w-6" />
        <h2 className="text-2xl font-bold">AI Model Settings</h2>
      </div>

      <Tabs defaultValue="keys" className="w-full">
        <TabsList>
          <TabsTrigger value="keys">API Keys</TabsTrigger>
          <TabsTrigger value="preferences">Model Preferences</TabsTrigger>
        </TabsList>

        {/* API Keys Tab */}
        <TabsContent value="keys" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Add API Key</CardTitle>
              <CardDescription>
                Add your own API keys to use advanced AI models. The free Groq API
                is always available as a fallback.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Provider</Label>
                <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {providers
                      .filter((p) => p.requires_user_key)
                      .map((provider) => (
                        <SelectItem key={provider.id} value={provider.id}>
                          <div className="flex items-center gap-2">
                            {provider.display_name}
                            {provider.documentation_url && (
                              <ExternalLink className="h-3 w-3" />
                            )}
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Key Name (Optional)</Label>
                <Input
                  placeholder="My API Key"
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>API Key</Label>
                <Input
                  type="password"
                  placeholder="sk-..."
                  value={newApiKey}
                  onChange={(e) => setNewApiKey(e.target.value)}
                />
              </div>

              <Button onClick={addApiKey}>
                <Plus className="mr-2 h-4 w-4" />
                Add API Key
              </Button>
            </CardContent>
          </Card>

          {/* Existing API Keys */}
          <div className="space-y-2">
            {apiKeys.map((key) => (
              <Card key={key.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Key className="h-4 w-4" />
                      <span className="font-medium">
                        {key.provider.display_name}
                      </span>
                      {key.is_active && <Badge variant="default">Active</Badge>}
                    </div>
                    {key.key_name && (
                      <p className="text-sm text-muted-foreground">{key.key_name}</p>
                    )}
                    <p className="font-mono text-sm">{key.masked_key}</p>
                    <p className="text-xs text-muted-foreground">
                      Used {key.usage_count} times
                      {key.last_used_at &&
                        ` · Last used ${new Date(key.last_used_at).toLocaleDateString()}`}
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => deleteApiKey(key.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}

            {apiKeys.length === 0 && (
              <Card>
                <CardContent className="flex items-center justify-center p-6 text-muted-foreground">
                  <div className="text-center">
                    <AlertCircle className="mx-auto mb-2 h-8 w-8" />
                    <p>No API keys added yet</p>
                    <p className="text-sm">
                      The free Groq API is used by default
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Model Preferences Tab */}
        <TabsContent value="preferences" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Model Preferences by Feature</CardTitle>
              <CardDescription>
                Select which AI model to use for each feature. If not set, the
                global default or free Groq API will be used.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {FEATURES.map((feature) => {
                const pref = preferences.find((p) => p.feature === feature.value)

                return (
                  <div key={feature.value} className="space-y-3 border-b pb-4">
                    <Label className="text-base font-medium">{feature.label}</Label>

                    <div className="space-y-2">
                      <Label className="text-sm">Model</Label>
                      <Select
                        value={pref?.model?.id || ''}
                        onValueChange={(modelId) =>
                          savePreference(feature.value, modelId, false)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Use default" />
                        </SelectTrigger>
                        <SelectContent>
                          {providers.map((provider) => (
                            <optgroup key={provider.id} label={provider.display_name}>
                              {provider.models.map((model) => (
                                <SelectItem key={model.id} value={model.id}>
                                  <div className="flex items-center gap-2">
                                    {model.display_name}
                                    {model.is_recommended && (
                                      <Badge variant="secondary" className="text-xs">
                                        Recommended
                                      </Badge>
                                    )}
                                  </div>
                                </SelectItem>
                              ))}
                            </optgroup>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {pref && (
                      <div className="flex items-center gap-2 text-sm">
                        {pref.provider.is_free ? (
                          <Badge variant="default">Free</Badge>
                        ) : (
                          <Badge variant="secondary">Paid</Badge>
                        )}
                        <span className="text-muted-foreground">
                          {pref.model.display_name}
                        </span>
                        {pref.fallback_to_default && (
                          <span className="text-xs text-muted-foreground">
                            (Falls back to Groq on failure)
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
