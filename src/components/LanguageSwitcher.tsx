import React from 'react'
import { useLanguage } from '../i18n/I18nProvider'
import { Globe } from 'lucide-react'

export const LanguageSwitcher: React.FC = () => {
  const { currentLanguage, changeLanguage } = useLanguage()

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'zh', name: '中文', flag: '🇨🇳' }
  ]

  const handleLanguageChange = (languageCode: string) => {
    changeLanguage(languageCode)
  }

  return (
    <div className="relative">
      <div className="flex items-center space-x-2">
        <Globe className="w-4 h-4 text-gray-500" />
        <select
          value={currentLanguage}
          onChange={(e) => handleLanguageChange(e.target.value)}
          className="bg-transparent border-none text-sm text-gray-700 focus:outline-none focus:ring-0 cursor-pointer"
        >
          {languages.map((language) => (
            <option key={language.code} value={language.code}>
              {language.flag} {language.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
} 