import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useTranslation, useLanguage } from '../i18n/I18nProvider';
import { Video, Trophy, Crown, Baby, Play, AlertCircle, RefreshCw, Clock, Lock, BookOpen, ArrowLeft, Loader2 } from 'lucide-react';
import { ParentalPasswordModal } from '../components/ParentalPasswordModal';
import { Question } from '../types';
import { ElectronWebViewer } from '../components/ElectronWebViewer';
import { IOSWebViewer } from '../components/IOSWebViewer';
import { isPlatformIOS } from '../utils/platformUtil';

interface AccessibleUrl {
  platformNameEN: string;
  platformNameCN: string;
  url: string;
  description?: string;
}

interface WatchingSession {
  watchingToken: string;
  platformName: string;
  platformUrl: string;
  description?: string;
  sessionTimeLimit?: number;
  remainingDailyTime?: number;
}

export const PersonHome: React.FC = () => {
  const { activePerson, switchToParent, apiHandler } = useAuthStore();
  const t = useTranslation();
  const { currentLanguage } = useLanguage();

  // Platform list states
  const [accessibleUrls, setAccessibleUrls] = useState<AccessibleUrl[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false); // Separate loading state for refresh
  const [error, setError] = useState<string | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Watching states
  const [watchingSession, setWatchingSession] = useState<WatchingSession | null>(null);
  const [remainingTime, setRemainingTime] = useState(0);
  const [currentQuestions, setCurrentQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [showQuestions, setShowQuestions] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [dailyTimeExceeded, setDailyTimeExceeded] = useState(false);
  const [webViewerError, setWebViewerError] = useState<string | null>(null);
  const [watchingError, setWatchingError] = useState<string | null>(null); // Separate error for watching
  const [isCheckingWatching, setIsCheckingWatching] = useState(false); // Prevent concurrent checks
  const [errorCount, setErrorCount] = useState(0); // Track consecutive errors

  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Helper function to get platform name based on current language
  const getPlatformName = (platform: AccessibleUrl): string => {
    return currentLanguage === 'zh' ? platform.platformNameCN : platform.platformNameEN;
  };

  // Load child accessible URLs
  useEffect(() => {
    if (activePerson) {
      loadPersonAccessibles();
    }
  }, [activePerson]);

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, []);

  const loadPersonAccessibles = async () => {
    if (!activePerson) {
      setError(t('person.noActivePersonFound'));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log(`Loading accessible URLs for person ${activePerson.alias} (ID: ${activePerson.id})...`);

      const response = await apiHandler.getPersonPlatforms(activePerson.id);

      console.log('API response:', response);

      if (response.errcode === '200' && response.data) {
        console.log(`Successfully loaded ${response.data.length} accessible platforms:`, response.data);
        setAccessibleUrls(response.data);
      } else {
        console.error('Failed to load accessible URLs:', response.errmsg);
        setError(response.errmsg || t('person.loadAccessibleUrlsFailed'));
      }
    } catch (error) {
      console.error('Error occurred while loading person accessible URLs:', error);
      setError(error instanceof Error ? error.message : t('person.loadContentError'));
    } finally {
      setIsLoading(false);
    }
  };

  // Reload data with proper loading state
  const handleRefresh = async () => {
    if (watchingSession) {
      // If watching, refresh watching status
      setIsRefreshing(true);
      setWatchingError(null);
      setErrorCount(0); // Reset error count on manual refresh
      try {
        await checkWatchingStatus(watchingSession.watchingToken);
      } catch (error) {
        console.error('Error refreshing watching status:', error);
        setWatchingError(t('errors.networkError'));
      } finally {
        setIsRefreshing(false);
      }
    } else {
      // If not watching, refresh platform list
      await loadPersonAccessibles();
    }
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
      if (response.errcode === '200' && response.data) {
        switchToParent();
        setShowPasswordModal(false);
        setPasswordError('');
      } else {
        setPasswordError(response.errmsg || t('errors.invalidInput'));
      }
    } catch (error) {
      setPasswordError(t('errors.unknownError'));
    }
  };

  // Start periodic checking of watching status
  const startWatchingCheck = (token: string) => {
    // Clear any existing interval
    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current);
    }

    // Reset error count when starting new session
    setErrorCount(0);
    setWatchingError(null);

    // Initial check
    checkWatchingStatus(token);

    // Set up interval to check every 3 seconds
    checkIntervalRef.current = setInterval(() => {
      checkWatchingStatus(token);
    }, 3000);
  };

  // Check watching status with API - with error handling to prevent infinite loops
  const checkWatchingStatus = async (token: string) => {
    // Prevent concurrent checks
    if (isCheckingWatching) {
      return;
    }

    setIsCheckingWatching(true);

    try {
      const response = await apiHandler.checkWatching(token);
      if (response.errcode === '200' && response.data) {
        const { remainingTime, questions, dailyTimeExceeded } = response.data;

        // Reset error count on successful response
        setErrorCount(0);
        setWatchingError(null);

        // Update remaining time from API response (in minutes, convert to seconds for display)
        if (remainingTime !== undefined) {
          setRemainingTime(remainingTime); // seconds
        }

        if (dailyTimeExceeded) {
          setDailyTimeExceeded(true);
          setShowQuestions(false);
          if (checkIntervalRef.current) {
            clearInterval(checkIntervalRef.current);
          }
          return;
        }

        if (questions && questions.length > 0) {
          setCurrentQuestions(questions);
          setCurrentQuestionIndex(0);
          setUserAnswer('');
          setShowQuestions(true);
          setShowResult(false);
        } else {
          setShowQuestions(false);
          setDailyTimeExceeded(false);
        }
      } else {
        // Handle specific error codes
        if (response.errcode === '4018') {
          // Session time limit exceeded - this is expected behavior, show questions
          const { questions } = response.data || {};
          if (questions && questions.length > 0) {
            setCurrentQuestions(questions);
            setCurrentQuestionIndex(0);
            setUserAnswer('');
            setShowQuestions(true);
            setShowResult(false);
          }
          // Reset error count since this is expected behavior
          setErrorCount(0);
          setWatchingError(null);
        } else {
          // Other errors - increment error count and handle accordingly
          const newErrorCount = errorCount + 1;
          setErrorCount(newErrorCount);

          console.error('Watching status check failed:', response.errmsg);

          // WARNING: If too many consecutive errors, stop the interval and show error
          if (newErrorCount >= 3) {
            setWatchingError(response.errmsg || t('errors.unknownError'));
            if (checkIntervalRef.current) {
              clearInterval(checkIntervalRef.current);
            }
          }
        }
      }
    } catch (error) {
      // Increment error count and handle accordingly
      const newErrorCount = errorCount + 1;
      setErrorCount(newErrorCount);

      console.error('Error checking watching status:', error);

      // If too many consecutive errors, stop the interval and show error
      if (newErrorCount >= 3) {
        setWatchingError(t('errors.networkError'));
        if (checkIntervalRef.current) {
          clearInterval(checkIntervalRef.current);
        }
      }
    } finally {
      setIsCheckingWatching(false);
    }
  };

  // Handle web viewer load error
  const handleWebViewerLoadError = (errorMessage: string) => {
    console.error('Video load error:', errorMessage);
    setWebViewerError(errorMessage);
  };

  // Handle web viewer load success
  const handleWebViewerLoadSuccess = () => {
    console.log('WebViewer loaded successfully');
    setWebViewerError(null);
  };

  // Handle answer submission
  const handleAnswerSubmit = async () => {
    if (!watchingSession || !currentQuestions[currentQuestionIndex]) return;

    const question = currentQuestions[currentQuestionIndex];

    try {
      const response = await apiHandler.verifyQuestion(watchingSession.watchingToken, question.content, userAnswer);

      if (response.errcode === '200' && response.data) {
        const { correct, newWatchingToken } = response.data;

        setIsCorrect(correct);
        setShowResult(true);

        if (correct && newWatchingToken) {
          // Update session with new token
          const updatedSession = {
            ...watchingSession,
            watchingToken: newWatchingToken,
          };
          setWatchingSession(updatedSession);
          sessionStorage.setItem('currentWatchingSession', JSON.stringify(updatedSession));

          // Continue watching after a brief delay
          setTimeout(() => {
            if (currentQuestionIndex < currentQuestions.length - 1) {
              setCurrentQuestionIndex(prev => prev + 1);
              setUserAnswer('');
              setShowResult(false);
            } else {
              setShowQuestions(false);
              setShowResult(false);
              setCurrentQuestions([]);
              setCurrentQuestionIndex(0);

              if (checkIntervalRef.current) {
                clearInterval(checkIntervalRef.current);
              }
              startWatchingCheck(newWatchingToken);
            }
          }, 2000);
        } else {
          setTimeout(() => {
            setUserAnswer('');
            setShowResult(false);
          }, 2000);
        }
      } else {
        setWatchingError(response.errmsg || t('errors.unknownError'));
      }
    } catch (error) {
      console.error('Error verifying answer:', error);
      setWatchingError(t('errors.networkError'));
    }
  };

  // Format time display - shows seconds for real-time updates
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle opening a URL - start watching session
  const handleOpenUrl = async (urlData: AccessibleUrl) => {
    if (!activePerson) return;

    try {
      setIsLoading(true);
      setWatchingError(null);
      setErrorCount(0); // Reset error count when starting new session
      const response = await apiHandler.startWatching(activePerson.id, urlData.url);

      if (response.errcode === '200' && response.data) {
        const session: WatchingSession = {
          watchingToken: response.data.watchingToken,
          platformName: getPlatformName(urlData),
          platformUrl: urlData.url,
          description: urlData.description,
        };
        setWatchingSession(session);
        startWatchingCheck(session.watchingToken);
      } else {
        setWatchingError(response.errmsg || t('errors.unknownError'));
      }
    } catch (error) {
      console.error('Error starting watching session:', error);
      setWatchingError(t('errors.networkError'));
    } finally {
      setIsLoading(false);
    }
  };

  // Handle stopping watching session
  const handleStopWatching = () => {
    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current);
    }
    setWatchingSession(null);
    setShowQuestions(false);
    setCurrentQuestions([]);
    setCurrentQuestionIndex(0);
    setUserAnswer('');
    setShowResult(false);
    setDailyTimeExceeded(false);
    setWebViewerError(null);
    setWatchingError(null);
    setRemainingTime(0);
    setErrorCount(0); // Reset error count
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

  if (dailyTimeExceeded) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock className="w-10 h-10 text-orange-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('personViewer.dailyTimeLimitReached')}</h2>
          <p className="text-gray-600 mb-6">{t('personViewer.dailyTimeLimitMessage')}</p>
          <button
            onClick={handleStopWatching}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors inline-flex items-center"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            {t('personViewer.returnToHome')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-8 py-8">
        {watchingSession ? (
          // Watching View
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="flex items-center justify-between">
                <button
                  onClick={handleStopWatching}
                  className="inline-flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  {t('personViewer.back')}
                </button>
                <div className="text-center">
                  <h1 className="text-xl font-bold text-gray-900">{watchingSession.platformName}</h1>
                  <div className="flex items-center justify-center space-x-2 mt-1">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span className="text-lg font-medium text-blue-600">{formatTime(remainingTime)}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="inline-flex items-center px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title={t('common.refresh')}
                  >
                    {isRefreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {watchingError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <p className="text-red-800">{watchingError}</p>
                  <button onClick={handleRefresh} className="ml-4 text-sm text-red-600 hover:text-red-800 underline">
                    {t('common.retry')}
                  </button>
                </div>
              </div>
            )}

            {webViewerError && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800">
                  {t('personViewer.videoLoadWarning')}: {webViewerError}
                </p>
              </div>
            )}

            {/* Video Content Area */}
            {!showQuestions ? (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="mb-4">
                  <h3 className="text-xl font-medium text-gray-800 mb-2">
                    {t('personViewer.watching')} {watchingSession.platformName}
                  </h3>
                  <p className="text-gray-600">{watchingSession.description || t('personViewer.enjoyWatching')}</p>
                </div>

                {/* Video Player - Conditionally render based on platform */}
                {isPlatformIOS() ? (
                  <IOSWebViewer
                    url={watchingSession.platformUrl}
                    platformName={watchingSession.platformName}
                    personId={activePerson.id}
                    onLoadError={handleWebViewerLoadError}
                    onLoadSuccess={handleWebViewerLoadSuccess}
                    className="aspect-video"
                  />
                ) : (
                  <ElectronWebViewer
                    url={watchingSession.platformUrl}
                    platformName={watchingSession.platformName}
                    personId={activePerson.id}
                    onLoadError={handleWebViewerLoadError}
                    onLoadSuccess={handleWebViewerLoadSuccess}
                    className="aspect-video"
                  />
                )}

                {/* Video info bar */}
                <div className="mt-4 flex items-center justify-between bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-gray-700">{t('personViewer.watching')}</span>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span>
                      {t('personViewer.platform')}: {watchingSession.platformName}
                    </span>
                    <span>•</span>
                    <span>
                      {t('personViewer.remainingTime')}: {formatTime(remainingTime)}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              /* Questions Modal */
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Lock className="w-8 h-8 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">{t('personViewer.answerQuestionsToContinue')}</h2>
                  <p className="text-gray-600">
                    {t('personViewer.answerQuestionsRemaining', { count: currentQuestions.length - currentQuestionIndex })}
                  </p>
                </div>

                {currentQuestions.length > 0 && (
                  <div className="max-w-2xl mx-auto">
                    {/* Question Progress */}
                    <div className="flex items-center justify-center space-x-2 mb-6">
                      {currentQuestions.map((_, index) => (
                        <div
                          key={index}
                          className={`w-3 h-3 rounded-full ${
                            index < currentQuestionIndex ? 'bg-green-500' : index === currentQuestionIndex ? 'bg-blue-500' : 'bg-gray-300'
                          }`}
                        />
                      ))}
                    </div>

                    {/* Current Question */}
                    <div className="bg-gray-50 rounded-lg p-6 mb-6">
                      <div className="text-center mb-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                          {t(`personViewer.questions.${currentQuestions[currentQuestionIndex]?.subject}`)}
                        </span>
                        <span className="ml-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                          {t(`personViewer.questions.difficulty.${currentQuestions[currentQuestionIndex]?.difficulty}`)}
                        </span>
                      </div>

                      <h3 className="text-lg font-medium text-gray-900 mb-4 text-center">
                        {currentQuestions[currentQuestionIndex]?.content}
                      </h3>

                      {/* Answer Input */}
                      {currentQuestions[currentQuestionIndex]?.type === 'multiple-choice' &&
                      currentQuestions[currentQuestionIndex]?.options ? (
                        <div className="space-y-3">
                          {currentQuestions[currentQuestionIndex]?.options!.map((option, index) => (
                            <button
                              key={index}
                              onClick={() => setUserAnswer(option)}
                              className={`w-full p-3 text-left rounded-lg border transition-colors duration-200 ${
                                userAnswer === option ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                              }`}
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={userAnswer}
                          onChange={e => setUserAnswer(e.target.value)}
                          placeholder={t('personViewer.questions.answer')}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      )}

                      {/* Submit Button */}
                      <div className="mt-6 text-center">
                        <button
                          onClick={handleAnswerSubmit}
                          disabled={!userAnswer}
                          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                        >
                          <BookOpen className="w-5 h-5 mr-2" />
                          {t('common.submit')}
                        </button>
                      </div>
                    </div>

                    {/* Result Display */}
                    {showResult && (
                      <div className={`text-center p-4 rounded-lg ${isCorrect ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                        <div className="text-lg font-medium mb-2">
                          {isCorrect ? t('personViewer.questions.correct') : t('personViewer.questions.incorrect')}
                        </div>
                        {currentQuestions[currentQuestionIndex]?.explanation && (
                          <div className="text-sm">
                            <strong>{t('personViewer.questions.explanation')}:</strong>{' '}
                            {currentQuestions[currentQuestionIndex]?.explanation}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          // Platform List View
          <>
            {/* Header section */}
            <div className="text-center pt-8 px-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 via-emerald-500 to-cyan-500 rounded-full shadow-2xl mb-6 kids-pulse-element">
                <Baby className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl font-black bg-gradient-to-r from-emerald-600 via-cyan-600 to-blue-600 bg-clip-text text-transparent mb-3">
                🌟 {t('home.child.title', { name: activePerson?.alias || t('home.child.defaultName') })}
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
                              <h3 className="font-bold text-gray-800 text-lg">{getPlatformName(urlData)}</h3>
                              {/* Difficulty and time limits are now managed at Person level */}
                              {urlData.description && (
                                <div className="text-xs text-gray-600 mt-2">
                                  {urlData.description}
                                </div>
                              )}
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
                  {t('home.child.encouragement', { name: activePerson?.alias || t('home.child.defaultName') })}
                </h3>
                <p className="text-gray-700 leading-relaxed">{t('home.child.encouragementDesc')}</p>
              </div>
            </div>
          </>
        )}
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
