/**
 * Embeddings Module
 * 
 * Provides embedding generation with multiple providers and automatic fallback.
 */

// Types
export * from './types'

// Providers
export { GoogleEmbeddingProvider } from './google'
export { TransformersEmbeddingProvider } from './transformers'

// Factory
export { EmbeddingFactory, getEmbeddingFactory } from './factory'
