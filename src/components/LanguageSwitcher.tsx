import React, { useState } from 'react'
import { useLanguage } from '@/components/i18n/I18nProvider'

export const LanguageSwitcher: React.FC = () => {
  const { currentLanguage, changeLanguage } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'zh', name: '中文', flag: '🇨🇳' }
  ]

  const currentLanguageData = languages.find(lang => lang.code === currentLanguage) || languages[0]

  const handleLanguageChange = (languageCode: string) => {
    changeLanguage(languageCode)
    setIsOpen(false)
  }

  return (
    <div className="relative">
      {/* Language Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 transition-all duration-200 backdrop-blur-sm group"
        title={`语言: ${currentLanguageData.name}`}
      >
        <span className="text-lg group-hover:scale-110 transition-transform">
          {currentLanguageData.flag}
        </span>
      </button>

      {/* Language Options Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Menu */}
          <div className="absolute right-0 top-full mt-2 w-40 bg-white/95 backdrop-blur-md border border-gray-200 rounded-lg shadow-lg z-20 overflow-hidden dark:bg-gray-800/95 dark:border-gray-600">
            <div className="py-1">
              {languages.map((language) => {
                const isSelected = language.code === currentLanguage
                
                return (
                  <button
                    key={language.code}
                    onClick={() => handleLanguageChange(language.code)}
                    className={`w-full flex items-center space-x-3 px-4 py-2 text-left hover:bg-gray-100 transition-colors duration-150 dark:hover:bg-gray-700/50 ${
                      isSelected ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <span className="text-sm">{language.flag}</span>
                    <span className="text-sm font-medium">{language.name}</span>
                    {isSelected && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full ml-auto"></div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
} 