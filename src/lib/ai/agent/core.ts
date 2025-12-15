import { LLMFactory } from '../factory'
import { getAllTools, convertToolsToLLMTools } from '../tools'
import { ToolExecutor } from './tool-executor'
import { getAgentConfig } from './config'
import type { LLMProvider, LLMMessage, LLMTool, LLMStreamChunk, ToolCall } from '../types'
import type { ToolExecutionContext } from '../tools/types'
import type { MemoryManager } from '../memory'

export interface AgentConfig {
  systemPrompt?: string
  maxSteps?: number
  temperature?: number
  maxTokens?: number
  enableToolCalling?: boolean
  enabledTools?: string[]
  requireConfirmationForDestructiveActions?: boolean
  enableSemanticContext?: boolean // Enable RAG context injection
}

export interface AgentOptions {
  userId: string
  provider?: LLMProvider
  model?: string
  context?: string
  sessionId?: string
  config?: AgentConfig
}

export class Agent {
  private userId: string
  private provider: LLMProvider | undefined
  private model: string | undefined
  private context: string | undefined
  private sessionId: string | undefined
  private customConfig: AgentConfig | undefined
  private messages: LLMMessage[] = []
  private toolExecutor: ToolExecutor | null = null
  private memoryManager: MemoryManager | null = null
  
  constructor(options: AgentOptions) {
    this.userId = options.userId
    this.provider = options.provider
    this.model = options.model
    this.context = options.context
    this.sessionId = options.sessionId
    this.customConfig = options.config
  }
  
  /**
   * Initialize the memory manager for semantic context injection
   */
  private async initializeMemoryManager(): Promise<MemoryManager | null> {
    if (this.memoryManager) {
      return this.memoryManager
    }
    
    try {
      const { createServiceRoleClient } = await import('@/utils/supabase/server')
      const { createMemoryManager } = await import('../memory')
      
      const supabase = createServiceRoleClient()
      
      this.memoryManager = createMemoryManager({
        userId: this.userId,
        sessionId: this.sessionId,
        supabase
      }, {
        enableSemanticSearch: true,
        enableLongTermMemory: true,
        semanticSearchCount: 5,
        maxContextLength: 3000
      })
      
      return this.memoryManager
    } catch (error) {
      console.error('Failed to initialize memory manager:', error)
      return null
    }
  }
  
  /**
   * Get the memory manager instance
   */
  getMemoryManager(): MemoryManager | null {
    return this.memoryManager
  }
  
  private async initializeToolExecutor() {
    if (!this.toolExecutor) {
      const { createServiceRoleClient } = await import('@/utils/supabase/server')
      const supabase = createServiceRoleClient()
      const context: ToolExecutionContext = {
        userId: this.userId,
        supabase
      }
      this.toolExecutor = new ToolExecutor(context)
    }
    return this.toolExecutor
  }
  
  /**
   * Load conversation history from database for session continuity
   * This allows the agent to remember previous messages in the conversation
   */
  async loadSessionHistory(sessionId: string, limit: number = 50): Promise<void> {
    try {
      const { createServiceRoleClient } = await import('@/utils/supabase/server')
      const supabase = createServiceRoleClient()
      
      const { data: messages, error } = await supabase
        .from('chat_messages')
        .select('role, content, tool_calls, metadata, created_at')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })
        .limit(limit)
      
      if (error) {
        console.error('Error loading session history:', error)
        return
      }
      
      if (!messages || messages.length === 0) {
        console.log('No previous messages found for session:', sessionId)
        return
      }
      
      console.log(`Loading ${messages.length} messages from session history`)
      
      // Get the system prompt from config
      const baseConfig = getAgentConfig(this.context)
      const systemPrompt = this.customConfig?.systemPrompt ?? baseConfig.systemPrompt
      
      // Initialize messages array with system prompt
      this.messages = [{
        role: 'system',
        content: systemPrompt
      }]
      
      // Add historical messages
      for (const msg of messages) {
        // Skip system messages as we already added our own
        if (msg.role === 'system') continue
        
        const llmMessage: LLMMessage = {
          role: msg.role as 'user' | 'assistant' | 'tool',
          content: msg.content || ''
        }
        
        // Restore tool calls if present
        if (msg.tool_calls) {
          llmMessage.toolCalls = msg.tool_calls
        }
        
        // Handle metadata that might contain tool calls
        if (msg.metadata?.toolCalls) {
          llmMessage.toolCalls = msg.metadata.toolCalls
        }
        
        this.messages.push(llmMessage)
      }
      
