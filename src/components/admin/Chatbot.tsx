"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { MessageSquare } from "lucide-react";
import { ChatbotContent } from "./ChatbotContent";
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

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="default"
          size="icon"
          className="fixed bottom-6 right-6 rounded-full w-14 h-14 shadow-lg z-50"
          title="Asistente IA"
        >
          <MessageSquare className="w-6 h-6" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-full sm:w-[800px] p-0 flex flex-col"
      >
        <ChatbotContent className="h-full" currentSection={currentSection} />
      </SheetContent>
    </Sheet>
  );
}
