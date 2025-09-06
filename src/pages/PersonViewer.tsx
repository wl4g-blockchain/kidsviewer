import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useTranslation } from '../i18n/I18nProvider';
import { Lock, Clock, BookOpen, ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';
import { Question, WatchingSessionResponse } from '../types';
import { ElectronWebViewer } from '../components/ElectronWebViewer';

interface WatchingSession extends WatchingSessionResponse {
  platformName: string;
  platformUrl: string;
  description?: string;
}

export const PersonViewer: React.FC = () => {
  const navigate = useNavigate();
  const { activePerson, apiHandler } = useAuthStore();
  const [watchingSession, setWatchingSession] = useState<WatchingSession | null>(null);
  const [remainingTime, setRemainingTime] = useState(0);
  const [currentQuestions, setCurrentQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [showQuestions, setShowQuestions] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [dailyTimeExceeded, setDailyTimeExceeded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false); // Add loading state

  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const t = useTranslation();

  // Initialize watching session from sessionStorage
  useEffect(() => {
    const sessionData = sessionStorage.getItem('currentWatchingSession');
    if (sessionData) {
      try {
        const session = JSON.parse(sessionData) as WatchingSession;
        setWatchingSession(session);
        startWatchingCheck(session.watchingToken);
      } catch (error) {
        console.error('Failed to parse watching session:', error);
        navigate('/person-page');
      }
    } else {
      navigate('/person-page');
    }

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [navigate]);

  // Start periodic checking of watching status
  const startWatchingCheck = (token: string) => {
    // Initial check
    checkWatchingStatus(token);

    // Set up interval to check every 3 seconds
    checkIntervalRef.current = setInterval(() => {
      checkWatchingStatus(token);
    }, 3000);
  };

  // Check watching status with API
  const checkWatchingStatus = async (token: string) => {
    try {
      const response = await apiHandler.checkWatching(token);

      if (response.errcode === '200' && response.data) {
        const { remainingTime, questions, dailyTimeExceeded } = response.data;

        // Update remaining time from API response
        if (remainingTime !== undefined) {
          setRemainingTime(remainingTime);
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
        setError(response.errmsg || t('errors.unknownError'));
      }
    } catch (error) {
      console.error('Error checking watching status:', error);
      setError(t('errors.networkError'));
    }
  };

  // Handle video load error
  const handleVideoLoadError = (errorMessage: string) => {
    console.error('Video load error:', errorMessage);
    setVideoError(errorMessage);
  };

  // Handle video load success
  const handleVideoLoadSuccess = () => {
    console.log('Video loaded successfully');
    setVideoError(null);
  };

  // Handle refresh button click
  const handleRefresh = async () => {
    if (!watchingSession) return;

    setIsLoading(true);
    setError(null);

    try {
      await checkWatchingStatus(watchingSession.watchingToken);
    } catch (error) {
      console.error('Error refreshing watching status:', error);
      setError(t('errors.networkError'));
    } finally {
      setIsLoading(false);
    }
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
        setError(response.errmsg || t('errors.unknownError'));
      }
    } catch (error) {
      console.error('Error verifying answer:', error);
      setError(t('errors.networkError'));
    }
  };

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle back navigation
  const handleBack = () => {
    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current);
    }
    sessionStorage.removeItem('currentWatchingSession');
    navigate('/person-page');
  };

  if (!activePerson || !watchingSession) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <p className="text-gray-600 text-lg mb-4">{t('personViewer.cannotAccessViewingPage')}</p>
        <button
          onClick={() => navigate('/person-page')}
          className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
        >
          {t('personViewer.returnToHome')}
        </button>
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
            onClick={handleBack}
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
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex items-center justify-between">
          <button onClick={handleBack} className="inline-flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors">
            <ArrowLeft className="w-5 h-5 mr-2" />
            {t('personViewer.back')}
          </button>
          <div className="text-center">
            <h1 className="text-xl font-bold text-gray-900">{watchingSession.platformName}</h1>
            <div className="flex items-center justify-center space-x-2 mt-1">
              <Clock className="w-4 h-4 text-blue-600" />
              <span className="text-lg font-medium text-blue-600">{formatTime(remainingTime * 60)}</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="inline-flex items-center px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Clock className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {videoError && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">
            {t('personViewer.videoLoadWarning')}: {videoError}
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

          {/* Video Player */}
          <ElectronWebViewer
            url={watchingSession.platformUrl}
            platformName={watchingSession.platformName}
            personId={activePerson.id}
            onLoadError={handleVideoLoadError}
            onLoadSuccess={handleVideoLoadSuccess}
            className="aspect-video"
          />

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
                {t('personViewer.remainingTime')}: {formatTime(remainingTime * 60)}
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

                <h3 className="text-lg font-medium text-gray-900 mb-4 text-center">{currentQuestions[currentQuestionIndex]?.content}</h3>

                {/* Answer Input */}
                {currentQuestions[currentQuestionIndex]?.type === 'multiple-choice' && currentQuestions[currentQuestionIndex]?.options ? (
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
                      <strong>{t('personViewer.questions.explanation')}:</strong> {currentQuestions[currentQuestionIndex]?.explanation}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
