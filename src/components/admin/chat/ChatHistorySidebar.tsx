'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Trash2, 
  Plus, 
  Search, 
  MessageSquare,
  Clock,
  Loader2,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChatSession {
  id: string
  title: string | null
  provider: string
  model: string | null
  created_at: string
  updated_at: string
  last_message_preview?: string | null
  message_count?: number | null
}

interface ChatHistorySidebarProps {
  currentSessionId?: string | null
  onSessionSelect: (sessionId: string) => void
  onNewSession: () => void
  onClose?: () => void
  className?: string
}

export function ChatHistorySidebar({
  currentSessionId,
  onSessionSelect,
  onNewSession,
  onClose,
  className
}: ChatHistorySidebarProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [filteredSessions, setFilteredSessions] = useState<ChatSession[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    loadSessions()
  }, [])

  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      setFilteredSessions(
        sessions.filter(session => 
          session.title?.toLowerCase().includes(query) ||
          session.last_message_preview?.toLowerCase().includes(query)
        )
      )
    } else {
      setFilteredSessions(sessions)
    }
  }, [searchQuery, sessions])

  const loadSessions = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/chat/history?limit=50')
      if (response.ok) {
        const data = await response.json()
        setSessions(data.sessions || [])
      }
    } catch (error) {
      console.error('Error loading sessions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (!confirm('¿Estás seguro de que deseas eliminar esta conversación?')) {
      return
    }

    try {
      setDeletingId(sessionId)
      const response = await fetch(`/api/admin/chat/history?sessionId=${sessionId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setSessions(prev => prev.filter(s => s.id !== sessionId))
        if (currentSessionId === sessionId) {
          onNewSession()
        }
      }
    } catch (error) {
      console.error('Error deleting session:', error)
    } finally {
      setDeletingId(null)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Ahora'
    if (diffMins < 60) return `Hace ${diffMins}m`
    if (diffHours < 24) return `Hace ${diffHours}h`
    if (diffDays < 7) return `Hace ${diffDays}d`
    
    return date.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'short' 
    })
  }

  const getSessionTitle = (session: ChatSession) => {
    return session.title || 'Nueva conversación'
  }

  return (
    <div className={cn('flex flex-col h-full border-r border-admin-border-primary bg-admin-bg-secondary', className)}>
      <div className="p-4 border-b border-admin-border-primary">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-admin-text-primary">Historial</h3>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-7 w-7"
              title="Cerrar historial"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={onNewSession}
            size="sm"
            className="flex-1"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nueva conversación
          </Button>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-admin-text-secondary" />
          <Input
            placeholder="Buscar conversaciones..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            variant="outline"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-5 h-5 animate-spin text-admin-text-secondary" />
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <MessageSquare className="w-12 h-12 text-admin-text-secondary mb-3 opacity-50" />
            <p className="text-sm text-admin-text-secondary">
              {searchQuery ? 'No se encontraron conversaciones' : 'No hay conversaciones'}
            </p>
            {!searchQuery && (
              <Button
                onClick={onNewSession}
                variant="ghost"
                size="sm"
                className="mt-3"
              >
                Crear primera conversación
              </Button>
            )}
          </div>
        ) : (
          <div className="p-2">
            {filteredSessions.map((session) => (
              <div
                key={session.id}
                onClick={() => onSessionSelect(session.id)}
                className={cn(
                  'group relative p-3 rounded-lg cursor-pointer transition-colors mb-1',
                  'hover:bg-admin-bg-hover',
                  currentSessionId === session.id && 'bg-admin-bg-hover border border-admin-border-primary'
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-admin-text-primary truncate">
                      {getSessionTitle(session)}
                    </h3>
                    {session.last_message_preview && (
                      <p className="text-xs text-admin-text-secondary mt-1 line-clamp-2">
                        {session.last_message_preview}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2 text-xs text-admin-text-secondary">
                      <Clock className="w-3 h-3" />
                      <span>{formatDate(session.updated_at)}</span>
                      {session.message_count !== null && session.message_count !== undefined && (
                        <>
                          <span>•</span>
                          <span>{session.message_count} mensajes</span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      'h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity',
                      'hover:bg-admin-bg-hover hover:text-destructive'
                    )}
                    onClick={(e) => handleDelete(session.id, e)}
                    disabled={deletingId === session.id}
                  >
                    {deletingId === session.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
