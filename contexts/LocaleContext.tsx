'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import enTranslations from '@/locales/en.json'
import trTranslations from '@/locales/tr.json'

type Locale = 'en' | 'tr'

type Translations = typeof enTranslations

interface LocaleContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string, params?: Record<string, string>) => string
  translations: Translations
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined)

const translations: Record<Locale, Translations> = {
  en: enTranslations,
  tr: trTranslations,
}

function detectLanguage(): Locale {
  // Check localStorage first
  const saved = localStorage.getItem('locale')
  if (saved === 'en' || saved === 'tr') return saved

  // Detect from browser
  const browserLang = navigator.language.toLowerCase()
  if (browserLang.startsWith('tr')) return 'tr'
  return 'en'
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en')
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    const detected = detectLanguage()
    setLocaleState(detected)
  }, [])

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale)
    if (typeof window !== 'undefined') {
      localStorage.setItem('locale', newLocale)
      document.documentElement.lang = newLocale
    }
  }

  const t = (key: string, params?: Record<string, string>): string => {
    const keys = key.split('.')
    let value: any = translations[locale]

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

  if (!isClient) {
    return null // or a loading skeleton
  }

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t, translations: translations[locale] }}>
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
