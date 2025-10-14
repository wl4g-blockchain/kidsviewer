"use client"

import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const { i18n } = useTranslation()

  useEffect(() => {
    // Initialize i18n on client side
    if (typeof window !== 'undefined') {
      const storedLanguage = localStorage.getItem('kidsviewer-language') || 'en'
      if (i18n.language !== storedLanguage) {
        i18n.changeLanguage(storedLanguage)
      }
    }
  }, [i18n])

  return <>{children}</>
}
