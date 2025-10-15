import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
// import { useSessionData } from '../components/providers/AuthProvider';
import { useThemeStore } from '../stores/themeStore';
import { useTranslation, useLanguage } from '../i18n/I18nProvider';
import { useAppContext } from '../App';
import { APIFactory } from '../services/APIFactory';
import {
  Video,
  Trophy,
  Crown,
  Baby,
  Play,
  AlertCircle,
  RefreshCw,
  Clock,
  Lock,
  BookOpen,
  ArrowLeft,
  Loader2,
  Coins,
  PiggyBank,
  TrendingUp,
} from 'lucide-react';
import { ParentalPasswordModal } from '../components/ParentalPasswordModal';
import { Question, Platform, RewardConfig, PiggyBankConfig, PiggyBankBalance, AaveProduct, InvestmentConfig } from '../types';
import { web3Service } from '../services/web3Service';
import { ElectronWebViewer } from '../components/ElectronWebViewer';
import { IOSWebViewer } from '../components/IOSWebViewer';
import { isPlatformIOS } from '../utils/platformUtil';

// Note: Using Platform interface from types instead of PersonPlatformInfo

interface WatchingSession {
  watchingToken: string;
  platformId: string;
  platformName: string;
  platformUrl: string;
  description?: string;
  sessionTimeLimit: number;
  remainingDailyTime?: number;
}

