import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useTranslation } from '../i18n/I18nProvider';
import { Video, Trophy, Crown, Baby, Play, AlertCircle, RefreshCw } from 'lucide-react';
import { ParentalPasswordModal } from '../components/ParentalPasswordModal';

interface AccessibleUrl {
  platformName: string;
  url: string;
  difficulty: string;
  maxDailyTime: number;
  description?: string;
}

export const PersonHome: React.FC = () => {
  const navigate = useNavigate();
  const { activePerson, switchToParent, apiHandler } = useAuthStore();
  const [accessibleUrls, setAccessibleUrls] = useState<AccessibleUrl[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const t = useTranslation();

  // Load child accessible URLs
  useEffect(() => {
    if (activePerson) {
      console.log('Current active person:', activePerson);
      loadChildAccessibleUrls();
    }
  }, [activePerson]);

  const loadChildAccessibleUrls = async () => {
    if (!activePerson) {
      setError(t('person.noActivePersonFound'));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log(`Loading accessible URLs for person ${activePerson.alias} (ID: ${activePerson.id})...`);

      const response = await apiHandler.getPersonAccessibleUrls(activePerson.id);

      console.log('API response:', response);

      if (response.success && response.data) {
        console.log(`Successfully loaded ${response.data.length} accessible platforms:`, response.data);
        setAccessibleUrls(response.data);
      } else {
        console.error('Failed to load accessible URLs:', response.error);
        setError(response.error || t('person.loadAccessibleUrlsFailed'));
      }
    } catch (error) {
      console.error('Error occurred while loading person accessible URLs:', error);
      setError(error instanceof Error ? error.message : t('person.loadContentError'));
    } finally {
      setIsLoading(false);
    }
  };

  // Reload data
  const handleRefresh = () => {
    loadChildAccessibleUrls();
  };

  const handleSwitchToParent = () => {
    setShowPasswordModal(true);
    setPasswordError('');
  };

  const handlePasswordSubmit = async (password: string) => {
    if (!password.trim()) {
      setPasswordError(t('auth.password') + t('common.error'));
      return;
    }

    try {
      const response = await apiHandler.verifyParentalPassword(password);
      if (response.success && response.data) {
        switchToParent();
        setShowPasswordModal(false);
            setPasswordError('');
      } else {
        setPasswordError(response.message || t('errors.invalidInput'));
      }
    } catch (error) {
      setPasswordError(t('errors.unknownError'));
    }
  };

  // Handle opening a URL - navigate to PersonViewer instead of opening new tab
  const handleOpenUrl = async (urlData: AccessibleUrl) => {
    if (!activePerson) return;

    try {
      console.log(`Starting watching session for ${urlData.platformName}: ${urlData.url}`);

      // Start watching session and get token
      const response = await apiHandler.startWatching(activePerson.id, urlData.url);

      if (response.success && response.data) {
        // Store the watching data in sessionStorage for PersonViewer to use
        sessionStorage.setItem(
          'currentWatchingSession',
          JSON.stringify({
            watchingToken: response.data.watchingToken,
            platformName: urlData.platformName,
            platformUrl: urlData.url,
            description: urlData.description,
          })
        );

        // Navigate to PersonViewer
        navigate('/person-viewer');
      } else {
        console.error('Failed to start watching session:', response.error);
        setError(response.error || '启动观看会话失败');
      }
    } catch (error) {
      console.error('Error starting watching session:', error);
      setError('启动观看会话时发生错误');
    }
  };

  // If no active person, show error state
  if (!activePerson) {
    return (
      <div className="flex flex-col items-center justify-center h-64 px-4">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-700 mb-2">{t('person.noPersonFound')}</h3>
          <p className="text-gray-600 mb-6">{t('person.selectPersonFromParent')}</p>
          <button
            onClick={() => switchToParent()}
            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg py-3 px-6 font-medium hover:scale-105 transition-transform inline-flex items-center"
          >
            <Crown className="w-5 h-5 mr-2" />
            {t('person.backToParentView')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-8 py-8">
        {/* Header section */}
        <div className="text-center pt-8 px-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 via-emerald-500 to-cyan-500 rounded-full shadow-2xl mb-6 kids-pulse-element">
            <Baby className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-black bg-gradient-to-r from-emerald-600 via-cyan-600 to-blue-600 bg-clip-text text-transparent mb-3">
            🌟 {t('home.child.title', { name: activePerson?.alias || 'Explorer' })}
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">✨ {t('home.child.subtitle')}</p>
        </div>

        {/* Available platforms/URLs */}
        <div className="px-4">
          <div className="card-modern p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                <Video className="w-6 h-6 mr-2 text-green-500" />
                🎬 {t('home.child.availablePlatforms')}
              </h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleRefresh}
                  disabled={isLoading}
                  className="text-sm bg-gray-500 text-white rounded-lg px-3 py-1 hover:bg-gray-600 transition-colors flex items-center disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                  {t('common.refresh')}
                </button>
                <button
                  onClick={handleSwitchToParent}
                  className="text-sm bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg px-3 py-1 hover:scale-105 transition-transform flex items-center"
                >
                  <Crown className="w-3 h-3 mr-1" />
                  {t('parental.backToParent')}
                </button>
              </div>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
                <div className="flex">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  <div className="ml-3">
                    <p className="text-sm text-red-800">{error}</p>
                    <button onClick={handleRefresh} className="mt-2 text-sm text-red-600 hover:text-red-800 underline">
                      {t('common.retry')}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">{t('person.loadingAccessiblePlatforms')}</p>
              </div>
            ) : accessibleUrls.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {accessibleUrls.map((urlData, index) => (
                  <div
                    key={index}
                    className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200 hover:shadow-lg transition-all duration-200 group"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white mr-3 group-hover:scale-110 transition-transform">
                          <Play className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-800 text-lg">{urlData.platformName}</h3>
                          <div className="flex items-center space-x-2 text-xs text-gray-600">
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                              {t('questions.difficulty.' + urlData.difficulty)}
                            </span>
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full">
                              {urlData.maxDailyTime}
                              {t('time.minutes')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    {urlData.description && <p className="text-sm text-gray-600 mb-4 leading-relaxed">{urlData.description}</p>}
                    <button
                      onClick={() => handleOpenUrl(urlData)}
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg py-3 px-4 font-bold hover:scale-105 transition-transform flex items-center justify-center text-lg shadow-lg"
                    >
                      <Play className="w-5 h-5 mr-2" />
                      {t('home.child.startWatching')}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-8xl mb-4">📺</div>
                <h3 className="text-xl font-bold text-gray-700 mb-2">{t('home.child.noVideos')}</h3>
                <p className="text-gray-600 mb-6">{t('home.child.noVideosDesc')}</p>
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={handleRefresh}
                    className="bg-blue-500 text-white rounded-lg py-3 px-6 font-medium hover:bg-blue-600 transition-colors inline-flex items-center"
                  >
                    <RefreshCw className="w-5 h-5 mr-2" />
                    {t('common.reload')}
                  </button>
                  <button
                    onClick={handleSwitchToParent}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg py-3 px-6 font-medium hover:scale-105 transition-transform inline-flex items-center"
                  >
                    <Crown className="w-5 h-5 mr-2" />
                    {t('parental.backToParent')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick stats */}
        <div className="px-4">
          <div className="card-modern p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
              <Trophy className="w-6 h-6 mr-2 text-yellow-500" />
              🏆 {t('home.child.todayAchievements')}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="text-center bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-200">
                <div className="text-6xl mb-3">⏰</div>
                <h3 className="font-bold text-gray-800 mb-2">{t('home.child.studyTime')}</h3>
                <div className="text-4xl font-black text-blue-600 mb-1">0</div>
                <p className="text-sm text-gray-600">{t('home.child.studyTimeUnit')}</p>
              </div>
              <div className="text-center bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-200">
                <div className="text-6xl mb-3">⭐</div>
                <h3 className="font-bold text-gray-800 mb-2">{t('home.child.stars')}</h3>
                <div className="text-4xl font-black text-orange-600 mb-1">0</div>
                <p className="text-sm text-gray-600">{t('home.child.starsDesc')}</p>
              </div>
              <div className="text-center bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                <div className="text-6xl mb-3">🎯</div>
                <h3 className="font-bold text-gray-800 mb-2">{t('home.child.challenge')}</h3>
                <div className="text-4xl font-black text-green-600 mb-1">0</div>
                <p className="text-sm text-gray-600">{t('home.child.challengeDesc')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Encouragement message */}
        <div className="px-4 pb-8">
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-200 text-center">
            <div className="text-6xl mb-4">🌟✨🚀</div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-3">
              {t('home.child.encouragement', { name: activePerson?.alias })}
            </h3>
            <p className="text-gray-700 leading-relaxed">{t('home.child.encouragementDesc')}</p>
          </div>
        </div>
      </div>

      {/* Parental Password Modal */}
      <ParentalPasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSubmit={handlePasswordSubmit}
        error={passwordError}
      />
    </>
  );
};
