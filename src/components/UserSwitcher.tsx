import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useTranslation } from '../i18n/I18nProvider';
import { Users, ChevronDown, LogOut, Crown, Baby, Lock } from 'lucide-react';
import { Person } from '../types';

export const UserSwitcher: React.FC = () => {
  const { currentUser, activePerson, viewMode, switchToPerson, switchToParent, logout, apiHandler } = useAuthStore();

  const [isOpen, setIsOpen] = useState(false);
  const [persons, setPersons] = useState<Person[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [parentalPassword, setParentalPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const t = useTranslation();

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
      const response = await apiHandler.getPersons(currentUser.id);
      if (response.success && response.data) {
        setPersons(response.data);
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
    setParentalPassword('');
    setPasswordError('');
    setIsOpen(false);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!parentalPassword.trim()) {
      setPasswordError(t('auth.password') + ' ' + t('common.error'));
      return;
    }

    try {
      const response = await apiHandler.verifyParentalPassword(parentalPassword);
      if (response.success && response.data) {
        switchToParent();
        setShowPasswordModal(false);
        setParentalPassword('');
        setPasswordError('');
      } else {
        setPasswordError(response.message || t('errors.invalidInput'));
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
          className="flex items-center space-x-2 sm:space-x-3 px-2 sm:px-4 py-2 bg-white rounded-xl shadow-lg border-2 border-gradient-to-r from-purple-200 to-pink-200 hover:shadow-xl transition-all duration-300 transform hover:scale-105 min-w-[160px] sm:min-w-[200px] lg:min-w-[240px]"
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
              <span className="font-bold text-gray-800 text-xs sm:text-sm lg:text-base truncate">
                {viewMode === 'parent' ? currentUser.name : activePerson?.alias || 'Unknown'}
              </span>
              {viewMode === 'parent' && <Crown className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500 flex-shrink-0" />}
            </div>
            <div className="text-xs sm:text-sm text-gray-500 flex items-center space-x-1">
              {viewMode === 'parent' ? (
                <>
                  <Users className="w-2 h-2 sm:w-3 sm:h-3" />
                  <span className="truncate">{t('navigation.parental')}</span>
                </>
              ) : (
                <>
                  <Baby className="w-2 h-2 sm:w-3 sm:h-3" />
                  <span className="truncate">{t('parental.ageGroups.' + activePerson?.ageGroup)}</span>
                </>
              )}
            </div>
          </div>

          <ChevronDown
            className={`w-4 h-4 sm:w-5 sm:h-5 text-gray-400 transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Dropdown menu */}
        {isOpen && (
          <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-[90]" onClick={() => setIsOpen(false)} />

            {/* Menu */}
            <div className="absolute top-full left-0 mt-2 w-full sm:w-80 bg-white rounded-2xl shadow-2xl border-2 border-purple-100 z-[100] overflow-hidden">
              {/* Parent section */}
              <div className="p-2">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wide px-3 py-2 flex items-center">
                  <Crown className="w-3 h-3 mr-2" />
                  {t('navigation.parental')}
                </div>

                <button
                  onClick={handleSwitchToParent}
                  className={`w-full flex items-center space-x-3 px-3 py-3 rounded-xl transition-all duration-200 ${
                    viewMode === 'parent' ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white">
                    <Crown className="w-4 h-4" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-semibold text-gray-800 text-sm">{currentUser.name}</div>
                    <div className="text-xs text-gray-500">{t('userSwitcher.parentDashboard')}</div>
                  </div>
                  {viewMode === 'parent' ? (
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  ) : (
                    <Lock className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </div>

              <div className="border-t border-gray-100"></div>

              {/* Children section */}
              <div className="p-2">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wide px-3 py-2 flex items-center justify-between">
                  <div className="flex items-center">
                    <Baby className="w-3 h-3 mr-2" />
                    {t('userSwitcher.childAccounts')} ({persons.length})
                  </div>
                  {isLoading && <div className="w-3 h-3 border border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>}
                </div>

                {persons.length === 0 ? (
                  <div className="px-3 py-6 text-center">
                    <div className="text-gray-400 mb-2">
                      <Users className="w-8 h-8 mx-auto mb-2" />
                    </div>
                    <div className="text-sm text-gray-500 mb-3">{t('parental.noPersonsAdded')}</div>
                    <div className="text-xs text-gray-400">{t('parental.addPersonInDashboard')}</div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {persons.map(person => (
                      <button
                        key={person.id}
                        onClick={() => handleSwitchToPerson(person)}
                        className={`w-full flex items-center space-x-3 px-3 py-3 rounded-xl transition-all duration-200 ${
                          viewMode === 'child' && activePerson?.id === person.id
                            ? 'bg-gradient-to-r from-green-50 to-cyan-50 border-2 border-green-200'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-cyan-500 rounded-full flex items-center justify-center text-white text-sm">
                          {getAgeGroupEmoji(person.ageGroup)}
                        </div>
                        <div className="flex-1 text-left">
                          <div className="font-semibold text-gray-800 text-sm">{person.alias}</div>
                          <div className="text-xs text-gray-500">
                            {t('parental.ageGroups.' + person.ageGroup)} • {person.settings.timeLimit}
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

              <div className="border-t border-gray-100"></div>

              {/* Actions */}
              <div className="p-2">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-3 px-3 py-3 rounded-xl hover:bg-red-50 transition-all duration-200 text-red-600"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-semibold text-sm">{t('auth.logout')}</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Parental Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[200]">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('parental.backToParent')}</h2>
              <p className="text-gray-600">{t('auth.enterParentalPassword')}</p>
            </div>

            <form onSubmit={handlePasswordSubmit}>
              <div className="mb-4">
                <input
                  type="password"
                  value={parentalPassword}
                  onChange={e => setParentalPassword(e.target.value)}
                  placeholder={t('auth.password')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  autoFocus
                />
                {passwordError && <p className="text-red-600 text-sm mt-2">{passwordError}</p>}
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:scale-105 transition-transform"
                >
                  {t('common.submit')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
