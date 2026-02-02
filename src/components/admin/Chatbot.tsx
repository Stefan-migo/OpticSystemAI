"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { MessageSquare, X } from "lucide-react";
import { ChatbotContent } from "./ChatbotContent";
import { cn } from "@/lib/utils";
import type { InsightSection } from "@/lib/ai/insights/schemas";

interface ChatbotProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

// Map pathname to section
function getSectionFromPathname(pathname: string): InsightSection | null {
  if (pathname === "/admin" || pathname === "/admin/") return "dashboard";
  if (pathname.startsWith("/admin/pos")) return "pos";
  if (pathname.startsWith("/admin/products")) return "inventory";
  if (pathname.startsWith("/admin/customers")) return "clients";
  if (pathname.startsWith("/admin/analytics")) return "analytics";
  return null;
}

export default function Chatbot(
  {
    open: controlledOpen,
    onOpenChange: controlledOnOpenChange,
  }: ChatbotProps = {} as ChatbotProps,
) {
  const [internalOpen, setInternalOpen] = useState(false);
  const pathname = usePathname();
  const currentSection = getSectionFromPathname(pathname);

  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setIsOpen = controlledOnOpenChange || setInternalOpen;

  // Close on Escape key
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [setIsOpen]);

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end justify-end w-fit">
      {/* Chat Window - absolute so it doesn't expand parent and block clicks on right side */}
      <div
        className={cn(
          "absolute right-0 bottom-full mb-2 w-[90vw] sm:w-[400px] h-[600px] max-h-[80vh] bg-white dark:bg-slate-950 rounded-2xl shadow-2xl border border-border overflow-hidden flex flex-col transition-all duration-300 origin-bottom-right",
          isOpen
            ? "scale-100 opacity-100 translate-y-0 pointer-events-auto"
            : "scale-95 opacity-0 translate-y-4 pointer-events-none invisible",
        )}
      >
        <ChatbotContent
          className="h-full"
          currentSection={currentSection}
          onClose={() => setIsOpen(false)}
        />
      </div>

      {/* Trigger Bubble */}
      <Button
        variant="default"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "rounded-full w-14 h-14 shadow-xl transition-all duration-300 hover:scale-110 active:scale-95",
          isOpen
            ? "bg-slate-200 dark:bg-slate-800 text-slate-600 rotate-90"
            : "bg-primary text-primary-foreground",
        )}
        title="Asistente IA"
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <MessageSquare className="w-6 h-6" />
        )}
      </Button>
    </div>
  );
}
