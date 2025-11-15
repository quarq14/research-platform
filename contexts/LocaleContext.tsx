'use client'

import React, { createContext, useContext, ReactNode } from 'react'
import enTranslations from '@/locales/en.json'

type Locale = 'en'

type Translations = typeof enTranslations

interface LocaleContextType {
  locale: Locale
  t: (key: string, params?: Record<string, string>) => string
  translations: Translations
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined)

const translations: Translations = enTranslations

export function LocaleProvider({ children }: { children: ReactNode }) {
  const t = (key: string, params?: Record<string, string>): string => {
    const keys = key.split('.')
    let value: any = translations

    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k]
      } else {
        return key // Return key if translation not found
      }
    }

    if (typeof value !== 'string') return key

    // Replace parameters
    if (params) {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        value = value.replace(`{${paramKey}}`, paramValue)
      })
    }

    return value
  }

  return (
    <LocaleContext.Provider value={{ locale: 'en', t, translations }}>
      {children}
    </LocaleContext.Provider>
  )
}

export function useLocale() {
  const context = useContext(LocaleContext)
  if (!context) {
    throw new Error('useLocale must be used within LocaleProvider')
  }
  return context
}
