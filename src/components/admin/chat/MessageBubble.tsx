'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Bot, User, Copy, Check, Edit2, Trash2, RotateCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ToolCallDisplay } from './ToolCallDisplay'

interface MessageBubbleProps {
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: string
  timestamp?: string
  toolCalls?: any
  toolResults?: any
  metadata?: any
  onCopy?: () => void
  onEdit?: () => void
  onDelete?: () => void
  onRegenerate?: () => void
}

function renderMarkdown(content: string) {
  const parts: React.ReactNode[] = []
  let currentIndex = 0

  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g
  const inlineCodeRegex = /`([^`]+)`/g
  const boldRegex = /\*\*(.+?)\*\*/g
  const italicRegex = /\*(.+?)\*/g
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g

  let lastIndex = 0
  const matches: Array<{ type: string; start: number; end: number; content: string; lang?: string }> = []

  let match
  while ((match = codeBlockRegex.exec(content)) !== null) {
    matches.push({
      type: 'codeBlock',
      start: match.index,
      end: match.index + match[0].length,
      content: match[2],
      lang: match[1]
    })
  }

  while ((match = inlineCodeRegex.exec(content)) !== null) {
    matches.push({
      type: 'inlineCode',
      start: match.index,
      end: match.index + match[0].length,
      content: match[1]
    })
  }

  while ((match = boldRegex.exec(content)) !== null) {
    matches.push({
      type: 'bold',
      start: match.index,
      end: match.index + match[0].length,
      content: match[1]
    })
  }

  while ((match = italicRegex.exec(content)) !== null) {
    matches.push({
      type: 'italic',
      start: match.index,
      end: match.index + match[0].length,
      content: match[1]
    })
  }

  while ((match = linkRegex.exec(content)) !== null) {
    matches.push({
      type: 'link',
      start: match.index,
      end: match.index + match[0].length,
      content: match[1],
      lang: match[2]
    })
  }

  matches.sort((a, b) => a.start - b.start)

  matches.forEach((match, index) => {
    if (match.start > lastIndex) {
      parts.push(
        <span key={`text-${index}`}>
          {content.substring(lastIndex, match.start).split('\n').map((line, i, arr) => (
            <span key={i}>
              {line}
              {i < arr.length - 1 && <br />}
            </span>
          ))}
        </span>
      )
    }

    if (match.type === 'codeBlock') {
      parts.push(
        <pre key={`code-${index}`} className="bg-admin-bg-primary p-3 rounded-md overflow-x-auto my-2 text-xs">
          <code>{match.content}</code>
        </pre>
      )
    } else if (match.type === 'inlineCode') {
      parts.push(
        <code key={`inline-${index}`} className="bg-admin-bg-primary px-1.5 py-0.5 rounded text-xs font-mono">
          {match.content}
        </code>
      )
    } else if (match.type === 'bold') {
      parts.push(<strong key={`bold-${index}`}>{match.content}</strong>)
    } else if (match.type === 'italic') {
      parts.push(<em key={`italic-${index}`}>{match.content}</em>)
    } else if (match.type === 'link') {
      parts.push(
        <a key={`link-${index}`} href={match.lang} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
          {match.content}
        </a>
      )
    }

    lastIndex = match.end
  })

  if (lastIndex < content.length) {
    parts.push(
      <span key="text-end">
        {content.substring(lastIndex).split('\n').map((line, i, arr) => (
          <span key={i}>
            {line}
            {i < arr.length - 1 && <br />}
          </span>
        ))}
      </span>
    )
  }

  return parts.length > 0 ? parts : <span>{content}</span>
}

export function MessageBubble({ 
  role, 
  content, 
  timestamp,
  toolCalls,
  toolResults,
  metadata,
  onCopy,
  onEdit,
  onDelete,
  onRegenerate
}: MessageBubbleProps) {
  const [copied, setCopied] = useState(false)
  const isUser = role === 'user'
  const isSystem = role === 'system'
  const isTool = role === 'tool'

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      onCopy?.()
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  if (isSystem) {
    return null
  }

  const toolCallsData = toolCalls || metadata?.toolCalls
  const toolResultsData = toolResults || metadata?.toolResults

  return (
    <div className={cn(
      'flex gap-3 mb-4 group',
      isUser ? 'justify-end' : 'justify-start'
    )}>
      {!isUser && !isTool && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-admin-accent-primary flex items-center justify-center">
          <Bot className="w-4 h-4 text-admin-text-primary" />
        </div>
      )}
      
      <div className={cn(
        'max-w-[80%] rounded-lg px-4 py-2 relative',
        isUser
          ? 'bg-admin-accent-primary text-admin-text-primary'
          : isTool
          ? 'bg-admin-bg-primary text-admin-text-secondary border border-admin-border-primary'
          : 'bg-admin-bg-secondary text-admin-text-primary'
      )}>
        <div className="text-sm whitespace-pre-wrap">
          {renderMarkdown(content)}
        </div>

        {toolCallsData && (
          <ToolCallDisplay
            toolCalls={Array.isArray(toolCallsData) ? toolCallsData : [toolCallsData]}
            toolResults={toolResultsData}
            className="mt-3"
          />
        )}

        <div className="flex items-center justify-between mt-2">
          {timestamp && (
            <p className="text-xs opacity-70">
              {new Date(timestamp).toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          )}
          
          <div className={cn(
            'flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity',
            timestamp ? 'ml-auto' : ''
          )}>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleCopy}
              title="Copiar"
            >
              {copied ? (
                <Check className="w-3 h-3" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </Button>
            
            {isUser && onEdit && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={onEdit}
                title="Editar"
              >
                <Edit2 className="w-3 h-3" />
              </Button>
            )}
            
            {!isUser && onRegenerate && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={onRegenerate}
                title="Regenerar"
              >
                <RotateCw className="w-3 h-3" />
              </Button>
            )}
            
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-destructive hover:text-destructive"
                onClick={onDelete}
                title="Eliminar"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-admin-accent-secondary flex items-center justify-center">
          <User className="w-4 h-4 text-admin-text-primary" />
        </div>
      )}
    </div>
  )
}
