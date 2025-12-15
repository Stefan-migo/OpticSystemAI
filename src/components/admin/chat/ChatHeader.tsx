'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Settings, 
  History, 
  Wrench, 
  MoreVertical,
  Download,
  Trash2,
  Copy,
  Plus,
  Edit2
} from 'lucide-react'

interface ChatHeaderProps {
  title: string
  onTitleChange: (title: string) => void
  onSettingsClick: () => void
  onHistoryClick: () => void
  onToolsClick: () => void
  onNewConversation: () => void
  onExport: () => void
  onClear: () => void
  onDelete: () => void
  onDuplicate?: () => void
}

export function ChatHeader({
  title,
  onTitleChange,
  onSettingsClick,
  onHistoryClick,
  onToolsClick,
  onNewConversation,
  onExport,
  onClear,
  onDelete,
  onDuplicate
}: ChatHeaderProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(title)

  const handleTitleSubmit = () => {
    if (editTitle.trim()) {
      onTitleChange(editTitle.trim())
    }
    setIsEditing(false)
  }

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSubmit()
    } else if (e.key === 'Escape') {
      setEditTitle(title)
      setIsEditing(false)
    }
  }

  return (
    <div className="flex items-center justify-between p-4 bg-admin-bg-primary">
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <Input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleTitleSubmit}
            onKeyDown={handleTitleKeyDown}
            className="h-8 text-sm font-medium"
            autoFocus
          />
        ) : (
          <h1
            className="text-lg font-semibold text-admin-text-primary truncate cursor-pointer hover:opacity-70 flex items-center gap-2"
            onClick={() => setIsEditing(true)}
            title="Click para editar"
          >
            {title || 'Nueva conversación'}
            <Edit2 className="w-3 h-3 opacity-50" />
          </h1>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onHistoryClick}
          title="Historial (Ctrl+H)"
        >
          <History className="w-4 h-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={onToolsClick}
          title="Herramientas (Ctrl+T)"
        >
          <Wrench className="w-4 h-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={onSettingsClick}
          title="Configuración (Ctrl+/)"
        >
          <Settings className="w-4 h-4" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" title="Más opciones">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onNewConversation}>
              <Plus className="w-4 h-4 mr-2" />
              Nueva conversación
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onExport}>
              <Download className="w-4 h-4 mr-2" />
              Exportar conversación
            </DropdownMenuItem>
            {onDuplicate && (
              <DropdownMenuItem onClick={onDuplicate}>
                <Copy className="w-4 h-4 mr-2" />
                Duplicar sesión
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onClear}>
              Limpiar conversación
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} className="text-destructive">
              <Trash2 className="w-4 h-4 mr-2" />
              Eliminar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
