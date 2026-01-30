"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface TourOverlayProps {
  selector: string;
  isActive: boolean;
  children: React.ReactNode;
}

export function TourOverlay({
  selector,
  isActive,
  children,
}: TourOverlayProps) {
  const [elementBounds, setElementBounds] = useState<DOMRect | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isActive || !mounted) {
      setElementBounds(null);
      return;
    }

    let cleanup: (() => void) | null = null;
    let timeoutId: NodeJS.Timeout | null = null;

    // Función para actualizar bounds
    const updateBounds = () => {
      const element = document.querySelector(selector);
      if (element) {
        const rect = element.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          setElementBounds(rect);
        }
      }
    };

    // Función para buscar el elemento con múltiples intentos
    let attempts = 0;
    const maxAttempts = 10;

    const tryFind = () => {
      attempts++;
      const element = document.querySelector(selector);

      if (element) {
        const rect = element.getBoundingClientRect();
        // Verificar que el elemento sea visible
        if (rect.width > 0 && rect.height > 0) {
          setElementBounds(rect);

          // Configurar listeners para actualizar bounds
          window.addEventListener("scroll", updateBounds, true);
          window.addEventListener("resize", updateBounds);

          const observer = new MutationObserver(updateBounds);
          observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ["style", "class"],
          });

          cleanup = () => {
            window.removeEventListener("scroll", updateBounds, true);
            window.removeEventListener("resize", updateBounds);
            observer.disconnect();
          };
          return;
        }
      }

      if (attempts < maxAttempts) {
        timeoutId = setTimeout(tryFind, 200);
      } else {
        // Solo loguear una vez para evitar spam
        if (attempts === maxAttempts) {
          // Silenciar logs en producción - el tour funcionará sin el elemento
        }
        setElementBounds(null);
      }
    };

    // Esperar un poco antes de empezar a buscar
    timeoutId = setTimeout(tryFind, 100);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (cleanup) cleanup();
    };
  }, [selector, isActive, mounted]);

  if (!isActive || !mounted) return null;

  // Create spotlight effect using radial gradient solo si hay bounds
  const spotlightStyle: React.CSSProperties = elementBounds
    ? {
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: "none",
        zIndex: 9998,
        background: `radial-gradient(
      ellipse ${elementBounds.width + 40}px ${elementBounds.height + 40}px at 
      ${elementBounds.left + elementBounds.width / 2}px 
      ${elementBounds.top + elementBounds.height / 2}px,
      transparent 0%,
      transparent 50%,
      rgba(0, 0, 0, 0.6) 100%
    )`,
      }
    : {
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: "none",
        zIndex: 9998,
        background: "rgba(0, 0, 0, 0.5)",
      };

  // Siempre renderizar children - el tour debe funcionar incluso sin encontrar el elemento
  return createPortal(
    <>
      <div style={spotlightStyle} />
      {children}
    </>,
    document.body,
  );
}
