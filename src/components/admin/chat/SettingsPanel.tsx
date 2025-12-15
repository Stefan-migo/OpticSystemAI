'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { X, RotateCcw, Search } from 'lucide-react'
import { useChatConfig, type ChatConfig } from '@/hooks/useChatConfig'
import type { LLMProvider } from '@/lib/ai/types'
import { SYSTEM_PROMPTS } from '@/lib/ai/agent/config'

interface SettingsPanelProps {
  config: ChatConfig
  onConfigChange: (config: ChatConfig) => void
  onClose: () => void
}

export function SettingsPanel({ config, onConfigChange, onClose }: SettingsPanelProps) {
  const [providers, setProviders] = useState<Array<{ id: LLMProvider; name: string; enabled: boolean; models: any[] }>>([])
  const [tools, setTools] = useState<Array<{ name: string; description: string; category: string }>>([])
  const [toolsByCategory, setToolsByCategory] = useState<Record<string, any[]>>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProviders()
    loadTools()
  }, [])

  const loadProviders = async () => {
    try {
      const response = await fetch('/api/admin/chat/providers')
      if (response.ok) {
        const data = await response.json()
        setProviders(data.providers || [])
      }
    } catch (error) {
      console.error('Error loading providers:', error)
    }
  }

  const loadTools = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/chat/tools')
      if (response.ok) {
        const data = await response.json()
        setTools(data.tools || [])
        setToolsByCategory(data.toolsByCategory || {})
      }
    } catch (error) {
      console.error('Error loading tools:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredTools = searchQuery
    ? tools.filter(t => 
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : tools

  const updateConfig = (updates: Partial<ChatConfig>) => {
    onConfigChange({ ...config, ...updates })
  }

  const providerNames: Record<LLMProvider, string> = {
    openai: 'OpenAI',
    anthropic: 'Anthropic',
    google: 'Google',
    deepseek: 'DeepSeek',
    custom: 'Custom'
  }

  return (
    <div className="flex flex-col h-full bg-admin-bg-primary">
      <div className="p-4 border-b border-admin-border-primary flex items-center justify-between">
        <h2 className="text-lg font-semibold text-admin-text-primary">Configuración</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <Tabs defaultValue="provider" className="p-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="provider">Proveedor</TabsTrigger>
            <TabsTrigger value="model">Modelo</TabsTrigger>
            <TabsTrigger value="tools">Herramientas</TabsTrigger>
            <TabsTrigger value="advanced">Avanzado</TabsTrigger>
          </TabsList>

          <TabsContent value="provider" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Proveedor de IA</Label>
              <Select
                value={config.provider || ''}
                onValueChange={(value) => updateConfig({ provider: value as LLMProvider })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar proveedor" />
                </SelectTrigger>
                <SelectContent>
                  {providers.filter(p => p.enabled).map(provider => (
                    <SelectItem key={provider.id} value={provider.id}>
                      {providerNames[provider.id]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Modelo</Label>
              <Input
                value={config.model}
                onChange={(e) => updateConfig({ model: e.target.value })}
                placeholder="Ej: gemini-pro, gpt-4, etc."
              />
            </div>
          </TabsContent>

          <TabsContent value="model" className="space-y-6 mt-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Temperatura: {config.temperature.toFixed(1)}</Label>
                <span className="text-sm text-admin-text-secondary">0.0 - 2.0</span>
              </div>
              <Slider
                value={[config.temperature]}
                onValueChange={([value]) => updateConfig({ temperature: value })}
                min={0}
                max={2}
                step={0.1}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Max Tokens: {config.maxTokens}</Label>
                <span className="text-sm text-admin-text-secondary">100 - 32000</span>
              </div>
              <Slider
                value={[config.maxTokens]}
                onValueChange={([value]) => updateConfig({ maxTokens: value })}
                min={100}
                max={32000}
                step={100}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Max Steps: {config.maxSteps}</Label>
                <span className="text-sm text-admin-text-secondary">1 - 10</span>
              </div>
              <Slider
                value={[config.maxSteps]}
                onValueChange={([value]) => updateConfig({ maxSteps: value })}
                min={1}
                max={10}
                step={1}
              />
            </div>
          </TabsContent>

          <TabsContent value="tools" className="space-y-4 mt-4">
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-admin-text-secondary" />
                <Input
                  placeholder="Buscar herramientas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label>Habilitar Tool Calling</Label>
              <Switch
                checked={config.enableToolCalling}
                onCheckedChange={(checked) => updateConfig({ enableToolCalling: checked })}
              />
            </div>

            {config.enableToolCalling && (
              <div className="space-y-4">
                <div className="text-sm text-admin-text-secondary">
                  {config.enabledTools.length} de {tools.length} herramientas habilitadas
                </div>
                
                <ScrollArea className="h-[400px]">
                  {Object.entries(toolsByCategory).map(([category, categoryTools]) => (
                    <div key={category} className="mb-4">
                      <h3 className="font-medium text-admin-text-primary mb-2">{category}</h3>
                      <div className="space-y-2">
                        {categoryTools.map((tool) => {
                          const isEnabled = config.enabledTools.includes(tool.name)
                          return (
                            <div
                              key={tool.name}
                              className="flex items-start gap-2 p-2 rounded hover:bg-admin-bg-secondary"
                            >
                              <Checkbox
                                checked={isEnabled}
                                onCheckedChange={() => {
                                  const newTools = isEnabled
                                    ? config.enabledTools.filter(t => t !== tool.name)
                                    : [...config.enabledTools, tool.name]
                                  updateConfig({ enabledTools: newTools })
                                }}
                              />
                              <div className="flex-1">
                                <div className="font-medium text-sm text-admin-text-primary">
                                  {tool.name}
                                </div>
                                <div className="text-xs text-admin-text-secondary mt-1">
                                  {tool.description}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </ScrollArea>
              </div>
            )}
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4 mt-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>System Prompt Preset</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => updateConfig({ systemPromptPreset: 'default' })}
                >
                  <RotateCcw className="w-3 h-3 mr-1" />
                  Resetear
                </Button>
              </div>
              <Select
                value={config.systemPromptPreset}
                onValueChange={(value) => updateConfig({ systemPromptPreset: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="products">Products</SelectItem>
                  <SelectItem value="orders">Orders</SelectItem>
                  <SelectItem value="analytics">Analytics</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>System Prompt Personalizado</Label>
              <Textarea
                value={config.systemPrompt}
                onChange={(e) => updateConfig({ systemPrompt: e.target.value, systemPromptPreset: 'custom' })}
                rows={8}
                className="font-mono text-xs"
                placeholder="Escribe tu system prompt personalizado..."
              />
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Require Confirmation for Destructive Actions</Label>
                <Switch
                  checked={config.requireConfirmation}
                  onCheckedChange={(checked) => updateConfig({ requireConfirmation: checked })}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </ScrollArea>
    </div>
  )
}
