'use client'

import { ChatbotContent } from '@/components/admin/ChatbotContent'

export default function ChatPage() {
  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="mb-6 flex-shrink-0">
        <h1 className="text-2xl md:text-3xl font-bold text-azul-profundo">Chatbot IA</h1>
        <p className="text-sm md:text-base text-tierra-media">
          Asistente inteligente para gestionar tu negocio
        </p>
      </div>
      <div className="flex-1 min-h-0 border border-admin-border-primary rounded-lg bg-admin-bg-primary overflow-hidden">
        <ChatbotContent className="h-full" />
      </div>
    </div>
  )
}
