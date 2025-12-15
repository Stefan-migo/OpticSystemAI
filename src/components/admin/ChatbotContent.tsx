'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { ResizablePanel } from '@/components/ui/resizable'
import { MessageList } from './chat/MessageList'
import { ChatInput } from './chat/ChatInput'
import { ChatHistorySidebar } from './chat/ChatHistorySidebar'
import { SettingsPanel } from './chat/SettingsPanel'
import { ToolBrowser } from './chat/ToolBrowser'
import { ChatHeader } from './chat/ChatHeader'
import { ExportDialog } from './chat/ExportDialog'
import { useChatSession } from '@/hooks/useChatSession'
import { useChatConfig } from '@/hooks/useChatConfig'

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: string
  timestamp?: string
  toolCalls?: any
  toolResults?: any
  metadata?: any
}

interface ChatbotContentProps {
  className?: string
}

export function ChatbotContent({ className }: ChatbotContentProps) {
  const [showHistory, setShowHistory] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showTools, setShowTools] = useState(false)
  const [showExport, setShowExport] = useState(false)
  const [historyWidth, setHistoryWidth] = useState(256)
  
  const handleHistoryWidthChange = useCallback((width: number) => {
    setHistoryWidth(width)
  }, [])
  const [messages, setMessages] = useState<Message[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [currentStreamingContent, setCurrentStreamingContent] = useState('')
  const abortControllerRef = useRef<AbortController | null>(null)
  const streamingMessageIdRef = useRef<string | null>(null)

  const {
    currentSession,
    loading: sessionLoading,
    error: sessionError,
    createSession,
    loadSession,
    updateSessionTitle,
    saveMessage,
    clearSession
  } = useChatSession()

  // Show session errors to user
  useEffect(() => {
    if (sessionError) {
      console.error('Session error:', sessionError)
      // You can show a toast or alert here if needed
    }
  }, [sessionError])

  // Memoize initial config to prevent infinite loops
  // Default to DeepSeek which has more generous rate limits
  const initialConfig = useMemo(() => ({
    provider: 'deepseek' as const,
    model: 'deepseek-chat'
  }), [])

  const {
    config,
    setProvider,
    setModel,
    updateConfig: updateChatConfig,
    getConfigForAPI
  } = useChatConfig(initialConfig)

  const loadMessagesFromSession = useCallback(async (sessionId: string) => {
    try {
      const response = await fetch(`/api/admin/chat/sessions?sessionId=${sessionId}`)
      if (response.ok) {
        const data = await response.json()
        // Map messages and ensure no duplicates by using id as key
        const loadedMessages = (data.messages || []).map((msg: any) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          timestamp: msg.created_at,
          toolCalls: msg.metadata?.toolCalls || msg.tool_calls,
          toolResults: msg.metadata?.toolResults || msg.tool_results,
          metadata: msg.metadata
        }))
        
        // Remove duplicates by id before setting
        const uniqueMessages = Array.from(
          new Map(loadedMessages.map(msg => [msg.id, msg])).values()
        )
        
        setMessages(uniqueMessages)
      }
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  }, [])

  // Load messages when session changes, but only once per session
  const lastLoadedSessionId = useRef<string | null>(null)
  const isLoadingMessages = useRef(false)
  
  useEffect(() => {
    if (currentSession?.id) {
      // Only load if this is a different session than the last one loaded
      // and we're not already loading
      if (lastLoadedSessionId.current !== currentSession.id && !isLoadingMessages.current) {
        lastLoadedSessionId.current = currentSession.id
        isLoadingMessages.current = true
        // Clear messages first to prevent showing old messages
        setMessages([])
        loadMessagesFromSession(currentSession.id).finally(() => {
          isLoadingMessages.current = false
        })
      }
    } else {
      lastLoadedSessionId.current = null
      isLoadingMessages.current = false
      setMessages([])
    }
  }, [currentSession?.id, loadMessagesFromSession])

  const handleNewSession = async () => {
    clearSession()
    setMessages([])
    const provider = config.provider || 'deepseek'
    const model = config.model || (provider === 'deepseek' ? 'deepseek-chat' : provider === 'google' ? 'gemini-2.5-flash' : provider === 'openai' ? 'gpt-4' : 'deepseek-chat')
    
    if (!provider || !model) {
      console.error('Invalid provider or model for new session:', { provider, model })
      return
    }
    
    await createSession(provider, model, null, getConfigForAPI())
  }

  const handleSessionSelect = async (sessionId: string) => {
    // Clear messages first to prevent duplicates
    setMessages([])
    await loadSession(sessionId)
  }

  const sendMessage = async (content: string) => {
    if (!content.trim() || isStreaming) return

    let sessionToUse = currentSession
    if (!sessionToUse) {
      const provider = config.provider || 'deepseek'
      let model = config.model
      
      // Ensure model is a valid string
      if (!model || typeof model !== 'string' || model.trim() === '') {
        model = provider === 'deepseek' ? 'deepseek-chat' : 
                provider === 'google' ? 'gemini-2.5-flash' : 
                provider === 'openai' ? 'gpt-4' : 
                'deepseek-chat'
      }
      
      if (!provider || !model || model.trim() === '') {
        console.error('Invalid provider or model:', { provider, model, config })
        alert('Error: Configuración inválida. Por favor, selecciona un proveedor y modelo válidos.')
        return
      }
      
      const apiConfig = getConfigForAPI()
      
      try {
        sessionToUse = await createSession(provider, model.trim(), null, apiConfig)
        if (!sessionToUse) {
          console.error('Failed to create session - no session returned')
          // Don't show alert here, the error should be logged in useChatSession
          return
        }
      } catch (error: any) {
        console.error('Error creating session:', error)
        // Don't show alert here, let useChatSession handle it
        return
      }
    }

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])
    
    if (sessionToUse) {
      await saveMessage(sessionToUse.id, 'user', content)
    }

    setIsStreaming(true)
    setCurrentStreamingContent('')

    const assistantMessageId = crypto.randomUUID()
    streamingMessageIdRef.current = assistantMessageId

    const streamingMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString()
    }
    setMessages(prev => [...prev, streamingMessage])

    abortControllerRef.current = new AbortController()

    try {
      const apiConfig = getConfigForAPI()
      const response = await fetch('/api/admin/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: content,
          provider: config.provider,
          model: config.model,
          sessionId: sessionToUse?.id,
          config: apiConfig
        }),
        signal: abortControllerRef.current.signal
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('No response stream')
      }

      let buffer = ''
      let accumulatedContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              
              if (data.error) {
                console.error('SSE error:', data.error)
                setMessages(prev => {
                  const updated = [...prev]
                  const index = updated.findIndex(m => m.id === assistantMessageId)
                  if (index !== -1) {
                    updated[index] = {
                      ...updated[index],
                      content: `Error: ${data.error}`
                    }
                  }
                  return updated
                })
                setIsStreaming(false)
                streamingMessageIdRef.current = null
                break
              }
              
              if (data.content) {
                accumulatedContent += data.content
                setCurrentStreamingContent(accumulatedContent)
                // Update message immediately with accumulated content
                setMessages(prev => {
                  const updated = [...prev]
                  const index = updated.findIndex(m => m.id === assistantMessageId)
                  if (index !== -1) {
                    updated[index] = {
                      ...updated[index],
                      content: accumulatedContent
                    }
                  }
                  return updated
                })
              }
              
              if (data.done) {
                // Final update with all accumulated content
                setMessages(prev => {
                  const updated = [...prev]
                  const index = updated.findIndex(m => m.id === assistantMessageId)
                  if (index !== -1) {
                    updated[index] = {
                      ...updated[index],
                      content: accumulatedContent
                    }
                  } else if (accumulatedContent) {
                    // If message doesn't exist, create it
                    updated.push({
                      id: assistantMessageId,
                      role: 'assistant',
                      content: accumulatedContent,
                      timestamp: new Date().toISOString()
                    })
                  }
                  return updated
                })
                
                if (currentSession && accumulatedContent) {
                  await saveMessage(currentSession.id, 'assistant', accumulatedContent)
                }
                
                if (sessionToUse && accumulatedContent) {
                  await saveMessage(sessionToUse.id, 'assistant', accumulatedContent)
                }
                
                setCurrentStreamingContent('')
                setIsStreaming(false)
                streamingMessageIdRef.current = null
              }
            } catch (e) {
              console.error('Error parsing SSE line:', e, 'Line:', line)
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return
      }

      setMessages(prev => {
        const updated = [...prev]
        const index = updated.findIndex(m => m.id === assistantMessageId)
        if (index !== -1) {
          updated[index] = {
            ...updated[index],
            content: `Error: ${error.message || 'No se pudo procesar la solicitud'}`
          }
        } else {
          updated.push({
            id: crypto.randomUUID(),
            role: 'assistant',
            content: `Error: ${error.message || 'No se pudo procesar la solicitud'}`,
            timestamp: new Date().toISOString()
          })
        }
        return updated
      })
      setIsStreaming(false)
      setCurrentStreamingContent('')
      streamingMessageIdRef.current = null
    }
  }

  useEffect(() => {
    if (isStreaming && currentStreamingContent && streamingMessageIdRef.current) {
      setMessages(prev => {
        const updated = [...prev]
        const index = updated.findIndex(m => m.id === streamingMessageIdRef.current)
        if (index !== -1) {
          updated[index] = {
            ...updated[index],
            content: currentStreamingContent
          }
        }
        return updated
      })
    }
  }, [currentStreamingContent, isStreaming])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
      const ctrlKey = isMac ? e.metaKey : e.ctrlKey

      if (ctrlKey && e.key === 'k') {
        e.preventDefault()
        handleNewSession()
      } else if (ctrlKey && e.key === '/') {
        e.preventDefault()
        setShowSettings(!showSettings)
      } else if (ctrlKey && e.key === 'h') {
        e.preventDefault()
        setShowHistory(!showHistory)
      } else if (ctrlKey && e.key === 't') {
        e.preventDefault()
        setShowTools(!showTools)
      } else if (e.key === 'Escape') {
        if (showSettings) setShowSettings(false)
        if (showTools) setShowTools(false)
        if (showHistory) setShowHistory(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showSettings, showTools, showHistory])

  const handleExport = () => {
    if (currentSession && messages.length > 0) {
      setShowExport(true)
    }
  }

  const handleClear = () => {
    if (confirm('¿Estás seguro de que deseas limpiar esta conversación?')) {
      setMessages([])
    }
  }

  const handleDelete = async () => {
    if (!currentSession) return
    if (confirm('¿Estás seguro de que deseas eliminar esta sesión?')) {
      try {
        const response = await fetch(`/api/admin/chat/history?sessionId=${currentSession.id}`, {
          method: 'DELETE'
        })
        if (response.ok) {
          await handleNewSession()
        }
      } catch (error) {
        console.error('Error deleting session:', error)
      }
    }
  }

  const sessionTitle = currentSession?.title || 'Nueva conversación'

  return (
    <div className={className || 'flex h-full min-h-0'}>
      {showHistory && (
        <ResizablePanel
          defaultWidth={historyWidth}
          minWidth={200}
          maxWidth={500}
          onWidthChange={handleHistoryWidthChange}
          className="flex-shrink-0"
        >
          <ChatHistorySidebar
            currentSessionId={currentSession?.id}
            onSessionSelect={handleSessionSelect}
            onNewSession={handleNewSession}
            onClose={() => setShowHistory(false)}
          />
        </ResizablePanel>
      )}

      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Fixed Header */}
        <div className="flex-shrink-0 z-20 bg-admin-bg-primary border-b border-admin-border-primary">
          <ChatHeader
            title={sessionTitle}
            onTitleChange={(title) => {
              if (currentSession) {
                updateSessionTitle(currentSession.id, title)
              }
            }}
            onSettingsClick={() => setShowSettings(!showSettings)}
            onHistoryClick={() => setShowHistory(!showHistory)}
            onToolsClick={() => setShowTools(!showTools)}
            onNewConversation={handleNewSession}
            onExport={handleExport}
            onClear={handleClear}
            onDelete={handleDelete}
          />
        </div>

        {/* Scrollable Messages Area */}
        <div className="flex-1 flex min-h-0 relative overflow-hidden">
          {showSettings && (
            <div className="absolute inset-y-0 right-0 w-96 border-l border-admin-border-primary z-10 bg-admin-bg-primary overflow-y-auto">
              <SettingsPanel
                config={config}
                onConfigChange={updateChatConfig}
                onClose={() => setShowSettings(false)}
              />
            </div>
          )}

          {showTools && (
            <div className="absolute inset-y-0 right-0 w-96 border-l border-admin-border-primary z-10 bg-admin-bg-primary overflow-y-auto">
              <ToolBrowser
                enabledTools={config.enabledTools}
                onToolsChange={(tools) => updateChatConfig({ enabledTools: tools })}
                onClose={() => setShowTools(false)}
              />
            </div>
          )}

          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="flex-1 overflow-y-auto min-h-0">
              <MessageList
                messages={messages}
                isStreaming={isStreaming && !currentStreamingContent}
                onMessageAction={(messageId, action) => {
                  if (action === 'copy') {
                    const message = messages.find(m => m.id === messageId)
                    if (message) {
                      navigator.clipboard.writeText(message.content)
                    }
                  } else if (action === 'delete') {
                    setMessages(prev => prev.filter(m => m.id !== messageId))
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* Fixed Input at Bottom */}
        <div className="flex-shrink-0 z-10 bg-admin-bg-primary border-t border-admin-border-primary">
          <ChatInput
            onSend={sendMessage}
            disabled={isStreaming}
          />
        </div>
      </div>

      {currentSession && (
        <ExportDialog
          open={showExport}
          onOpenChange={setShowExport}
          session={currentSession}
          messages={messages}
        />
      )}
    </div>
  )
}
