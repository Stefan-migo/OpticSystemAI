'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { MessageSquare } from 'lucide-react'
import { ChatbotContent } from './ChatbotContent'

interface ChatbotProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export default function Chatbot({ open: controlledOpen, onOpenChange: controlledOnOpenChange }: ChatbotProps = {} as ChatbotProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setIsOpen = controlledOnOpenChange || setInternalOpen

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="default"
          size="icon"
          className="fixed bottom-6 right-6 rounded-full w-14 h-14 shadow-lg z-50"
        >
          <MessageSquare className="w-6 h-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:w-[800px] p-0 flex flex-col">
        <ChatbotContent className="h-full" />
      </SheetContent>
    </Sheet>
  )
}
