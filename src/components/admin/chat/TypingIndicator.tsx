'use client'

import { Bot } from 'lucide-react'

export function TypingIndicator() {
  return (
    <div className="flex gap-3 mb-4">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-admin-accent-primary flex items-center justify-center">
        <Bot className="w-4 h-4 text-admin-text-primary" />
      </div>
      
      <div className="bg-admin-bg-secondary rounded-lg px-4 py-2">
        <div className="flex gap-1">
          <div className="w-2 h-2 bg-admin-text-secondary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-admin-text-secondary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-admin-text-secondary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  )
}
