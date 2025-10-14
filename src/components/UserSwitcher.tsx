import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useSessionData } from './providers/AuthProvider';
import { useThemeStore } from '../stores/themeStore';
import { useTranslation, useLanguage } from '../i18n/I18nProvider';
import { Users, ChevronDown, LogOut, Crown, Baby, Lock, Sun, Moon, Monitor, Globe, Settings } from 'lucide-react';
import { Person } from '../types';
import { ParentalPasswordModal } from './ParentalPasswordModal';

export const UserSwitcher: React.FC = () => {
  const { data: session, signOut } = useSessionData();
  const { mode, setMode, isDark } = useThemeStore();
  const { currentLanguage, changeLanguage } = useLanguage();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [persons, setPersons] = useState<Person[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [viewMode, setViewMode] = useState<'parent' | 'child'>('parent');
  const [activePerson, setActivePerson] = useState<Person | null>(null);
  const t = useTranslation();

  // Get current user from session
  const currentUser = session?.user;

  // Mock functions for now - these should be replaced with actual API calls
  const switchToPerson = (person: Person) => {
    setActivePerson(person);
    setViewMode('child');
  };

  const switchToParent = () => {
    setActivePerson(null);
    setViewMode('parent');
  };

  const logout = async () => {
    await signOut();
  };

  // Load persons when component mounts or currentUser changes
  useEffect(() => {
    if (currentUser) {
      loadPersons();
    }
  }, [currentUser]);

  const loadPersons = async () => {
    if (!currentUser) return;

    setIsLoading(true);
    try {
      // Call real API to get persons
      const response = await fetch('/api/tenant/sub-accounts', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setPersons(data.data);
        }
      } else {
        console.error('Failed to load persons:', response.status);
      }
    } catch (error) {
      console.error('Failed to load persons:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitchToPerson = (person: Person) => {
    switchToPerson(person);
    setIsOpen(false);
  };

  const handleSwitchToParent = () => {
    // If already in parent mode, just close dropdown
    if (viewMode === 'parent') {
      setIsOpen(false);
      return;
    }

    // If in child mode, require password verification
    setShowPasswordModal(true);
    setPasswordError('');
    setIsOpen(false);
  };

  const handlePasswordSubmit = async (password: string) => {
    if (!password.trim()) {
      setPasswordError(t('auth.password') + ' ' + t('common.error'));
      return;
    }

    try {
      // Call real API to verify parental password
      const response = await fetch('/api/auth/verify-parental-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          switchToParent();
          setShowPasswordModal(false);
          setPasswordError('');
        } else {
          setPasswordError(data.error || t('errors.invalidInput'));
        }
      } else {
        const errorData = await response.json();
        setPasswordError(errorData.error || t('errors.invalidInput'));
      }
    } catch (error) {
      setPasswordError(t('errors.unknownError'));
    }
  };

  const handleLogout = async () => {
    console.log('Logout button clicked');
    try {
      console.log('Calling logout API...');
      await logout();
      console.log('Logout successful, closing dropdown');
      setIsOpen(false);
    } catch (error) {
      console.error('Logout failed:', error);
      // Still close the dropdown even if logout fails
      setIsOpen(false);
    }
  };

  const handleThemeChange = (newMode: 'light' | 'dark' | 'auto') => {
    setMode(newMode);
  };

  const handleLanguageChange = (languageCode: string) => {
    changeLanguage(languageCode);
  };

  const getAgeGroupEmoji = (ageGroup: string) => {
    switch (ageGroup) {
      case 'preschool':
        return '👶';
      case 'young':
        return '🧒';
      case 'older':
        return '👦';
      default:
        return '👤';
    }
  };

  if (!currentUser) return null;

  return (
    <>
      <div className="relative">
        {/* Current user display button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center space-x-2 sm:space-x-3 px-2 sm:px-4 py-2 rounded-xl shadow-lg border-2 hover:shadow-xl transition-all duration-300 transform hover:scale-105 min-w-[160px] sm:min-w-[200px] lg:min-w-[240px] ${
            isDark ? 'bg-gray-800/90 border-gray-600 backdrop-blur-sm' : 'bg-white border-purple-200'
          }`}
        >
          <div className="flex-shrink-0">
            {viewMode === 'parent' ? (
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white">
                <Crown className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            ) : (
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-green-500 to-cyan-500 rounded-full flex items-center justify-center text-white text-base sm:text-lg">
                {activePerson ? getAgeGroupEmoji(activePerson.ageGroup) : '👤'}
              </div>
            )}
          </div>

          <div className="flex-1 text-left min-w-0">
            <div className="flex items-center space-x-1 sm:space-x-2">
              <span className={`font-bold text-xs sm:text-sm lg:text-base truncate ${isDark ? 'text-white' : 'text-gray-800'}`}>
                {viewMode === 'parent' ? currentUser.name : activePerson?.alias || 'Unknown'}
              </span>
              {viewMode === 'parent' && <Crown className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500 flex-shrink-0" />}
            </div>
            <div className={`text-xs sm:text-sm flex items-center space-x-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {viewMode === 'parent' ? (
                <>
                  <Users className="w-2 h-2 sm:w-3 sm:h-3" />
                  <span className="truncate">{t('navigation.parental')}</span>
                </>
              ) : (
                <>
                  <Baby className="w-2 h-2 sm:w-3 sm:h-3" />
                  <span className="truncate">{t(`parental.ageGroups.${activePerson?.ageGroup || 'undefined'}`)}</span>
                </>
              )}
            </div>
          </div>

          <ChevronDown
            className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180' : ''} ${
              isDark ? 'text-gray-400' : 'text-gray-400'
            }`}
          />
        </button>

        {/* Dropdown menu */}
        {isOpen &&
          createPortal(
            <div className="fixed inset-0 z-[9998] flex justify-end">
              {/* Backdrop */}
              <div className="fixed inset-0" onClick={() => setIsOpen(false)} />

              {/* Menu positioned relative to trigger */}
              <div
                className={`absolute top-16 right-4 w-72 sm:w-80 rounded-2xl shadow-2xl border-2 z-[9999] overflow-hidden ${
                  isDark ? 'bg-gray-800/95 border-gray-600 backdrop-blur-md' : 'bg-white border-purple-100'
                }`}
              >
                {/* User Info Section */}
                <div className={`p-3 border-b ${isDark ? 'border-gray-600' : 'border-gray-100'}`}>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white">
                      <Crown className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-800'}`}>{currentUser.name}</div>
                      <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{currentUser.email}</div>
                    </div>
                  </div>
                </div>

                {/* Language Selection */}
                <div className={`p-3 border-b ${isDark ? 'border-gray-600' : 'border-gray-100'}`}>
                  <div
                    className={`text-xs font-bold uppercase tracking-wide mb-2 flex items-center ${
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    }`}
                  >
                    <Globe className="w-3 h-3 mr-2" />
                    {t('settings.languageSelection')}
                  </div>
                  <div className="flex space-x-1.5">
                    <button
                      onClick={() => handleLanguageChange('zh')}
                      className={`flex-1 px-2 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center ${
                        currentLanguage === 'zh'
                          ? isDark
                            ? 'bg-blue-600 text-white'
                            : 'bg-blue-500 text-white'
                          : isDark
                          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <span className="mr-1">🇨🇳</span>中
                    </button>
                    <button
                      onClick={() => handleLanguageChange('en')}
                      className={`flex-1 px-2 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center ${
                        currentLanguage === 'en'
                          ? isDark
                            ? 'bg-blue-600 text-white'
                            : 'bg-blue-500 text-white'
                          : isDark
                          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <span className="mr-1">🇺🇸</span>
                      EN
                    </button>
                  </div>
                </div>

                {/* Theme Selection */}
                <div className={`p-3 border-b ${isDark ? 'border-gray-600' : 'border-gray-100'}`}>
                  <div
                    className={`text-xs font-bold uppercase tracking-wide mb-2 flex items-center ${
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    }`}
                  >
                    <Moon className="w-3 h-3 mr-2" />
                    {t('settings.themeMode')}
                  </div>
                  <div className="flex space-x-1.5">
                    <button
                      onClick={() => handleThemeChange('light')}
                      className={`flex-1 px-2 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center ${
                        mode === 'light'
                          ? isDark
                            ? 'bg-blue-600 text-white'
                            : 'bg-blue-500 text-white'
                          : isDark
                          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <Sun className="w-3 h-3 mr-1" />
                      {t('settings.lightMode')}
                    </button>
                    <button
                      onClick={() => handleThemeChange('dark')}
                      className={`flex-1 px-2 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center ${
                        mode === 'dark'
                          ? isDark
                            ? 'bg-blue-600 text-white'
                            : 'bg-blue-500 text-white'
                          : isDark
                          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <Moon className="w-3 h-3 mr-1" />
                      {t('settings.darkMode')}
                    </button>
                    <button
                      onClick={() => handleThemeChange('auto')}
                      className={`flex-1 px-2 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center ${
                        mode === 'auto'
                          ? isDark
                            ? 'bg-blue-600 text-white'
                            : 'bg-blue-500 text-white'
                          : isDark
                          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <Monitor className="w-3 h-3 mr-1" />
                      {t('settings.autoMode')}
                    </button>
                  </div>
                </div>

                {/* Parent section */}
                <div className="p-2">
                  <div
                    className={`text-xs font-bold uppercase tracking-wide px-3 py-2 flex items-center ${
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    }`}
                  >
                    <Crown className="w-3 h-3 mr-2" />
                    {t('navigation.parental')}
                  </div>

                  <button
                    onClick={handleSwitchToParent}
                    className={`w-full flex items-center space-x-3 px-3 py-3 rounded-xl transition-all duration-200 ${
                      viewMode === 'parent'
                        ? isDark
                          ? 'bg-gradient-to-r from-blue-900/50 to-purple-900/50 border-2 border-blue-600'
                          : 'bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200'
                        : isDark
                        ? 'hover:bg-gray-700/50'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white">
                      <Crown className="w-4 h-4" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-800'}`}>{currentUser.name}</div>
                      <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('userSwitcher.parentDashboard')}</div>
                    </div>
                    {viewMode === 'parent' ? (
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    ) : (
                      <Lock className={`w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                    )}
                  </button>
                </div>

                <div className={`border-t ${isDark ? 'border-gray-600' : 'border-gray-100'}`}></div>

                {/* Children section */}
                <div className="p-2">
                  <div
                    className={`text-xs font-bold uppercase tracking-wide px-3 py-2 flex items-center justify-between ${
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    }`}
                  >
                    <div className="flex items-center">
                      <Baby className="w-3 h-3 mr-2" />
                      {t('userSwitcher.childAccounts')} ({persons.length})
                    </div>
                    {isLoading && (
                      <div
                        className={`w-3 h-3 border rounded-full animate-spin ${
                          isDark ? 'border-gray-600 border-t-blue-500' : 'border-gray-300 border-t-blue-500'
                        }`}
                      ></div>
                    )}
                  </div>

                  {persons.length === 0 ? (
                    <div className="px-3 py-6 text-center">
                      <div className={`mb-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        <Users className="w-8 h-8 mx-auto mb-2" />
                      </div>
                      <div className={`text-sm mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('parental.noPersonsAdded')}</div>
                      <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{t('parental.addPersonInDashboard')}</div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {persons.map(person => (
                        <button
                          key={person.id}
                          onClick={e => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('Switching to person:', person);
                            handleSwitchToPerson(person);
                          }}
                          className={`w-full flex items-center space-x-3 px-3 py-3 rounded-xl transition-all duration-200 ${
                            viewMode === 'child' && activePerson?.id === person.id
                              ? isDark
                                ? 'bg-gradient-to-r from-green-900/50 to-cyan-900/50 border-2 border-green-600'
                                : 'bg-gradient-to-r from-green-50 to-cyan-50 border-2 border-green-200'
                              : isDark
                              ? 'hover:bg-gray-700/50'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-cyan-500 rounded-full flex items-center justify-center text-white text-sm">
                            {getAgeGroupEmoji(person.ageGroup)}
                          </div>
                          <div className="flex-1 text-left">
                            <div className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-800'}`}>{person.alias}</div>
                            <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              {t(`parental.ageGroups.${person.ageGroup || 'undefined'}`)} • {person.settings.perTimeLimitMinutes}
                              {t('time.minutes')}
                            </div>
                          </div>
                          {viewMode === 'child' && activePerson?.id === person.id && (
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className={`border-t ${isDark ? 'border-gray-600' : 'border-gray-100'}`}></div>

                {/* Actions */}
                <div className="p-2">
                  {/* Settings button - only show in parent view */}
                  {viewMode === 'parent' && (
                    <button
                      onClick={() => {
                        // Navigate to settings page using React Router
                        navigate('/settings');
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center space-x-3 px-3 py-3 rounded-xl transition-all duration-200 ${
                        isDark ? 'hover:bg-gray-700/50 text-gray-300' : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <Settings className="w-5 h-5" />
                      <span className="font-semibold text-sm">{t('settings.title')}</span>
                    </button>
                  )}

                  <button
                    onClick={handleLogout}
                    className={`w-full flex items-center space-x-3 px-3 py-3 rounded-xl transition-all duration-200 ${
                      isDark ? 'hover:bg-red-900/30 text-red-400' : 'hover:bg-red-50 text-red-600'
                    }`}
                  >
                    <LogOut className="w-5 h-5" />
                    <span className="font-semibold text-sm">{t('auth.logout')}</span>
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )}
      </div>

      <ParentalPasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSubmit={handlePasswordSubmit}
        error={passwordError}
      />
    </>
  );
};