export const PersonHome: React.FC = () => {
  // const { .* } = useAuthStore();
  const { isDark } = useThemeStore();
  const { activePerson, switchToParentView } = useAppContext();
  const t = useTranslation();
  const { currentLanguage } = useLanguage();

  // Get API handler instance - memoized to avoid recreating on every render
  const apiHandler = useMemo(() => APIFactory.createAPIHandler(), []);

  // Platform list states
  const [personPlatforms, setPersonPlatforms] = useState<Platform[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false); // Separate loading state for refresh
  const [error, setError] = useState<string | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Watching states - simplified, watching logic moved to WebViewer components
  const [watchingSession, setWatchingSession] = useState<WatchingSession | null>(null);
  const [currentQuestions, setCurrentQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [showQuestions, setShowQuestions] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [dailyTimeExceeded, setDailyTimeExceeded] = useState(false);
  const [webViewerError, setWebViewerError] = useState<string | null>(null);
  const [watchingError, setWatchingError] = useState<string | null>(null);

  // Countdown states - will be updated by WebViewer components
  const [remainingTime, setRemainingTime] = useState(0);
  const [remainingDailyTime, setRemainingDailyTime] = useState(0);

  // Web3 states
  const [rewardConfig, setRewardConfig] = useState<RewardConfig | null>(null);
  const [piggyBankConfig, setPiggyBankConfig] = useState<PiggyBankConfig | null>(null);
  const [piggyBankBalance, setPiggyBankBalance] = useState<PiggyBankBalance | null>(null);
  const [availableAaveProducts, setAvailableAaveProducts] = useState<AaveProduct[]>([]);
  const [investmentConfig, setInvestmentConfig] = useState<InvestmentConfig | null>(null);
  const [realTimeEarnings, setRealTimeEarnings] = useState<number>(0);
  const [selectedAaveProduct, setSelectedAaveProduct] = useState<AaveProduct | null>(null);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [withdrawalReason, setWithdrawalReason] = useState('');

  // Helper function to get platform name based on current language
  const getPlatformName = (platform: Platform): string => {
    return currentLanguage === 'zh' ? platform.nameCN : platform.nameEN;
  };

  // Adapter function to convert API response to Platform interface
  const adaptApiPlatformToPlatform = (apiPlatform: {
    platformId: string;
    platformNameEN: string;
    platformNameCN: string;
    url: string;
    description?: string;
  }): Platform => {
    return {
      id: parseInt(apiPlatform.platformId),
      nameEN: apiPlatform.platformNameEN,
      nameCN: apiPlatform.platformNameCN,
      url: apiPlatform.url,
      description: apiPlatform.description,
      ageGroups: ['preschool', 'young', 'older'] as ('preschool' | 'young' | 'older' | 'teen')[], // Default age groups
      createdAt: new Date(), // Default to current date
      updatedAt: new Date(), // Default to current date
    };
  };

  // Load child accessible URLs
  useEffect(() => {
    if (activePerson) {
      loadPersonPlatforms();
      loadWeb3Configs();
    }
  }, [activePerson]);

  // Note: Question handling and watching status checking is now managed by WebViewer components
  // PersonHome only manages the session creation and UI state

  const loadPersonPlatforms = async () => {
    if (!activePerson) {
      setError(t('person.noActivePersonFound'));
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      console.log(`Loading person platforms for person ${activePerson.alias} (ID: ${activePerson.id})...`);
      console.log('ActivePerson details:', activePerson);

      const response = await apiHandler.getPersonPlatforms(activePerson.id.toString());
      console.info('Loaded the person platforms response:', response);

      if (response.errcode === '200' && response.data) {
        console.log(`Successfully loaded ${response.data.length} person platforms:`, response.data);
        // Convert API response to Platform interface
        const adaptedPlatforms = response.data.map(adaptApiPlatformToPlatform);
        setPersonPlatforms(adaptedPlatforms);
      } else {
        console.error('Failed to load person platforms:', response.errmsg);
        setError(response.errmsg || t('person.loadAccessibleUrlsFailed'));
      }
    } catch (error) {
      console.error('Error occurred while loading person platforms:', error);
      setError(error instanceof Error ? error.message : t('person.loadContentError'));
    } finally {
      setIsLoading(false);
    }
  };

  const loadWeb3Configs = async () => {
    try {
      // Load reward configuration
      const savedRewardConfig = localStorage.getItem('rewardConfig');
      if (savedRewardConfig) {
        const config = JSON.parse(savedRewardConfig);
        setRewardConfig(config);
      }

      // Load piggy bank configuration
      const savedPiggyBankConfig = localStorage.getItem('piggyBankConfig');
      if (savedPiggyBankConfig) {
        const config = JSON.parse(savedPiggyBankConfig);
        setPiggyBankConfig(config);
      }

      // Load available AAVE products
      const products = await web3Service.getAvailableAaveProducts();
      setAvailableAaveProducts(products);

      // Load investment configuration (mock for now)
      const mockInvestmentConfig: InvestmentConfig = {
        isEnabled: true,
        maxInvestmentAmount: '100',
        totalInvested: '25',
        approvedAaveProducts: products.map((p: AaveProduct) => p.address),
      };
      setInvestmentConfig(mockInvestmentConfig);

      // Load piggy bank balance (mock data for now)
      if (savedPiggyBankConfig) {
        const mockBalance: PiggyBankBalance = {
          token: {
            symbol: 'USDC',
            name: 'USD Coin',
            decimals: 6,
            address: '0xA0b86a33E6441b8C4C8C0C4C0C4C0C4C0C4C0C4C',
            chainId: 1,
          },
          balance: '15.75',
          formattedBalance: '15.75',
          dailyEarnings: '0.05',
          totalEarnings: '1.25',
          investmentConfig: mockInvestmentConfig,
        };
        setPiggyBankBalance(mockBalance);
      }

      // Start real-time earnings simulation
      startRealTimeEarningsSimulation();
    } catch (error) {
      console.error('Failed to load Web3 configs:', error);
    }
  };

  // Real-time earnings simulation
  const startRealTimeEarningsSimulation = () => {
    const interval = setInterval(() => {
      setRealTimeEarnings(prev => {
        // Simulate small incremental earnings
        const increment = Math.random() * 0.0001; // Very small increment
        return prev + increment;
      });
    }, 1000); // Update every second

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  };

  // Handle withdrawal request
  const handleWithdrawalRequest = async () => {
    if (!withdrawalAmount || !withdrawalReason) {
      alert('Please fill in both amount and reason');
      return;
    }

    try {
      // In a real implementation, this would call the smart contract
      // For now, we'll simulate the request
      const mockRequest = {
        id: Date.now(),
        amount: withdrawalAmount,
        reason: withdrawalReason,
        timestamp: Math.floor(Date.now() / 1000),
        status: 'pending',
      };

      console.log('Withdrawal request submitted:', mockRequest);

      // Show success message
      alert('Withdrawal request submitted! Your parent will review it.');

      // Reset form and close modal
      setWithdrawalAmount('');
      setWithdrawalReason('');
      setShowWithdrawalModal(false);
    } catch (error) {
      console.error('Failed to submit withdrawal request:', error);
      alert('Failed to submit withdrawal request. Please try again.');
    }
  };

  // Reload data with proper loading state
  const handleRefresh = async () => {
    if (watchingSession) {
      // If watching, just clear local errors (WebViewer handles its own refresh)
      setIsRefreshing(true);
      setWatchingError(null);
      setIsRefreshing(false);
    } else {
      // If not watching, refresh platform list
      await loadPersonPlatforms();
    }
  };

  const handleSwitchToParent = () => {
    setShowPasswordModal(true);
    setPasswordError('');
  };

  const switchToParent = () => {
    switchToParentView();
  };

  const handlePasswordSubmit = async (password: string) => {
    if (!password.trim()) {
      setPasswordError(t('auth.password') + t('common.error'));
      return;
    }

    try {
      // const response = await apiHandler.verifyParentalPassword(password);
      // if (response.errcode === '200' && response.data) {
      switchToParent();
      setShowPasswordModal(false);
      setPasswordError('');
      // } else {
      //   setPasswordError(response.errmsg || t('errors.invalidInput'));
      // }
    } catch (error) {
      setPasswordError(t('errors.unknownError'));
    }
  };

  // Note: Watching status checking is now handled by WebViewer components

  // Handle web viewer load error
  const handleWebViewerLoadError = useCallback((errorMessage: string) => {
    console.error('Video load error:', errorMessage);
    setWebViewerError(errorMessage);
  }, []);

  // Handle web viewer load success
  const handleWebViewerLoadSuccess = useCallback(() => {
    console.log('WebViewer loaded successfully');
    setWebViewerError(null);
  }, []);

  // Handle countdown updates from WebViewer components
  const handleCountdownUpdate = useCallback((sessionTime: number, dailyTime: number) => {
    setRemainingTime(sessionTime);
    setRemainingDailyTime(dailyTime);
  }, []);

  // Ref to store WebViewer refresh function
  const webViewerRefreshRef = useRef<(() => void) | null>(null);

  // Handle refresh button click
  const handleRefreshClick = useCallback(() => {
    if (watchingSession && webViewerRefreshRef.current) {
      // If watching, call WebViewer refresh function
      webViewerRefreshRef.current();
    } else {
      // If not watching, refresh platform list
      handleRefresh();
    }
  }, [watchingSession, handleRefresh]);

  // Handle answer submission - simplified, most logic moved to WebViewer
  const handleAnswerSubmit = async () => {
    if (!watchingSession || !currentQuestions[currentQuestionIndex]) return;

    // const question = currentQuestions[currentQuestionIndex];

    try {
      // const response = await apiHandler.verifyQuestion(watchingSession.watchingToken, question.content, userAnswer);

      // Mock response for now
      const correct = Math.random() > 0.5; // Random correct/incorrect for demo
      setIsCorrect(correct);
      setShowResult(true);

      // Continue to next question or finish after delay
      setTimeout(() => {
        if (currentQuestionIndex < currentQuestions.length - 1) {
          setCurrentQuestionIndex(prev => prev + 1);
          setUserAnswer('');
          setShowResult(false);
        } else {
          // All questions answered, reset UI
          setShowQuestions(false);
          setCurrentQuestionIndex(0);
          setUserAnswer('');
          setShowResult(false);
        }
      }, 2000);
    } catch (error) {
      console.error('Error verifying answer:', error);
      setWatchingError(t('errors.networkError'));
    }
  };

  // Format time display - shows minutes and seconds for real-time updates
  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Note: Time display formatting removed as it's now handled by the hook

  // Handle opening a URL - create session info and start watching
  const handleOpenUrl = useCallback(
    async (plat: Platform) => {
      if (!activePerson) return;

      try {
        setWatchingError(null);

        // Create session info for UI
        const session: WatchingSession = {
          watchingToken: '', // Will be set by WebViewer
          platformId: plat.id.toString(),
          platformName: getPlatformName(plat),
          platformUrl: plat.url,
          description: plat.description,
          sessionTimeLimit: 300, // 5 minutes
          remainingDailyTime: 300, // 5 minutes
        };
        setWatchingSession(session);
      } catch (error) {
        console.error('Error starting watching session:', error);
        setWatchingError(t('errors.networkError'));
      }
    },
    [activePerson, t]
  );

  // Memoize the watching session to prevent unnecessary re-renders
  const memoizedWatchingSession = useMemo(() => {
    if (!watchingSession) return null;

    return {
      ...watchingSession,
      // Ensure platformName is stable
      platformName: watchingSession.platformName,
    };
  }, [watchingSession?.platformId, watchingSession?.platformUrl, watchingSession?.platformName, watchingSession?.description]);

  // Handle stopping watching session
  const handleStopWatching = () => {
    // Clear all session state
    setWatchingSession(null);
    setCurrentQuestions([]);
    setCurrentQuestionIndex(0);
    setUserAnswer('');
    setShowQuestions(false);
    setShowResult(false);
    setDailyTimeExceeded(false);
    setWebViewerError(null);
    setWatchingError(null);
    // Reset countdown states
    setRemainingTime(0);
    setRemainingDailyTime(0);
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
      <div
        className={`flex flex-col gap-8 py-8 min-h-screen ${
          isDark ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'
        }`}
      >
        {memoizedWatchingSession ? (
          // Watching View
          <div className="space-y-6">
            {/* Header */}
            <div
              className={`rounded-lg shadow-md p-4 backdrop-filter backdrop-blur-lg ${
                isDark ? 'bg-gray-800/80 border border-gray-700' : 'bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <button
                  onClick={handleStopWatching}
                  className={`inline-flex items-center px-4 py-2 transition-colors ${
                    isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  {t('personViewer.back')}
                </button>
                <div className="text-center">
                  <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{memoizedWatchingSession.platformName}</h1>
                  <div className="flex items-center justify-center space-x-2 mt-1">
                    <Clock className="w-4 h-4 text-blue-400" />
                    <span className="text-lg font-medium text-blue-400">{t('personViewer.watchingActive')}</span>
                  </div>
                  {/* Countdown timer display */}
                  {memoizedWatchingSession && (
                    <div
                      className={`mt-2 flex items-center justify-center space-x-4 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}
                    >
                      <div className="flex items-center space-x-1">
                        <span className="font-medium">{t('personViewer.sessionTime')}:</span>
                        <span className={`font-bold ${remainingTime <= 0 ? 'text-red-400' : 'text-blue-400'}`}>
                          {remainingTime <= 0 ? t('time.timeUp') : formatTime(remainingTime)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className="font-medium">{t('personViewer.dailyTime')}:</span>
                        <span className={`font-bold ${remainingDailyTime <= 0 ? 'text-red-400' : 'text-green-400'}`}>
                          {remainingDailyTime <= 0 ? t('time.timeUp') : formatTime(remainingDailyTime)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleRefreshClick}
                    disabled={isRefreshing}
                    className={`inline-flex items-center px-3 py-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-800'
                    }`}
                    title={t('common.refresh')}
                  >
                    {isRefreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {watchingError && (
              <div
                className={`border rounded-lg p-4 backdrop-filter backdrop-blur-lg ${
                  isDark ? 'bg-red-900/20 border-red-700' : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className={isDark ? 'text-red-300' : 'text-red-800'}>{watchingError}</p>
                  <button
                    onClick={handleRefresh}
                    className={`ml-4 text-sm underline transition-colors ${
                      isDark ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-800'
                    }`}
                  >
                    {t('common.retry')}
                  </button>
                </div>
              </div>
            )}

            {webViewerError && (
              <div
                className={`border rounded-lg p-4 backdrop-filter backdrop-blur-lg ${
                  isDark ? 'bg-yellow-900/20 border-yellow-700' : 'bg-yellow-50 border-yellow-200'
                }`}
              >
                <p className={isDark ? 'text-yellow-300' : 'text-yellow-800'}>
                  {t('personViewer.videoLoadWarning')}: {webViewerError}
                </p>
              </div>
            )}

            {/* Video Content Area */}
            {!showQuestions ? (
              <div
                className={`rounded-lg shadow-md p-6 backdrop-filter backdrop-blur-lg ${
                  isDark ? 'bg-gray-800/80 border border-gray-700' : 'bg-white'
                }`}
              >
                <div className="mb-4">
                  <h3 className={`text-xl font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                    {t('personViewer.watching')} {memoizedWatchingSession.platformName}
                  </h3>
                  <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>
                    {memoizedWatchingSession.description || t('personViewer.enjoyWatching')}
                  </p>
                </div>

                {/* Video Player - Conditionally render based on platform */}
                {isPlatformIOS() ? (
                  <IOSWebViewer
                    platformId={memoizedWatchingSession.platformId}
                    platformName={memoizedWatchingSession.platformName}
                    platformUrl={memoizedWatchingSession.platformUrl}
                    personId={activePerson.id.toString()}
                    onLoadError={handleWebViewerLoadError}
                    onLoadSuccess={handleWebViewerLoadSuccess}
                    onCountdownUpdate={handleCountdownUpdate}
                    onRefreshRef={webViewerRefreshRef}
                    className="aspect-video"
                  />
                ) : (
                  <ElectronWebViewer
                    platformId={memoizedWatchingSession.platformId}
                    platformName={memoizedWatchingSession.platformName}
                    platformUrl={memoizedWatchingSession.platformUrl}
                    personId={activePerson.id.toString()}
                    onLoadError={handleWebViewerLoadError}
                    onLoadSuccess={handleWebViewerLoadSuccess}
                    onCountdownUpdate={handleCountdownUpdate}
                    onRefreshRef={webViewerRefreshRef}
                    className="aspect-video"
                  />
                )}

                {/* Video info bar */}
                <div
                  className={`mt-4 flex items-center justify-between rounded-lg p-4 backdrop-filter backdrop-blur-lg ${
                    isDark ? 'bg-gray-700/50 border border-gray-600' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                      {t('personViewer.watching')}
                    </span>
                  </div>
                  <div className={`flex items-center space-x-4 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    <span>
                      {t('personViewer.platform')}: {memoizedWatchingSession.platformName}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              /* Questions Modal */
              <div
                className={`rounded-lg shadow-md p-6 backdrop-filter backdrop-blur-lg ${
                  isDark ? 'bg-gray-800/80 border border-gray-700' : 'bg-white'
                }`}
              >
                <div className="text-center mb-6">
                  <div
                    className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                      isDark ? 'bg-blue-900/50 border border-blue-700' : 'bg-blue-100'
                    }`}
                  >
                    <Lock className={`w-8 h-8 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                  </div>
                  <h2 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {t('personViewer.answerQuestionsToContinue')}
                  </h2>
                  <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>
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
                    <div
                      className={`rounded-lg p-6 mb-6 backdrop-filter backdrop-blur-lg ${
                        isDark ? 'bg-gray-700/50 border border-gray-600' : 'bg-gray-50'
                      }`}
                    >
                      <div className="text-center mb-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            isDark ? 'bg-blue-900/50 text-blue-300 border border-blue-700' : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {t(`personViewer.questions.${currentQuestions[currentQuestionIndex]?.subject}`)}
                        </span>
                        <span
                          className={`ml-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            isDark ? 'bg-purple-900/50 text-purple-300 border border-purple-700' : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {t(`personViewer.questions.difficulty.${currentQuestions[currentQuestionIndex]?.difficulty}`)}
                        </span>
                      </div>

                      <h3 className={`text-lg font-medium mb-4 text-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
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
                                userAnswer === option
                                  ? isDark
                                    ? 'border-blue-400 bg-blue-900/30 text-white'
                                    : 'border-blue-500 bg-blue-50 text-gray-900'
                                  : isDark
                                  ? 'border-gray-600 bg-gray-800/50 text-gray-200 hover:border-gray-500 hover:bg-gray-700/50'
                                  : 'border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50'
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
                          className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                            isDark
                              ? 'bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-400 focus:border-blue-400'
                              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500'
                          }`}
                        />
                      )}

                      {/* Submit Button */}
                      <div className="mt-6 text-center">
                        <button
                          onClick={handleAnswerSubmit}
                          disabled={!userAnswer}
                          className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 ${
                            isDark
                              ? 'text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 focus:ring-offset-gray-800'
                              : 'text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 focus:ring-offset-white'
                          }`}
                        >
                          <BookOpen className="w-5 h-5 mr-2" />
                          {t('common.submit')}
                        </button>
                      </div>
                    </div>

                    {/* Result Display */}
                    {showResult && (
                      <div
                        className={`text-center p-4 rounded-lg backdrop-filter backdrop-blur-lg ${
                          isCorrect
                            ? isDark
                              ? 'bg-green-900/30 text-green-300 border border-green-700'
                              : 'bg-green-50 text-green-800'
                            : isDark
                            ? 'bg-red-900/30 text-red-300 border border-red-700'
                            : 'bg-red-50 text-red-800'
                        }`}
                      >
                        <div className="text-lg font-medium mb-2">
                          {isCorrect ? t('personViewer.questions.correct') : t('personViewer.questions.incorrect')}
                        </div>
                        {currentQuestions[currentQuestionIndex]?.explanation && (
                          <div className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
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
              <h1
                className={`text-4xl font-black mb-3 ${
                  isDark
                    ? 'bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent'
                    : 'bg-gradient-to-r from-emerald-600 via-cyan-600 to-blue-600 bg-clip-text text-transparent'
                }`}
              >
                🌟 {t('home.child.title', { name: activePerson?.alias || t('home.child.defaultName') })}
              </h1>
              <p className={`text-lg max-w-2xl mx-auto ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>✨ {t('home.child.subtitle')}</p>
            </div>

            {/* Available platforms/URLs */}
            <div className="px-4">
              <div
                className={`p-6 backdrop-filter backdrop-blur-lg ${
                  isDark
                    ? 'bg-gray-800/80 border border-gray-700 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-200'
                    : 'card-modern'
                }`}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className={`text-2xl font-bold flex items-center ${isDark ? 'text-white' : 'text-gray-800'}`}>
                    <Video className="w-6 h-6 mr-2 text-green-500" />
                    🎬 {t('home.child.availablePlatforms')}
                  </h2>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleRefresh}
                      disabled={isLoading}
                      className={`text-sm rounded-lg px-3 py-1 transition-colors flex items-center disabled:opacity-50 ${
                        isDark ? 'bg-gray-600 text-white hover:bg-gray-500' : 'bg-gray-500 text-white hover:bg-gray-600'
                      }`}
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
                  <div
                    className={`mb-6 p-4 border rounded-md backdrop-filter backdrop-blur-lg ${
                      isDark ? 'bg-red-900/20 border-red-700' : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex">
                      <AlertCircle className="w-5 h-5 text-red-400" />
                      <div className="ml-3">
                        <p className={`text-sm ${isDark ? 'text-red-300' : 'text-red-800'}`}>{error}</p>
                        <button
                          onClick={handleRefresh}
                          className={`mt-2 text-sm underline transition-colors ${
                            isDark ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-800'
                          }`}
                        >
                          {t('common.retry')}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {isLoading ? (
                  <div className="text-center py-8">
                    <div
                      className={`animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4 ${
                        isDark ? 'border-blue-400' : 'border-blue-600'
                      }`}
                    ></div>
                    <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>{t('person.loadingAccessiblePlatforms')}</p>
                  </div>
                ) : personPlatforms.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {personPlatforms.map((plat, index) => (
                      <div
                        key={index}
                        className={`rounded-xl p-4 border hover:shadow-lg transition-all duration-200 group backdrop-filter backdrop-blur-lg ${
                          isDark
                            ? 'bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-700 hover:border-purple-600'
                            : 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center">
                            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white mr-3 group-hover:scale-110 transition-transform">
                              <Play className="w-6 h-6" />
                            </div>
                            <div>
                              <h3 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-800'}`}>{getPlatformName(plat)}</h3>
                              {/* Difficulty and time limits are now managed at Person level */}
                              {plat.description && (
                                <div className={`text-xs mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{plat.description}</div>
                              )}
                            </div>
                          </div>
                        </div>
                        {plat.description && (
                          <p className={`text-sm mb-4 leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{plat.description}</p>
                        )}
                        <button
                          onClick={() => handleOpenUrl(plat)}
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
                    <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{t('home.child.noVideos')}</h3>
                    <p className={`mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{t('home.child.noVideosDesc')}</p>
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
              <div
                className={`p-6 backdrop-filter backdrop-blur-lg ${
                  isDark
                    ? 'bg-gray-800/80 border border-gray-700 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-200'
                    : 'card-modern'
                }`}
              >
                <h2 className={`text-2xl font-bold mb-6 flex items-center ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  <Trophy className="w-6 h-6 mr-2 text-yellow-500" />
                  🏆 {t('home.child.todayAchievements')}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div
                    className={`text-center rounded-xl p-6 border backdrop-filter backdrop-blur-lg ${
                      isDark
                        ? 'bg-gradient-to-br from-blue-900/30 to-cyan-900/30 border-blue-700'
                        : 'bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200'
                    }`}
                  >
                    <div className="text-6xl mb-3">⏰</div>
                    <h3 className={`font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>{t('home.child.studyTime')}</h3>
                    <div className={`text-4xl font-black mb-1 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>0</div>
                    <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{t('home.child.studyTimeUnit')}</p>
                  </div>
                  <div
                    className={`text-center rounded-xl p-6 border backdrop-filter backdrop-blur-lg ${
                      isDark
                        ? 'bg-gradient-to-br from-yellow-900/30 to-orange-900/30 border-yellow-700'
                        : 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200'
                    }`}
                  >
                    <div className="text-6xl mb-3">⭐</div>
                    <h3 className={`font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>{t('home.child.stars')}</h3>
                    <div className={`text-4xl font-black mb-1 ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>0</div>
                    <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{t('home.child.starsDesc')}</p>
                  </div>
                  <div
                    className={`text-center rounded-xl p-6 border backdrop-filter backdrop-blur-lg ${
                      isDark
                        ? 'bg-gradient-to-br from-green-900/30 to-emerald-900/30 border-green-700'
                        : 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200'
                    }`}
                  >
                    <div className="text-6xl mb-3">🎯</div>
                    <h3 className={`font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>{t('home.child.challenge')}</h3>
                    <div className={`text-4xl font-black mb-1 ${isDark ? 'text-green-400' : 'text-green-600'}`}>0</div>
                    <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{t('home.child.challengeDesc')}</p>
                  </div>
                  <div
                    className={`text-center rounded-xl p-6 border backdrop-filter backdrop-blur-lg ${
                      isDark
                        ? 'bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-700'
                        : 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200'
                    }`}
                  >
                    <div className="text-6xl mb-3">🎁</div>
                    <h3 className={`font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>Rewards</h3>
                    <div className={`text-4xl font-black mb-1 ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>
                      {rewardConfig?.enabled ? '0' : '—'}
                    </div>
                    <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      {rewardConfig?.enabled ? `${rewardConfig.tokenType} earned` : 'Not enabled'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Web3 Rewards and Investment Section */}
            {(rewardConfig?.enabled || piggyBankConfig?.enabled) && (
              <div className="px-4">
                <div
                  className={`p-6 backdrop-filter backdrop-blur-lg ${
                    isDark
                      ? 'bg-gray-800/80 border border-gray-700 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-200'
                      : 'card-modern'
                  }`}
                >
                  <h2 className={`text-2xl font-bold mb-6 flex items-center ${isDark ? 'text-white' : 'text-gray-800'}`}>
                    <Coins className="w-6 h-6 mr-2 text-yellow-500" />
                    💰 My Rewards & Savings
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Rewards Section */}
                    {rewardConfig?.enabled && (
                      <div
                        className={`rounded-xl p-6 border backdrop-filter backdrop-blur-lg ${
                          isDark
                            ? 'bg-gradient-to-br from-yellow-900/30 to-orange-900/30 border-yellow-700'
                            : 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200'
                        }`}
                      >
                        <div className="flex items-center mb-4">
                          <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center mr-3">
                            <Coins className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>Learning Rewards</h3>
                            <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Earn tokens for correct answers</p>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>Token Type:</span>
                            <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>{rewardConfig.tokenType}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>Per Answer:</span>
                            <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                              {rewardConfig.rewardPerAnswer} {rewardConfig.tokenType}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>Daily Limit:</span>
                            <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                              {rewardConfig.dailyLimit} {rewardConfig.tokenType}
                            </span>
                          </div>
                          <div
                            className={`mt-4 p-3 rounded-lg backdrop-filter backdrop-blur-lg ${
                              isDark ? 'bg-yellow-900/30 border border-yellow-700' : 'bg-yellow-100'
                            }`}
                          >
                            <p className={`text-sm text-center ${isDark ? 'text-yellow-300' : 'text-yellow-800'}`}>
                              🎉 Keep learning to earn more rewards!
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Piggy Bank Section */}
                    {piggyBankConfig?.enabled && piggyBankBalance && (
                      <div
                        className={`rounded-xl p-6 border backdrop-filter backdrop-blur-lg ${
                          isDark
                            ? 'bg-gradient-to-br from-pink-900/30 to-purple-900/30 border-pink-700'
                            : 'bg-gradient-to-br from-pink-50 to-purple-50 border-pink-200'
                        }`}
                      >
                        <div className="flex items-center mb-4">
                          <div className="w-10 h-10 bg-pink-500 rounded-lg flex items-center justify-center mr-3">
                            <PiggyBank className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>My Piggy Bank</h3>
                            <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Smart savings with interest</p>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>Total Balance:</span>
                            <span className={`font-bold text-lg ${isDark ? 'text-pink-400' : 'text-pink-600'}`}>
                              {piggyBankBalance.formattedBalance} {piggyBankBalance.token.symbol}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>Daily Earnings:</span>
                            <span className={`font-semibold flex items-center ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                              <TrendingUp className="w-4 h-4 mr-1" />+{piggyBankBalance.dailyEarnings} {piggyBankBalance.token.symbol}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>Total Earnings:</span>
                            <span className={`font-semibold ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                              +{piggyBankBalance.totalEarnings} {piggyBankBalance.token.symbol}
                            </span>
                          </div>

                          {/* Real-time earnings display */}
                          <div
                            className={`mt-4 p-3 rounded-lg border backdrop-filter backdrop-blur-lg ${
                              isDark ? 'bg-green-900/30 border-green-700' : 'bg-green-50 border-green-200'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className={`text-sm ${isDark ? 'text-green-300' : 'text-green-700'}`}>Live Growth:</span>
                              <span className={`text-sm font-mono ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                                +{realTimeEarnings.toFixed(6)} {piggyBankBalance.token.symbol}
                              </span>
                            </div>
                            <p className={`text-xs mt-1 ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                              * Actual earnings subject to final settlement
                            </p>
                          </div>

                          {/* DeFi Investment Products */}
                          {investmentConfig?.isEnabled && availableAaveProducts.length > 0 && (
                            <div className="mt-4">
                              <h4 className={`text-sm font-semibold mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                                Choose Investment Product
                              </h4>
                              <div className="space-y-2">
                                {availableAaveProducts.map(product => (
                                  <div
                                    key={product.id}
                                    className={`p-3 rounded-lg border cursor-pointer transition-all backdrop-filter backdrop-blur-lg ${
                                      selectedAaveProduct?.id === product.id
                                        ? isDark
                                          ? 'bg-blue-900/30 border-blue-600'
                                          : 'bg-blue-100 border-blue-300'
                                        : isDark
                                        ? 'bg-gray-800/50 border-gray-600 hover:bg-gray-700/50'
                                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                                    }`}
                                    onClick={() => setSelectedAaveProduct(product)}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <div className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                          {product.name}
                                        </div>
                                        <div className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{product.symbol}</div>
                                      </div>
                                      <div className="text-right">
                                        <div className={`text-sm font-semibold ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                                          {product.apr}% APR
                                        </div>
                                        <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Annual Rate</div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {selectedAaveProduct && (
                                <div
                                  className={`mt-3 p-3 rounded-lg backdrop-filter backdrop-blur-lg ${
                                    isDark ? 'bg-blue-900/30 border border-blue-700' : 'bg-blue-100'
                                  }`}
                                >
                                  <p className={`text-sm text-center ${isDark ? 'text-blue-300' : 'text-blue-800'}`}>
                                    💎 Investing in {selectedAaveProduct.name}({selectedAaveProduct.apr}% APR)
                                  </p>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Withdrawal Request Button */}
                          <div className={`mt-4 pt-4 border-t ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                            <button
                              onClick={() => setShowWithdrawalModal(true)}
                              className="w-full bg-orange-500 text-white py-2 px-4 rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium"
                            >
                              💰 Request Withdrawal
                            </button>
                            <p className={`text-xs mt-2 text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              Ask your parent for permission to withdraw money
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Web3 Status Messages */}
                  {!rewardConfig?.enabled && !piggyBankConfig?.enabled && (
                    <div className="text-center py-8">
                      <div className="text-6xl mb-4">🔒</div>
                      <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Web3 Features Disabled</h3>
                      <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>
                        Ask your parent to enable rewards and savings features in settings.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Encouragement message */}
            <div className="px-4 pb-8">
              <div
                className={`rounded-2xl p-6 border text-center backdrop-filter backdrop-blur-lg ${
                  isDark
                    ? 'bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-700'
                    : 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200'
                }`}
              >
                <div className="text-6xl mb-4">🌟✨🚀</div>
                <h3
                  className={`text-2xl font-bold mb-3 ${
                    isDark
                      ? 'bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent'
                      : 'bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent'
                  }`}
                >
                  {t('home.child.encouragement', { name: activePerson?.alias || t('home.child.defaultName') })}
                </h3>
                <p className={`leading-relaxed ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{t('home.child.encouragementDesc')}</p>
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

      {/* Withdrawal Request Modal */}
      {showWithdrawalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div
            className={`rounded-xl p-6 w-full max-w-md backdrop-filter backdrop-blur-lg ${
              isDark ? 'bg-gray-800/90 border border-gray-700' : 'bg-white'
            }`}
          >
            <h3 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>Request Withdrawal</h3>

            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Amount to Withdraw</label>
                <div className="flex items-center">
                  <input
                    type="number"
                    value={withdrawalAmount}
                    onChange={e => setWithdrawalAmount(e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    className={`flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                      isDark
                        ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:ring-orange-400 focus:border-orange-400'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-orange-500 focus:border-orange-500'
                    }`}
                  />
                  <span className={`ml-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{piggyBankBalance?.token.symbol || 'USDC'}</span>
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                  Reason for Withdrawal
                </label>
                <textarea
                  value={withdrawalReason}
                  onChange={e => setWithdrawalReason(e.target.value)}
                  placeholder="Why do you need this money? (e.g., buy a toy, save for something special)"
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                    isDark
                      ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:ring-orange-400 focus:border-orange-400'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-orange-500 focus:border-orange-500'
                  }`}
                />
              </div>

              <div
                className={`border rounded-lg p-3 backdrop-filter backdrop-blur-lg ${
                  isDark ? 'bg-yellow-900/30 border-yellow-700' : 'bg-yellow-50 border-yellow-200'
                }`}
              >
                <p className={`text-sm ${isDark ? 'text-yellow-300' : 'text-yellow-800'}`}>
                  ⚠️ Your parent will review this request before approving it.
                </p>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowWithdrawalModal(false)}
                className={`flex-1 px-4 py-2 border rounded-lg transition-colors ${
                  isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700/50' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleWithdrawalRequest}
                disabled={!withdrawalAmount || !withdrawalReason}
                className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
