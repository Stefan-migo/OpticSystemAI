"use client";

import { Toaster as SonnerToaster } from "sonner";
import { useEffect } from "react";

export function Toaster() {
  useEffect(() => {
    // Set default CSS variable for toast duration
    const style = document.documentElement.style;
    const defaultDuration = 4000; // 4 seconds
    style.setProperty("--toast-duration", `${defaultDuration / 1000}s`);

    // Listen for toast creation to update duration and setup progress bar
    const observer = new MutationObserver(() => {
      const toasts = document.querySelectorAll("[data-sonner-toast]");
      toasts.forEach((toast) => {
        const toastElement = toast as HTMLElement;

        // Skip if already processed
        if (toastElement.dataset.progressSetup === "true") {
          return;
        }

        // Get duration from toast element or use default
        const duration =
          toastElement.dataset.duration || String(defaultDuration);
        const durationInSeconds = `${parseInt(duration) / 1000}s`;
        toastElement.style.setProperty("--toast-duration", durationInSeconds);

        // Detectar tipo de toast para aplicar color correcto
        // Sonner con richColors usa clases específicas o data-type
        let toastType: string | null = null;

        // Buscar en atributos
        toastType =
          toastElement.getAttribute("data-type") ||
          toastElement.getAttribute("data-toast-type");

        // Buscar en clases del elemento
        if (!toastType) {
          if (
            toastElement.classList.contains("success") ||
            toastElement.classList.contains("sonner-success")
          ) {
            toastType = "success";
          } else if (
            toastElement.classList.contains("error") ||
            toastElement.classList.contains("sonner-error")
          ) {
            toastType = "error";
          } else if (
            toastElement.classList.contains("info") ||
            toastElement.classList.contains("sonner-info")
          ) {
            toastType = "info";
          }
        }

        // Buscar en elementos hijos (Sonner puede poner el tipo en un contenedor interno)
        if (!toastType) {
          const successIndicator = toastElement.querySelector(
            '[data-success], .success, [class*="success"]',
          );
          const errorIndicator = toastElement.querySelector(
            '[data-error], .error, [class*="error"]',
          );
          const infoIndicator = toastElement.querySelector(
            '[data-info], .info, [class*="info"]',
          );

          if (successIndicator) toastType = "success";
          else if (errorIndicator) toastType = "error";
          else if (infoIndicator) toastType = "info";
        }

        // Aplicar atributo para CSS
        if (toastType) {
          toastElement.setAttribute("data-toast-type", toastType);
        } else {
          // Por defecto, si no se detecta tipo, es info (azul)
          toastElement.setAttribute("data-toast-type", "info");
        }

        // Mark as processed
        toastElement.dataset.progressSetup = "true";

        // Reset progress bar when toast is removed
        const removeObserver = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            if (mutation.attributeName === "data-removed") {
              const isRemoved =
                toastElement.getAttribute("data-removed") === "true";
              if (isRemoved) {
                // Ensure exit animation plays
                toastElement.style.animation =
                  "toastOut 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards";
              }
            }
          });
        });

        removeObserver.observe(toastElement, {
          attributes: true,
          attributeFilter: ["data-removed", "data-swipe-out"],
        });

        // Cleanup observer when toast is removed
        setTimeout(
          () => {
            removeObserver.disconnect();
          },
          parseInt(duration) + 500,
        );
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, []);

  return (
    <SonnerToaster
      position="bottom-right"
      richColors
      closeButton={false}
      expand={true}
      duration={4000}
      toastOptions={{
        style: {
          background: "var(--background)",
          color: "var(--foreground)",
          border: "1px solid var(--border)",
        },
        className: "toast-with-progress",
      }}
    />
  );
}

// Export toast function for convenience
export { toast } from "sonner";
