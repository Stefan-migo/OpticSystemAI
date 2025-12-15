import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createAgent } from '@/lib/ai/agent/core'
import { LLMFactory } from '@/lib/ai/factory'
import type { LLMProvider } from '@/lib/ai/types'


export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: isAdmin } = await supabase.rpc('is_admin', { user_id: user.id })
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { 
      message, 
      provider, 
      model,
      sessionId,
      config 
    } = body

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    let currentSessionId = sessionId
    let sessionTitle: string | null = null

    if (!currentSessionId) {
      // Default to DeepSeek which has more generous rate limits
      const providerToUse = provider || 'deepseek'
      const modelToUse = model || (providerToUse === 'deepseek' ? 'deepseek-chat' : 'gemini-2.5-flash')
      
      const sessionResponse = await fetch(`${request.nextUrl.origin}/api/admin/chat/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': request.headers.get('cookie') || ''
        },
        body: JSON.stringify({
          provider: providerToUse,
          model: modelToUse,
          title: null,
          config: config || null
        })
      })

      if (sessionResponse.ok) {
        const sessionData = await sessionResponse.json()
        currentSessionId = sessionData.session.id
      }
    }

    // Note: Agent is created inside tryWithProvider, not here
    // This prevents creating unused agents

    if (currentSessionId && !sessionTitle) {
      const firstWords = message.split(' ').slice(0, 5).join(' ')
      sessionTitle = firstWords.length > 50 ? firstWords.substring(0, 50) + '...' : firstWords
      
      await fetch(`${request.nextUrl.origin}/api/admin/chat/sessions`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': request.headers.get('cookie') || ''
        },
        body: JSON.stringify({
          sessionId: currentSessionId,
          title: sessionTitle
        })
      })
    }

    const { createServiceRoleClient } = await import('@/utils/supabase/server')
    const serviceSupabase = createServiceRoleClient()

    if (currentSessionId) {
      await serviceSupabase.from('chat_messages').insert({
        session_id: currentSessionId,
        role: 'user',
        content: message
      })
    }

    let assistantContent = ''
    const toolCalls: any[] = []

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()
        
        const tryWithProvider = async (providerToTry: LLMProvider | undefined, modelToTry: string | undefined) => {
          let providerContent = ''
          let providerToolCalls: any[] = []
          
          try {
            const fallbackAgent = await createAgent({
              userId: user.id,
              provider: providerToTry,
              model: modelToTry,
              sessionId: currentSessionId,
              config: config
            })

            // Load session history if we have a session ID
            // This gives the agent memory of previous conversation turns
            if (currentSessionId) {
              await fallbackAgent.loadSessionHistory(currentSessionId)
              console.log('Session history loaded for agent')
            }

            for await (const chunk of fallbackAgent.streamChat(message)) {
              if (chunk.content) {
                providerContent += chunk.content
                assistantContent += chunk.content
                const data = JSON.stringify({ content: chunk.content, done: false })
                controller.enqueue(encoder.encode(`data: ${data}\n\n`))
              }
              
              if (chunk.toolCalls) {
                providerToolCalls.push(...chunk.toolCalls)
                toolCalls.push(...chunk.toolCalls)
              }
              
              if (chunk.done) {
                console.log('Stream done, final content length:', providerContent.length)
                if (currentSessionId && providerContent) {
                  await serviceSupabase.from('chat_messages').insert({
                    session_id: currentSessionId,
                    role: 'assistant',
                    content: providerContent,
                    metadata: providerToolCalls.length > 0 ? { toolCalls: providerToolCalls } : null
                  })
                }
                
                const data = JSON.stringify({ 
                  done: true, 
                  sessionId: currentSessionId 
                })
                controller.enqueue(encoder.encode(`data: ${data}\n\n`))
                controller.close()
                return true // Success
              }
            }
            return true
          } catch (error: any) {
            console.error(`Error with provider ${providerToTry}:`, error)
            
            // Check if it's a rate limit error - don't retry in this case
            const errorMessage = error.message || error.toString()
            const isRateLimit = errorMessage.includes('Too Many Requests') || 
                               errorMessage.includes('429') ||
                               errorMessage.includes('rate limit') ||
                               errorMessage.includes('RATE_LIMIT')
            
            if (isRateLimit) {
              // For rate limit errors, throw immediately to prevent fallback
              throw error
            }
            
            // Reset content for next attempt (only for non-rate-limit errors)
            assistantContent = ''
            toolCalls.length = 0
            return false // Failed
          }
        }
        
        try {
          // Try with primary provider first
          const success = await tryWithProvider(provider as LLMProvider | undefined, model)
          
          // If failed and provider is not already deepseek, try with deepseek
          // BUT only if it's not a rate limit error
          if (!success && provider !== 'deepseek') {
            const errorMessage = assistantContent || ''
            const isRateLimit = errorMessage.includes('Too Many Requests') || 
                               errorMessage.includes('429') ||
                               errorMessage.includes('rate limit')
            
            if (!isRateLimit) {
              console.log('Primary provider failed, attempting fallback to DeepSeek...')
              const fallbackMessage = JSON.stringify({ 
                content: '\n\n⚠️ El proveedor principal falló. Intentando con DeepSeek...\n\n', 
                done: false 
              })
              controller.enqueue(encoder.encode(`data: ${fallbackMessage}\n\n`))
              
              const fallbackSuccess = await tryWithProvider('deepseek', 'deepseek-chat')
              
              if (!fallbackSuccess) {
                const errorData = JSON.stringify({ 
                  error: 'Todos los proveedores fallaron. Por favor, verifica tus API keys.' 
                })
                controller.enqueue(encoder.encode(`data: ${errorData}\n\n`))
                controller.close()
              }
            } else {
              // Rate limit error - don't retry, just show the error
              const errorData = JSON.stringify({ 
                error: 'Límite de solicitudes excedido. Por favor, espera unos momentos antes de intentar de nuevo.' 
              })
              controller.enqueue(encoder.encode(`data: ${errorData}\n\n`))
              controller.close()
            }
          } else if (!success) {
            // If primary provider failed and we're already on deepseek, just show error
            const errorData = JSON.stringify({ 
              error: 'Error procesando la solicitud. Por favor, verifica tus API keys.' 
            })
            controller.enqueue(encoder.encode(`data: ${errorData}\n\n`))
            controller.close()
          }
        } catch (error: any) {
          console.error('Stream error:', error)
          const errorMessage = error.message || 'An error occurred'
          const isRateLimit = errorMessage.includes('Too Many Requests') || 
                             errorMessage.includes('429') ||
                             errorMessage.includes('rate limit')
          
          const errorData = JSON.stringify({ 
            error: isRateLimit 
              ? 'Límite de solicitudes excedido. Por favor, espera unos momentos antes de intentar de nuevo.'
              : errorMessage
          })
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`))
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    })
  } catch (error: any) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: isAdmin } = await supabase.rpc('is_admin', { user_id: user.id })
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const factory = LLMFactory.getInstance()
    const availableProviders = factory.getAvailableProviders()

    return NextResponse.json({
      providers: availableProviders.map(provider => ({
        id: provider,
        name: provider,
        enabled: factory.isProviderEnabled(provider)
      }))
    })
  } catch (error: any) {
    console.error('Providers API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
