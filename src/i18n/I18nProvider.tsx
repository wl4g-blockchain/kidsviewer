import React, { createContext, useContext, useEffect, useState } from 'react';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import language files
import en from './locales/en.json';
import zh from './locales/zh.json';

// Initialize i18n
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      zh: { translation: zh },
    },
    lng: 'en', // Default language set to English
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',

    interpolation: {
      escapeValue: false,
    },

    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'kidsviewer-language',
    },
  });

// SSR 兼容性：确保在服务器端也能正常工作
if (typeof window === 'undefined') {
  i18n.changeLanguage('en');
}

// Language context
interface LanguageContextType {
  currentLanguage: string;
  changeLanguage: (lng: string) => void;
  t: (key: string, options?: any) => any;
  isAutoLanguage: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Language provider component
export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language);
  const [isAutoLanguage, setIsAutoLanguage] = useState(() => {
    // SSR 兼容性检查
    if (typeof window === 'undefined') {
      return false;
    }
    const savedLanguage = localStorage.getItem('kidsviewer-language');
    return savedLanguage === 'auto' || savedLanguage === null;
  });

  const changeLanguage = (lng: string) => {
    // SSR 兼容性检查
    if (typeof window === 'undefined') {
      return;
    }
    
    if (lng === 'auto') {
      // Detect browser language automatically
      const browserLang = navigator.language.split('-')[0];
      const detectedLang = ['zh', 'en'].includes(browserLang) ? browserLang : 'en';
      i18n.changeLanguage(detectedLang);
      setCurrentLanguage(detectedLang);
      setIsAutoLanguage(true);
      localStorage.setItem('kidsviewer-language', 'auto');
    } else {
      i18n.changeLanguage(lng);
      setCurrentLanguage(lng);
      setIsAutoLanguage(false);
      localStorage.setItem('kidsviewer-language', lng);
    }
  };

  const t = (key: string, options?: any) => {
    return i18n.t(key, options);
  };

  useEffect(() => {
    const handleLanguageChanged = (lng: string) => {
      setCurrentLanguage(lng);
    };

    i18n.on('languageChanged', handleLanguageChanged);

    return () => {
      i18n.off('languageChanged', handleLanguageChanged);
    };
  }, []);

  return <LanguageContext.Provider value={{ currentLanguage, changeLanguage, t, isAutoLanguage }}>{children}</LanguageContext.Provider>;
};

// Hook to use language context
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within an I18nProvider');
  }
  return context;
};

// Hook to use translation
export const useTranslation = () => {
  return useLanguage().t;
};
