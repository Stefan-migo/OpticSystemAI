"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from "next-themes"
import { type ThemeProviderProps } from "next-themes/dist/types"
import { ThemeId, themes, getTheme } from "@/config/themes"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      {...props}
      themes={themes.map(t => t.id)}
      defaultTheme="light"
      enableSystem={false}
      attribute="data-theme"
      storageKey="theme"
      disableTransitionOnChange={false}
    >
      <ThemeClassManager>
        {children}
      </ThemeClassManager>
    </NextThemesProvider>
  )
}

// Component to manage theme class application
function ThemeClassManager({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useNextTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  React.useEffect(() => {
    if (!mounted || !theme) return

    const root = document.documentElement
    const validThemes: ThemeId[] = ['light', 'dark', 'blue', 'green', 'red']
    
    // Remove all theme classes and dark class
    validThemes.forEach(t => {
      root.classList.remove(`theme-${t}`)
    })
    root.classList.remove('dark')
    
    // Also remove data-theme attribute that next-themes might set
    root.removeAttribute('data-theme')

    // Apply current theme class - CSS variables are already defined in globals.css
    // We use "theme-{name}" format for our CSS selectors
    if (theme === 'dark') {
      root.classList.add('dark', 'theme-dark')
    } else if (theme === 'light') {
      root.classList.add('theme-light')
    } else if (theme === 'blue') {
      root.classList.add('theme-blue')
    } else if (theme === 'green') {
      root.classList.add('theme-green')
    } else if (theme === 'red') {
      root.classList.add('theme-red')
    }
    
    // Force a reflow to ensure styles are applied
    void root.offsetHeight
    
    // Debug logging (only in development)
    if (process.env.NODE_ENV === 'development') {
      console.log('🎨 Theme applied:', theme)
      console.log('🎨 Classes on <html>:', root.className)
      
      // Verify CSS variables are actually applied
      const bgSecondary = getComputedStyle(root).getPropertyValue('--admin-bg-secondary').trim()
      const background = getComputedStyle(root).getPropertyValue('--background').trim()
      
      if (theme === 'blue' && bgSecondary !== '#1E40AF') {
        console.error('❌ Blue theme CSS variable not applied correctly!')
      } else if (theme === 'green' && bgSecondary !== '#166534') {
        console.error('❌ Green theme CSS variable not applied correctly!')
      }
    }
  }, [theme, mounted])

  // Prevent flash of unstyled content
  if (!mounted) {
    return <>{children}</>
  }

  return <>{children}</>
}

// Custom hook to use theme with our custom theme IDs
export function useTheme() {
  const { theme, setTheme, themes: availableThemes } = useNextTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const currentTheme = React.useMemo(() => {
    if (!theme) return getTheme('light')
    return getTheme(theme as ThemeId)
  }, [theme])

  return {
    theme: theme as ThemeId | undefined,
    setTheme: (newTheme: ThemeId) => setTheme(newTheme),
    currentTheme,
    themes: availableThemes as ThemeId[],
    mounted,
  }
}
