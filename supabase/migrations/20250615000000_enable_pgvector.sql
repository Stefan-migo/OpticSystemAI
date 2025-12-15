-- Enable pgvector extension for semantic search
-- This migration enables vector similarity search in PostgreSQL

-- Enable the pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add comment for documentation
COMMENT ON EXTENSION vector IS 'Vector similarity search extension for semantic memory and RAG';
