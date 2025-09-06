import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from '../i18n/I18nProvider';
import { AlertCircle, ExternalLink, Loader2, RefreshCw, Maximize2 } from 'lucide-react';
import { isIOS, isElectron as checkIsElectron } from '../utils/platformUtil';
import { IOSWebViewer } from './IOSWebViewer';
import { APIFactory } from '../api/APIFactory';
import { QuestionsContainer, Question as QuestionType } from './QuestionModal';
import { Question as APIQuestion } from '../types';

interface ElectronWebViewerProps {
  url: string;
  platformName: string;
  personId: string;
  onLoadError?: (error: string) => void;
  onLoadSuccess?: () => void;
  className?: string;
}

export const ElectronWebViewer: React.FC<ElectronWebViewerProps> = props => {
  const { url, platformName, personId, onLoadError, onLoadSuccess, className = '' } = props;

  // Choose appropriate viewer implementation based on platform
  if (isIOS()) {
    return (
      <IOSWebViewer
        url={url}
        platformName={platformName}
        personId={personId}
        onLoadError={onLoadError}
        onLoadSuccess={onLoadSuccess}
        className={className}
      />
    );
  } else {
    // Use Electron or web implementation
    return <ElectronImplementation {...props} />;
  }
};

// Electron implementation
const ElectronImplementation: React.FC<ElectronWebViewerProps> = ({
  url,
  platformName,
  personId,
  onLoadError,
  onLoadSuccess,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isElectron, setIsElectron] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [webViewWindowId, setWebViewWindowId] = useState<number | null>(null);
  const [webViewMode, setWebViewMode] = useState<'embedded' | 'window'>('embedded');
  const [watchingToken, setWatchingToken] = useState<string | null>(null);
  const [showQuestions, setShowQuestions] = useState(false);
  const [questions, setQuestions] = useState<QuestionType[]>([]);
  const checkIntervalRef = useRef<number | null>(null);
  const t = useTranslation();
  const api = APIFactory.createAPIHandler();

  // Enhanced detection for Electron environment and preload script
  useEffect(() => {
    const checkElectron = () => {
      // Check multiple possible Electron features
      const win = window as any;
      const isElectronEnv = checkIsElectron();

      // Check if preload script was executed
      const isPreloadExecuted = win.__ELECTRON_PRELOAD_EXECUTED__ === true;

      console.log('Electron environment check:', {
        isElectronEnv,
        hasElectronAPI: typeof window !== 'undefined' && !!window.electronAPI,
        preloadExecuted: isPreloadExecuted,
        userAgent: window.navigator?.userAgent,
        windowKeys: Object.keys(window).filter(k => k.includes('electron') || k.includes('ELECTRON')),
      });

      setIsElectron(isElectronEnv);

      // If detected Electron but electronAPI is undefined, log error
      if (isElectronEnv && !window.electronAPI) {
        console.error('Running in Electron environment, but electronAPI is undefined. Please check preload script.');

        // Add more detailed error information
        setHasError(true);
        setErrorMessage(
          'Electron API not loaded. This is usually caused by the preload script not executing correctly. Please try restarting the application.'
        );
        setIsLoading(false);
      }
    };

    checkElectron();

    // If API not loaded, try rechecking every second
    let timer: number | null = null;
    if (!window.electronAPI && isElectron) {
      timer = window.setInterval(() => {
        if (window.electronAPI) {
          console.log('electronAPI successfully loaded');
          clearInterval(timer!);
          window.location.reload(); // Refresh page to reload component
        }
      }, 1000);
    }

    return () => {
      if (timer !== null) clearInterval(timer);
    };
  }, []);

  // Start watching session when component mounts
  useEffect(() => {
    const startWatchingSession = async () => {
      try {
        const response = await api.startWatching(personId, url);
        if (response.errcode === "200" && response.data?.watchingToken) {
          setWatchingToken(response.data.watchingToken);
          startCheckingWatchingStatus(response.data.watchingToken);
        } else {
          throw new Error('Failed to start watching session');
        }
      } catch (error) {
        console.error('Error starting watching session:', error);
        setHasError(true);
        setErrorMessage(error instanceof Error ? error.message : 'Failed to start watching session');
      }
    };

    startWatchingSession();

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [personId, url, api]);

  // Helper function to convert API Question to QuestionModal Question type
  const convertAPIQuestionToModalQuestion = (apiQuestions: APIQuestion[]): QuestionType[] => {
    return apiQuestions.map(q => ({
      id: q.id,
      question: q.content,
      options: q.options || [],
    }));
  };

  // Periodically check watching status
  const startCheckingWatchingStatus = (token: string) => {
    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current);
    }

    checkIntervalRef.current = window.setInterval(async () => {
      if (!token) return;

      try {
        const response = await api.checkWatching(token);

        if (response.errcode === "200") {
          // Check if questions need to be shown
          if (response.data?.questions && response.data.questions.length > 0 && response.data.questions && response.data.questions.length > 0) {
            setQuestions(convertAPIQuestionToModalQuestion(response.data.questions));
            setShowQuestions(true);
            // Pause content viewing
            if (webViewMode === 'embedded') {
              // Hide or pause embedded content
            } else if (webViewWindowId !== null) {
              // Minimize or pause window content
            }
          }

          // Check if token expired or daily time exceeded
          if (response.data?.dailyTimeExceeded || response.data?.dailyTimeExceeded) {
            // Token expired or daily time exceeded
            if (webViewMode === 'embedded') {
              if (window.electronAPI) {
                window.electronAPI.destroyVideoView();
              }
            } else if (webViewWindowId !== null) {
              if (window.electronAPI) {
                window.electronAPI.closeVideoWindow(webViewWindowId);
              }
              setWebViewWindowId(null);
            }

            setHasError(true);
            setErrorMessage(response.data?.dailyTimeExceeded ? t('time.dailyLimitExceeded') : t('time.sessionExpired'));

            if (checkIntervalRef.current) {
              clearInterval(checkIntervalRef.current);
            }
          }
        }
      } catch (error) {
        console.error('Error checking watching status:', error);
      }
    }, 3000); // Check every 3 seconds
  };

  // Initialize BrowserView when component mounts
  useEffect(() => {
    if (!isElectron || !containerRef.current || webViewMode !== 'embedded') return;

    const initializeWebView = async () => {
      try {
        setIsLoading(true);
        setHasError(false);
        setErrorMessage('');
        setIsRetrying(true);

        // Confirm electronAPI is available
        if (!window.electronAPI || !window.electronAPI.createVideoView) {
          throw new Error('Electron API is not available or not properly loaded');
        }

        // Get container bounds
        const rect = containerRef.current!.getBoundingClientRect();
        const bounds = {
          x: Math.round(rect.left),
          y: Math.round(rect.top),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        };

        console.log('Creating web view with bounds:', bounds);
        console.log('Loading URL:', url);

        // Create BrowserView
        const result = await window.electronAPI.createVideoView({ url, bounds });

        if (result.success) {
          console.log('Web view created successfully');
          setIsRetrying(false);
        } else {
          throw new Error(result.error || 'Failed to create web view');
        }
      } catch (error) {
        console.error('Error initializing web view:', error);
        setHasError(true);
        setErrorMessage(error instanceof Error ? error.message : 'Unknown error');
        setIsLoading(false);
        setIsRetrying(false);
        onLoadError?.(error instanceof Error ? error.message : 'Unknown error');
      }
    };

    // Set up event listeners
    const handleWebViewLoadError = (data: { url: string; error: string }) => {
      console.error('Web view load error:', data);
      setHasError(true);
      setErrorMessage(data.error);
      setIsLoading(false);
      setIsRetrying(false);
      onLoadError?.(data.error);
    };

    const handleWebViewLoadSuccess = (data: { url: string }) => {
      console.log('Web view loaded successfully:', data.url);
      setIsLoading(false);
      setHasError(false);
      setErrorMessage('');
      setIsRetrying(false);
      onLoadSuccess?.();
    };

    // Ensure API exists
    if (window.electronAPI) {
      window.electronAPI.onVideoLoadError(handleWebViewLoadError);
      window.electronAPI.onVideoLoadSuccess(handleWebViewLoadSuccess);
    }

    // Initialize with a small delay to ensure DOM is ready
    const timer = setTimeout(initializeWebView, 100);

    return () => {
      clearTimeout(timer);
      if (window.electronAPI) {
        window.electronAPI.removeVideoListeners();
      }
    };
  }, [isElectron, url, onLoadError, onLoadSuccess, webViewMode]);

  // Initialize window mode when selected
  useEffect(() => {
    if (!isElectron || webViewMode !== 'window') return;

    const openWebInWindow = async () => {
      try {
        setIsLoading(true);
        setHasError(false);
        setErrorMessage('');

        // Confirm API is available
        if (!window.electronAPI || !window.electronAPI.openVideoWindow) {
          throw new Error('Electron API for opening window is not available');
        }

        const result = await window.electronAPI.openVideoWindow({
          url,
          title: `${platformName} - ${t('webViewer.windowTitle')}`,
        });

        if (result.success && result.windowId) {
          console.log('Web view window opened successfully with ID:', result.windowId);
          setWebViewWindowId(result.windowId);
          setIsLoading(false);
          onLoadSuccess?.();
        } else {
          throw new Error(result.error || 'Failed to open window');
        }
      } catch (error) {
        console.error('Error opening window:', error);
        setHasError(true);
        setErrorMessage(error instanceof Error ? error.message : 'Unknown error');
        setIsLoading(false);
        onLoadError?.(error instanceof Error ? error.message : 'Unknown error');
      }
    };

    openWebInWindow();

    return () => {
      if (window.electronAPI && webViewWindowId !== null) {
        window.electronAPI.closeVideoWindow(webViewWindowId);
        setWebViewWindowId(null);
      }
    };
  }, [isElectron, url, platformName, webViewMode, t, onLoadError, onLoadSuccess]);

  // Handle window resize and update BrowserView bounds
  useEffect(() => {
    if (!isElectron || !containerRef.current || hasError || webViewMode !== 'embedded') return;

    const updateBounds = () => {
      if (!containerRef.current || !window.electronAPI) return;

      const rect = containerRef.current.getBoundingClientRect();
      const bounds = {
        x: Math.round(rect.left),
        y: Math.round(rect.top),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      };

      console.log('Updating web view bounds:', bounds);
      window.electronAPI.updateVideoBounds(bounds);
    };

    const resizeObserver = new ResizeObserver(updateBounds);
    resizeObserver.observe(containerRef.current);

    // Also handle window resize
    window.addEventListener('resize', updateBounds);
    window.addEventListener('scroll', updateBounds);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateBounds);
      window.removeEventListener('scroll', updateBounds);
    };
  }, [isElectron, hasError, webViewMode]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isElectron && window.electronAPI) {
        if (webViewMode === 'embedded') {
          window.electronAPI.destroyVideoView();
        } else if (webViewWindowId !== null) {
          window.electronAPI.closeVideoWindow(webViewWindowId);
        }
      }

      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [isElectron, webViewMode, webViewWindowId]);

  // Switch between embedded and window modes
  const toggleViewMode = async () => {
    if (!isElectron || !window.electronAPI) return;

    // Clean up current mode
    if (webViewMode === 'embedded') {
      await window.electronAPI.destroyVideoView();
    } else if (webViewWindowId !== null) {
      await window.electronAPI.closeVideoWindow(webViewWindowId);
      setWebViewWindowId(null);
    }

    // Toggle mode
    setWebViewMode(prev => (prev === 'embedded' ? 'window' : 'embedded'));
    setIsLoading(true);
  };

  // Fallback to open in new window - use internal window instead of external browser
  const openInNewWindow = () => {
    if (isElectron && window.electronAPI && window.electronAPI.openVideoWindow) {
      // Prefer our standalone window functionality
      window.electronAPI
        .openVideoWindow({
          url,
          title: `${platformName} - ${t('webViewer.windowTitle')}`,
        })
        .then(result => {
          if (result.success && result.windowId) {
            setWebViewWindowId(result.windowId);
            setWebViewMode('window');
          }
        })
        .catch(error => {
          console.error('Error opening window:', error);
          // Fallback to regular openUrl
          if (window.electronAPI?.openUrl) {
            window.electronAPI.openUrl(url);
          } else {
            window.open(url, '_blank', 'width=1200,height=800');
          }
        });
    } else if (isElectron && window.electronAPI?.openUrl) {
      window.electronAPI.openUrl(url);
    } else {
      console.error('Electron API not available, falling back to window.open');
      window.open(url, '_blank', 'width=1200,height=800');
    }
  };

  // Retry loading
  const retryLoad = async () => {
    if (!isElectron) return;

    setRetryCount(prev => prev + 1);
    setIsLoading(true);
    setHasError(false);
    setErrorMessage('');
    setIsRetrying(true);

    if (webViewMode === 'embedded' && containerRef.current && window.electronAPI) {
      try {
        const rect = containerRef.current.getBoundingClientRect();
        const bounds = {
          x: Math.round(rect.left),
          y: Math.round(rect.top),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        };

        console.log(`Retry ${retryCount + 1}: Creating web view with bounds:`, bounds);

        const result = await window.electronAPI.createVideoView({ url, bounds });

        if (!result.success) {
          throw new Error(result.error || 'Failed to create web view');
        }
      } catch (error) {
        console.error('Error retrying web view load:', error);
        setHasError(true);
        setErrorMessage(error instanceof Error ? error.message : 'Unknown error');
        setIsLoading(false);
        setIsRetrying(false);
        onLoadError?.(error instanceof Error ? error.message : 'Unknown error');
      }
    } else if (window.electronAPI) {
      // Retry in window mode
      try {
        const result = await window.electronAPI.openVideoWindow({
          url,
          title: `${platformName} - ${t('webViewer.windowTitle')}`,
        });

        if (result.success && result.windowId) {
          setWebViewWindowId(result.windowId);
          setIsLoading(false);
          setIsRetrying(false);
        } else {
          throw new Error(result.error || 'Failed to open window');
        }
      } catch (error) {
        console.error('Error retrying window:', error);
        setHasError(true);
        setErrorMessage(error instanceof Error ? error.message : 'Unknown error');
        setIsLoading(false);
        setIsRetrying(false);
        onLoadError?.(error instanceof Error ? error.message : 'Unknown error');
      }
    }
  };

  // Handle answering questions
  const handleAnswerQuestion = async (questionId: string, answer: string) => {
    if (!watchingToken) return;

    try {
      const response = await api.verifyQuestion(watchingToken, questionId, answer);

      if (response.errcode === "200" && response.data) {
        if (response.data.correct && response.data.newWatchingToken) {
          // Update token and continue watching
          setWatchingToken(response.data.newWatchingToken);
          setShowQuestions(false);
          startCheckingWatchingStatus(response.data.newWatchingToken);
        } else {
          // Incorrect answer, could show feedback
          console.log('Incorrect answer');
        }
      }
    } catch (error) {
      console.error('Error verifying question:', error);
    }
  };

  useEffect(() => {
    console.log('Debug: Electron detection state:', {
      isElectron,
      hasElectronAPI: !!window.electronAPI,
      apis: window.electronAPI ? Object.keys(window.electronAPI) : [],
    });
  }, [isElectron]);

  return (
    <div className={`relative ${className}`}>
      <div ref={containerRef} className="w-full h-full min-h-[400px] bg-black rounded-lg overflow-hidden webViewer-container">
        {/* Loading state */}
        {isLoading && !hasError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white">
            <Loader2 className="w-12 h-12 animate-spin mb-4" />
            <p className="text-lg font-medium mb-2">{isRetrying ? 't("common.reload")' : t('webViewer.loading')}</p>
            <p className="text-sm text-gray-400">{platformName}</p>
            {isRetrying && <p className="text-xs text-gray-500 mt-2">{t('common.attempt', { count: retryCount + 1 })}</p>}
          </div>
        )}

        {/* Error state */}
        {hasError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white p-6">
            <AlertCircle className="w-16 h-16 text-red-400 mb-4" />
            <h3 className="text-xl font-bold mb-2">{t('webViewer.loadError')}</h3>
            <p className="text-gray-300 text-center mb-2">{platformName}</p>
            <p className="text-sm text-gray-400 text-center mb-6 max-w-md">{errorMessage || t('webViewer.loadErrorDescription')}</p>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={retryLoad}
                disabled={isRetrying}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center"
              >
                {isRetrying ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                {isRetrying ? '重试中...' : t('common.retry')}
              </button>

              <button
                onClick={openInNewWindow}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors flex items-center"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                {t('webViewer.openInNewWindow')}
              </button>
            </div>

            <div className="mt-4 p-3 bg-yellow-900 rounded-lg max-w-md">
              <p className="text-xs text-yellow-200">{t('webViewer.embedHint')}</p>
            </div>

            {retryCount > 0 && <div className="mt-3 text-xs text-gray-500">{t('common.attempts', { count: retryCount })}</div>}
          </div>
        )}

        {/* Questions interface */}
        <QuestionsContainer questions={questions} onAnswer={handleAnswerQuestion} isVisible={showQuestions} />

        {/* Success state for embedded mode */}
        {!isLoading && !hasError && isElectron && webViewMode === 'embedded' && (
          <div className="absolute inset-0 pointer-events-none">{/* This div serves as a placeholder for the BrowserView */}</div>
        )}

        {/* Success state for window mode */}
        {!isLoading && !hasError && isElectron && webViewMode === 'window' && webViewWindowId !== null && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white p-6">
            <h3 className="text-xl font-bold mb-4">{t('webViewer.runningInWindow')}</h3>
            <p className="text-gray-300 mb-8">{platformName}</p>
            <p className="text-sm text-gray-400 text-center mb-6 max-w-md">{t('webViewer.windowModeDescription')}</p>

            <div className="flex flex-row gap-3">
              <button
                onClick={toggleViewMode}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center"
              >
                <Maximize2 className="w-4 h-4 mr-2" />
                {t('webViewer.switchToEmbedded')}
              </button>
            </div>
          </div>
        )}

        {/* Improved detection for Electron environment */}
        {!isElectron && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white p-6">
            <AlertCircle className="w-16 h-16 text-yellow-400 mb-4" />
            <h3 className="text-xl font-bold mb-2">{t('webViewer.electronRequired')}</h3>
            <p className="text-gray-300 text-center mb-4">{t('webViewer.electronRequiredDescription')}</p>
            <p className="text-xs text-gray-400 text-center mb-6">{navigator.userAgent}</p>

            <button
              onClick={openInNewWindow}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center"
            >
              <ExternalLink className="w-5 h-5 mr-2" />
              {t('webViewer.openInBrowser')}
            </button>
          </div>
        )}

        {/* View mode toggle */}
        {isElectron && !hasError && !isLoading && webViewMode === 'embedded' && (
          <button
            onClick={toggleViewMode}
            className="absolute top-2 right-2 p-2 bg-gray-800 bg-opacity-60 hover:bg-opacity-80 rounded-full text-white z-10"
            title={t('webViewer.openInSeparateWindow')}
          >
            <Maximize2 className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};
