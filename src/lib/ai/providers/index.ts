import { OpenAIProvider } from './openai'
import { AnthropicProvider } from './anthropic'
import { GoogleProvider } from './google'
import { DeepSeekProvider } from './deepseek'
import type { LLMProviderInterface, LLMProvider } from '../types'

export const providers: Record<LLMProvider, () => LLMProviderInterface> = {
  openai: () => new OpenAIProvider(),
  anthropic: () => new AnthropicProvider(),
  google: () => new GoogleProvider(),
  deepseek: () => new DeepSeekProvider(),
  custom: () => {
    throw new Error('Custom provider not implemented')
  }
}

export function getProvider(provider: LLMProvider): LLMProviderInterface {
  const factory = providers[provider]
  if (!factory) {
    throw new Error(`Provider ${provider} not found`)
  }
  return factory()
}

export function getAvailableProviders(): LLMProvider[] {
  return Object.keys(providers).filter(p => p !== 'custom') as LLMProvider[]
}
