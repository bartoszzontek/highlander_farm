// src/components/ThemeProvider.jsx
import React, { createContext, useContext, useState, useEffect } from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'

const ThemeProviderContext = createContext({
  theme: 'system',
  setTheme: () => null,
})

export function ThemeProvider({ children, ...props }) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)
  if (context === undefined) {
    // Fallback na hook z next-themes, jeśli kontekst nie jest dostępny
    const { theme, setTheme } = require('next-themes')
    return { theme, setTheme }
  }
  return context
}
