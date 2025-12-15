import type { 
  LLMProvider,
  LLMProviderInterface, 
  LLMMessage, 
  LLMTool, 
  LLMConfig,
  LLMModel,
  LLMResponse,
  LLMStreamChunk
} from '../types'

export abstract class BaseLLMProvider implements LLMProviderInterface {
  abstract name: LLMProvider
  
  abstract streamText(
    messages: LLMMessage[],
    tools?: LLMTool[],
    config?: Partial<LLMConfig>
  ): AsyncGenerator<LLMStreamChunk>
  
  abstract generateText(
    messages: LLMMessage[],
    tools?: LLMTool[],
    config?: Partial<LLMConfig>
  ): Promise<LLMResponse>
  
  abstract getAvailableModels(): LLMModel[]
  
  abstract validateConfig(config: LLMConfig): boolean
  
  protected validateApiKey(apiKey: string | undefined): boolean {
    return !!apiKey && apiKey.length > 0
  }
  
  protected formatMessages(messages: LLMMessage[]): any[] {
    return messages.map(msg => ({
      role: msg.role,
      content: msg.content,
      ...(msg.name && { name: msg.name }),
      ...(msg.toolCallId && { tool_call_id: msg.toolCallId })
    }))
  }
}
