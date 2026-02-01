"use client";

import { useState, KeyboardEvent, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSend,
  disabled,
  placeholder = "Pregunta sobre Opttius...",
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  return (
    <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
      <div className="flex items-end gap-3 bg-slate-50 dark:bg-slate-800/50 rounded-[28px] p-2 pl-4 border border-slate-200 dark:border-slate-700 focus-within:border-primary/30 focus-within:ring-4 focus-within:ring-primary/5 transition-all">
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className="resize-none min-h-[40px] max-h-32 bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-0 py-2.5 text-sm"
        />
        <Button
          onClick={handleSend}
          disabled={disabled || !message.trim()}
          size="icon"
          className="shrink-0 rounded-full w-10 h-10 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-transform active:scale-90"
        >
          <Send className="w-5 h-5 text-white" />
        </Button>
      </div>
      <div className="flex items-center justify-between px-2 mt-2">
        <p className="text-[10px] text-slate-400 font-medium">
          Shift+Enter para nueva línea
        </p>
        <div className="flex items-center gap-1 text-[10px] text-primary/60 font-medium">
          <Sparkles className="w-3 h-3" />
          Powered by Opttius IA
        </div>
      </div>
    </div>
  );
}