      console.log(`Session history loaded: ${this.messages.length} total messages (including system prompt)`)
    } catch (error) {
      console.error('Failed to load session history:', error)
    }
  }
  
  /**
   * Check if history has been loaded
   */
  hasLoadedHistory(): boolean {
    return this.messages.length > 1 // More than just system prompt
  }
  
  async *streamChat(userMessage: string): AsyncGenerator<LLMStreamChunk> {
    try {
      const executor = await this.initializeToolExecutor()
      const baseConfig = getAgentConfig(this.context)
      const config = {
        systemPrompt: this.customConfig?.systemPrompt ?? baseConfig.systemPrompt,
        maxSteps: this.customConfig?.maxSteps ?? baseConfig.maxSteps,
        temperature: this.customConfig?.temperature ?? baseConfig.temperature,
        maxTokens: this.customConfig?.maxTokens,
        enableToolCalling: this.customConfig?.enableToolCalling ?? baseConfig.enableToolCalling,
        requireConfirmationForDestructiveActions: this.customConfig?.requireConfirmationForDestructiveActions ?? baseConfig.requireConfirmationForDestructiveActions
      }
      
      const factory = LLMFactory.getInstance()
      
      let providerInstance
      let llmConfig
      
      try {
        const result = await factory.createProviderWithFallback(this.provider)
        providerInstance = result.provider
        llmConfig = {
          ...result.config,
          model: this.model || result.config.model,
          temperature: config.temperature,
          maxTokens: config.maxTokens
        }
      } catch (error: any) {
        yield {
          content: `Error: No hay proveedores de IA configurados. Por favor, configura al menos un proveedor en las variables de entorno.`,
          done: true
        }
        return
      }
      
      let tools = getAllTools()
      if (this.customConfig?.enabledTools && this.customConfig.enabledTools.length > 0) {
        tools = tools.filter(tool => this.customConfig!.enabledTools!.includes(tool.name))
      }
      const llmTools = config.enableToolCalling ? convertToolsToLLMTools(tools) : undefined
      
      // Get semantic context if enabled
      // NOTE: Disabled by default until migrations are run and embeddings table exists
      let semanticContext = ''
      const enableSemanticContext = this.customConfig?.enableSemanticContext ?? false
      
      if (enableSemanticContext) {
        try {
          const memoryManager = await this.initializeMemoryManager()
          if (memoryManager) {
            const context = await memoryManager.getRelevantContext(userMessage)
            semanticContext = context.formattedContext
            if (semanticContext) {
              console.log('Semantic context loaded, length:', semanticContext.length)
            }
          }
        } catch (error) {
          console.error('Failed to load semantic context:', error)
        }
      }
      
      // Build enhanced system prompt with semantic context
      let enhancedSystemPrompt = config.systemPrompt
      if (semanticContext) {
        enhancedSystemPrompt = `${config.systemPrompt}\n\n${semanticContext}`
      }
      
      // Only add system prompt if messages array is empty
      // (if loadSessionHistory was called, it already added the system prompt)
      if (this.messages.length === 0) {
        this.messages.push({
          role: 'system',
          content: enhancedSystemPrompt
        })
      } else if (semanticContext && this.messages[0]?.role === 'system') {
        // Update existing system prompt with semantic context
        this.messages[0].content = enhancedSystemPrompt
      }
      
      // Check if the last message is already this user message (avoid duplicates)
      const lastMessage = this.messages[this.messages.length - 1]
      const isUserMessageDuplicate = lastMessage?.role === 'user' && lastMessage?.content === userMessage
      
      if (!isUserMessageDuplicate) {
        this.messages.push({
          role: 'user',
          content: userMessage
        })
      }
      
      let stepCount = 0
      let fullResponse = ''
      
      while (stepCount < config.maxSteps) {
        try {
          const stream = providerInstance.streamText(this.messages, llmTools, llmConfig)
          
          let assistantMessage = ''
          const collectedToolCallsMap = new Map<string, ToolCall>()
          
          for await (const chunk of stream) {
            if (chunk.content) {
              assistantMessage += chunk.content
              yield chunk
            }
            if (chunk.toolCalls && chunk.toolCalls.length > 0) {
              console.log('Agent received tool calls from stream:', chunk.toolCalls.map(tc => ({ name: tc.name, id: tc.id })))
              // Accumulate tool calls by ID to handle incremental updates
              for (const tc of chunk.toolCalls) {
                if (tc.name && tc.name.trim()) {
                  const toolId = tc.id || `generated-${Date.now()}-${collectedToolCallsMap.size}`
                  // If we already have this tool call, merge arguments
                  if (collectedToolCallsMap.has(toolId)) {
                    const existing = collectedToolCallsMap.get(toolId)!
                    // Merge arguments (prefer new ones if they're more complete)
                    if (tc.arguments && typeof tc.arguments === 'object' && Object.keys(tc.arguments).length > 0) {
                      existing.arguments = { ...existing.arguments, ...tc.arguments }
                    }
                  } else {
                    collectedToolCallsMap.set(toolId, {
                      id: toolId,
                      name: tc.name.trim(),
                      arguments: tc.arguments || {}
                    })
                  }
                }
              }
            }
            if (chunk.done) break
          }
          
          // Convert map to array
          const collectedToolCalls = Array.from(collectedToolCallsMap.values())
          
          console.log('Agent step', stepCount, '- collected tool calls:', collectedToolCalls.length, 
            collectedToolCalls.map(tc => ({ name: tc.name, args: tc.arguments })))
          console.log('Agent step', stepCount, '- assistant message length:', assistantMessage.length)
          
          fullResponse += assistantMessage
          
          // Add assistant message with tool calls if any
          if (assistantMessage.trim() || collectedToolCalls.length > 0) {
            const assistantMsg: LLMMessage = {
              role: 'assistant',
              content: assistantMessage || ''
            }
            
            // Add tool calls to the message if available
            if (collectedToolCalls.length > 0) {
              assistantMsg.toolCalls = collectedToolCalls
            }
            
            this.messages.push(assistantMsg)
          }
          
          if (collectedToolCalls.length === 0 || !config.enableToolCalling) {
            break
          }
          
          for (const toolCall of collectedToolCalls) {
            try {
              // Validate tool call name
              if (!toolCall.name || !toolCall.name.trim()) {
                const errorMsg = `Error: Nombre de herramienta inválido o vacío`
                yield {
                  content: `\n\n❌ ${errorMsg}`,
                  done: false
                }
                continue
              }
              
              const toolName = toolCall.name.trim()
              
              yield {
                content: `\n\n[Ejecutando ${toolName}...]`,
                done: false
              }
              
              // Log tool call details for debugging
              console.log('=== TOOL EXECUTION DEBUG ===')
              console.log('Tool name:', toolName)
              console.log('Tool arguments:', JSON.stringify(toolCall.arguments, null, 2))
              console.log('Arguments type:', typeof toolCall.arguments)
              console.log('Arguments keys:', toolCall.arguments ? Object.keys(toolCall.arguments) : [])
              console.log('Arguments values:', toolCall.arguments ? Object.values(toolCall.arguments) : [])
              console.log('===========================')
              
              const validation = executor.validateToolCall(toolName, toolCall.arguments)
              if (!validation.valid) {
                const errorMsg = `Error validando herramienta: ${validation.error}`
                console.error('Tool validation failed:', { toolName, arguments: toolCall.arguments, error: validation.error })
                this.messages.push({
                  role: 'tool',
                  content: errorMsg,
                  toolCallId: toolCall.id,
                  name: toolName
                })
                yield {
                  content: `\n\n❌ ${errorMsg}`,
                  done: false
                }
                continue
              }
              
              if (executor.requiresConfirmation(toolName) && config.requireConfirmationForDestructiveActions) {
                yield {
                  content: `\n\n⚠️ Esta acción requiere confirmación. Ejecutando de todas formas...`,
                  done: false
                }
              }
              
              const result = await executor.executeTool(toolName, toolCall.arguments)
              
              const toolResultMessage = result.success
                ? JSON.stringify(result.data || result.message || 'Success')
                : `Error: ${result.error || 'Unknown error'}`
              
              this.messages.push({
                role: 'tool',
                content: toolResultMessage,
                toolCallId: toolCall.id,
                name: toolName
              })
              
              if (result.success) {
                // Show success message with details if available
                const successMsg = result.message || `${toolName} completado exitosamente`
                yield {
                  content: `\n\n✅ ${successMsg}`,
                  done: false
                }
                // If there's data, show a summary
                if (result.data) {
                  try {
                    const dataStr = typeof result.data === 'string' 
                      ? result.data 
                      : JSON.stringify(result.data)
                    if (dataStr.length < 200) {
                      yield {
                        content: `\n\n📋 Resultado: ${dataStr}`,
                        done: false
                      }
                    }
                  } catch (e) {
                    // Ignore JSON stringify errors
                  }
                }
              } else {
                // Show error message
                yield {
                  content: `\n\n❌ Error en ${toolName}: ${result.error || 'Error desconocido'}`,
                  done: false
                }
              }
            } catch (toolError: any) {
              const toolName = toolCall.name?.trim() || 'herramienta desconocida'
              const errorMsg = `Error ejecutando ${toolName}: ${toolError.message}`
              this.messages.push({
                role: 'tool',
                content: errorMsg,
                toolCallId: toolCall.id,
                name: toolName
              })
              yield {
                content: `\n\n❌ ${errorMsg}`,
                done: false
              }
            }
          }
          
          stepCount++
        } catch (streamError: any) {
          console.error('Stream error in agent:', streamError)
          const errorMessage = streamError.message || 'Error procesando la solicitud'
          yield {
            content: `\n\n❌ Error: ${errorMessage}`,
            done: false
          }
          // Don't break immediately, let the error propagate so fallback can catch it
          throw streamError
        }
      }
      
      yield { content: '', done: true }
    } catch (error: any) {
      yield {
        content: `Error: ${error.message || 'Error desconocido'}`,
        done: true
      }
    }
  }
  
  async chat(userMessage: string): Promise<string> {
    let fullResponse = ''
    for await (const chunk of this.streamChat(userMessage)) {
      if (chunk.content) {
        fullResponse += chunk.content
      }
    }
    return fullResponse
  }
  
  
  getMessages(): LLMMessage[] {
    return [...this.messages]
  }
  
  clearMessages() {
    this.messages = []
  }
  
  addMessage(role: LLMMessage['role'], content: string) {
    this.messages.push({ role, content })
  }
}

export async function createAgent(options: AgentOptions): Promise<Agent> {
  return new Agent(options)
}
