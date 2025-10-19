import React, { useState } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useThemeStore } from '@/stores/themeStore';
import { useTranslation } from '@/components/i18n/I18nProvider';

export const ThemeSwitcher: React.FC = () => {
  const { mode, setMode, isDark } = useThemeStore();
  const t = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const themeOptions = [
    {
      value: 'light' as const,
      label: t('settings.lightMode'),
      icon: Sun,
      emoji: '☀️'
    },
    {
      value: 'dark' as const,
      label: t('settings.darkMode'),
      icon: Moon,
      emoji: '🌙'
    },
    {
      value: 'auto' as const,
      label: t('settings.autoMode'),
      icon: Monitor,
      emoji: '🔄'
    }
  ];

  const currentOption = themeOptions.find(option => option.value === mode) || themeOptions[2];

  const handleThemeChange = (newMode: 'light' | 'dark' | 'auto') => {
    setMode(newMode);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Theme Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-center w-10 h-10 rounded-lg border transition-all duration-200 backdrop-blur-sm group ${
          isDark 
            ? 'bg-white/10 hover:bg-white/20 border-white/20' 
            : 'bg-black/10 hover:bg-black/20 border-black/20'
        }`}
        title={`${t('settings.themeMode')}: ${currentOption.label}`}
      >
        <currentOption.icon className={`w-5 h-5 group-hover:scale-110 transition-transform ${
          isDark ? 'text-white' : 'text-black'
        }`} />
      </button>

      {/* Theme Options Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Menu */}
          <div className="absolute right-0 top-full mt-2 w-48 bg-white/95 backdrop-blur-md border border-gray-200 rounded-lg shadow-lg z-20 overflow-hidden dark:bg-gray-800/95 dark:border-gray-600">
            <div className="py-1">
              {themeOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = option.value === mode;
                
                return (
                  <button
                    key={option.value}
                    onClick={() => handleThemeChange(option.value)}
                    className={`w-full flex items-center space-x-3 px-4 py-2 text-left hover:bg-gray-100 transition-colors duration-150 dark:hover:bg-gray-700/50 ${
                      isSelected ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{option.label}</span>
                    <span className="text-sm ml-auto">{option.emoji}</span>
                    {isSelected && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// 简化版主题切换按钮（用于紧凑空间）
export const ThemeToggleButton: React.FC = () => {
  const { isDark, toggleTheme } = useThemeStore();
  
  return (
    <button
      onClick={toggleTheme}
      className={`flex items-center justify-center w-10 h-10 rounded-lg border transition-all duration-200 backdrop-blur-sm group ${
        isDark 
          ? 'bg-white/10 hover:bg-white/20 border-white/20' 
          : 'bg-black/10 hover:bg-black/20 border-black/20'
      }`}
      title={isDark ? '切换到明亮模式' : '切换到深色模式'}
    >
      {isDark ? (
        <Sun className={`w-5 h-5 group-hover:scale-110 transition-transform ${
          isDark ? 'text-white' : 'text-black'
        }`} />
      ) : (
        <Moon className={`w-5 h-5 group-hover:scale-110 transition-transform ${
          isDark ? 'text-white' : 'text-black'
        }`} />
      )}
    </button>
  );
};
