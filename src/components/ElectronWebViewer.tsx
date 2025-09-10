import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useTranslation } from '../i18n/I18nProvider';
import { AlertCircle, ExternalLink, Loader2, RefreshCw, Maximize2 } from 'lucide-react';
import { isIOS, isElectron as checkIsElectron } from '../utils/platformUtil';
import { IOSWebViewer } from './IOSWebViewer';
import { QuestionsContainer, Question as QuestionType } from './QuestionModal';
import { useWatchingSession } from '../hooks/useWatchingSession';

interface ElectronWebViewerProps {
  platformId: string;
  platformName: string;
  platformUrl: string;
  personId: string;
  onLoadError?: (error: string) => void;
  onLoadSuccess?: () => void;
  onCountdownUpdate?: (sessionTime: number, dailyTime: number) => void;
  onRefreshRef?: React.MutableRefObject<(() => void) | null>;
  className?: string;
}

export const ElectronWebViewer: React.FC<ElectronWebViewerProps> = props => {
  const { platformId, platformName, platformUrl, personId, onLoadError, onLoadSuccess, onCountdownUpdate, onRefreshRef, className = '' } = props;

  // Choose appropriate viewer implementation based on platform
  if (isIOS()) {
    return (
      <IOSWebViewer
        platformId={platformId}
        platformName={platformName}
        platformUrl={platformUrl}
        personId={personId}
        onLoadError={onLoadError}
        onLoadSuccess={onLoadSuccess}
        onCountdownUpdate={onCountdownUpdate}
        onRefreshRef={onRefreshRef}
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
  platformId,
  platformName,
  platformUrl,
  personId,
  onLoadError,
  onLoadSuccess,
  onCountdownUpdate,
  onRefreshRef,
  className = '',
}) => {
  // Use common watching session hook
  const {
    watchingToken,
    isLoading: sessionLoading,
    hasError: sessionError,
    errorMessage: sessionErrorMessage,
    showQuestions,
    questions: sessionQuestions,
    remainingTime,
    remainingDailyTime,
    startWatching,
    handleAnswerQuestion,
    handleSkipQuestions,
    setShowQuestions,
    clearError,
    resetWatchingSession,
  } = useWatchingSession(personId, platformId, onLoadError, onLoadSuccess);

  // Convert session questions to component format
  const questions: QuestionType[] = useMemo(() => 
    sessionQuestions.map(q => ({
      id: q.id,
      question: q.question,
      options: q.options,
    })), [sessionQuestions]
  );


  // Local component state
  const containerRef = useRef<HTMLDivElement>(null);
  const [isElectron, setIsElectron] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [webViewWindowId, setWebViewWindowId] = useState<number | null>(null);
  const [webViewMode, setWebViewMode] = useState<'embedded' | 'window'>('embedded');
  const [localLoading, setLocalLoading] = useState(false);

  const t = useTranslation();

  // Computed states
  const isLoading = sessionLoading || localLoading;
  const hasError = sessionError;
  const errorMessage = sessionErrorMessage;

  // Enhanced detection for Electron environment and preload script
  useEffect(() => {
    const checkElectron = () => {
      // Check multiple possible Electron features
      const win = window as any;
      const isElectronEnv = checkIsElectron();

      // Check if preload script was executed
      const isPreloadExecuted = win.__ELECTRON_PRELOAD_EXECUTED__ === true;

      console.info('Electron environment check:', {
        isElectronEnv,
        hasElectronAPI: typeof window !== 'undefined' && !!window.electronAPI,
        preloadExecuted: isPreloadExecuted,
        userAgent: window.navigator?.userAgent,
        windowKeys: Object.keys(window).filter(k => k.includes('electron') || k.includes('ELECTRON')),
      });

      // Only set isElectron if we're confident it's Electron environment
      // Don't change state if we're already in Electron mode to avoid re-renders
      if (isElectronEnv && !isElectron) {
        setIsElectron(true);
      } else if (!isElectronEnv && isElectron) {
        // Only change to false if we're absolutely sure it's not Electron
        const userAgent = window.navigator?.userAgent || '';
        if (!userAgent.includes('Electron')) {
          setIsElectron(false);
        }
      }

      // If detected Electron but electronAPI is undefined, log error
      if (isElectronEnv && !window.electronAPI) {
        console.error('Running in Electron environment, but electronAPI is undefined. Please check preload script.');

        // Add more detailed error information - these states are managed by useWatchingSession hook
        onLoadError?.(
          'Electron API not loaded. This is usually caused by the preload script not executing correctly. Please try restarting the application.'
        );
      }
    };

    checkElectron();

    // If API not loaded, try rechecking every second
    let timer: number | null = null;
    if (!window.electronAPI && isElectron) {
      timer = window.setInterval(() => {
        if (window.electronAPI) {
          console.info('electronAPI successfully loaded');
          clearInterval(timer!);
          // Don't reload the page, just update the state
          setIsElectron(true);
        }
      }, 1000);
    }

    return () => {
      if (timer !== null) clearInterval(timer);
    };
  }, [isElectron, onLoadError]);

  // Start watching session when component mounts or personId/platformId changes
  useEffect(() => {
    startWatching();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personId, platformId]); // Re-start when personId or platformId changes

  // Handle refresh - reset and restart watching session
  const handleRefresh = useCallback(() => {
    console.log('ElectronWebViewer: Refreshing watching session...');
    
    // Clean up existing webview first
    if (isElectron && window.electronAPI) {
      if (webViewMode === 'embedded') {
        window.electronAPI.destroyVideoView();
      } else if (webViewWindowId !== null) {
        window.electronAPI.closeVideoWindow(webViewWindowId);
        setWebViewWindowId(null);
      }
    }
    
    // Reset watching session
    resetWatchingSession();
    
    // Small delay to ensure state is reset before restarting
    setTimeout(() => {
      startWatching();
    }, 100);
  }, [resetWatchingSession, startWatching, isElectron, webViewMode, webViewWindowId]);

  // Set refresh function to ref for parent component
  useEffect(() => {
    if (onRefreshRef) {
      onRefreshRef.current = handleRefresh;
    }
    return () => {
      if (onRefreshRef) {
        onRefreshRef.current = null;
      }
    };
  }, [onRefreshRef, handleRefresh]);

  // Notify parent component of countdown updates
  useEffect(() => {
    if (onCountdownUpdate && remainingTime > 0 && remainingDailyTime > 0) {
      onCountdownUpdate(remainingTime, remainingDailyTime);
    }
  }, [remainingTime, remainingDailyTime, onCountdownUpdate]);

  // Handle questions showing - pause content when questions appear
  useEffect(() => {
    if (showQuestions) {
      // Hide content when questions are shown
      if (webViewMode === 'embedded') {
        // Hide embedded BrowserView when questions are shown
        if (window.electronAPI && window.electronAPI.hideVideoView) {
          window.electronAPI.hideVideoView();
        }
      } else if (webViewWindowId !== null) {
        // Minimize window when questions are shown
        if (window.electronAPI && window.electronAPI.minimizeVideoWindow) {
          window.electronAPI.minimizeVideoWindow(webViewWindowId);
        }
      }
    } else {
      // Show content again when questions are hidden
      if (webViewMode === 'embedded') {
        if (window.electronAPI && window.electronAPI.showVideoView) {
          window.electronAPI.showVideoView();
        }
      } else if (webViewWindowId !== null) {
        // Restore window when questions are hidden
        if (window.electronAPI && window.electronAPI.restoreVideoWindow) {
          window.electronAPI.restoreVideoWindow(webViewWindowId);
          
          // Try to resize window after a short delay to ensure it's restored
          setTimeout(() => {
            const container = containerRef.current;
            if (container && window.electronAPI && window.electronAPI.updateVideoBounds) {
              const rect = container.getBoundingClientRect();
              const bounds = {
                x: Math.round(rect.left),
                y: Math.round(rect.top),
                width: Math.round(rect.width),
                height: Math.round(rect.height),
              };
              console.log('Updating video window bounds after restore:', bounds);
              window.electronAPI.updateVideoBounds(bounds);
            }
          }, 100);
        }
      }
    }
  }, [showQuestions, webViewMode, webViewWindowId]);

  // Handle session errors - close content when session expires
  useEffect(() => {
    if (hasError) {
      // Close content when session expires or daily time exceeded
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
    }
  }, [hasError, webViewMode, webViewWindowId]);

  // Initialize BrowserView when component mounts
  useEffect(() => {
    if (!isElectron || !containerRef.current || webViewMode !== 'embedded') return;
    console.debug('>>> Initializing WebViewer with URL:', platformUrl);

    const initializeWebView = async () => {
      try {
        setLocalLoading(true);
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

        console.info('Creating WebViewer with URL:', platformUrl, 'and bounds:', bounds);

        // Create BrowserView
        const result = await window.electronAPI.createVideoView({ url: platformUrl, bounds });
        if (result.success) {
          console.debug('WebViewer created successfully');
          setIsRetrying(false);
        } else {
          throw new Error(result.error || 'Failed to create web view');
        }
      } catch (error) {
        console.error('Error initializing web view:', error);
        setLocalLoading(false);
        setIsRetrying(false);
        onLoadError?.(error instanceof Error ? error.message : 'Unknown error');
      }
    };

    // Set up event listeners
    const handleWebViewLoadError = (data: { url: string; error: string }) => {
      console.error('Web view load error:', data);
      setLocalLoading(false);
      setIsRetrying(false);
      onLoadError?.(data.error);
    };

    const handleWebViewLoadSuccess = (data: { url: string }) => {
      console.info('Web view loaded successfully:', data.url);
      setLocalLoading(false);
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
  }, [isElectron, webViewMode, platformUrl, onLoadError, onLoadSuccess]);

  // Initialize window mode when selected
  useEffect(() => {
    if (!isElectron || webViewMode !== 'window') return;

    const openWebInWindow = async () => {
      try {
        setLocalLoading(true);

        // Confirm API is available
        if (!window.electronAPI || !window.electronAPI.openVideoWindow) {
          throw new Error('Electron API for opening window is not available');
        }

        const result = await window.electronAPI.openVideoWindow({
          url: platformUrl,
          title: `${platformName} - ${t('webViewer.windowTitle')}`,
        });

        if (result.success && result.windowId) {
          console.log('Web view window opened successfully with ID:', result.windowId);
          setWebViewWindowId(result.windowId);
          setLocalLoading(false);
          onLoadSuccess?.();
        } else {
          throw new Error(result.error || 'Failed to open window');
        }
      } catch (error) {
        console.error('Error opening window:', error);
        setLocalLoading(false);
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
  }, [isElectron, platformUrl, platformName, webViewMode, t, onLoadError, onLoadSuccess]);

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

      console.debug('Updating web view bounds:', bounds);
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

      // Cleanup handled by useWatchingSession hook
    };
  }, [isElectron, webViewMode, webViewWindowId]);

  // Fallback to open in new window - use internal window instead of external browser
  const openInNewWindow = () => {
    if (isElectron && window.electronAPI && window.electronAPI.openVideoWindow) {
      // Prefer our standalone window functionality
      window.electronAPI
        .openVideoWindow({
          url: platformUrl,
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
            window.electronAPI.openUrl(platformUrl);
          } else {
            window.open(platformUrl, '_blank', 'width=1200,height=800');
          }
        });
    } else if (isElectron && window.electronAPI?.openUrl) {
      window.electronAPI.openUrl(platformUrl);
    } else {
      console.error('Electron API not available, falling back to window.open');
      window.open(platformUrl, '_blank', 'width=1200,height=800');
    }
  };

  // Retry loading
  const retryLoad = async () => {
    if (!isElectron) return;

    setRetryCount(prev => prev + 1);
    setLocalLoading(true);
    clearError();
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

        const result = await window.electronAPI.createVideoView({ url: platformUrl, bounds });

        if (!result.success) {
          throw new Error(result.error || 'Failed to create web view');
        }
      } catch (error) {
        console.error('Error retrying web view load:', error);
        setLocalLoading(false);
        setIsRetrying(false);
        onLoadError?.(error instanceof Error ? error.message : 'Unknown error');
      }
    } else if (window.electronAPI) {
      // Retry in window mode
      try {
        const result = await window.electronAPI.openVideoWindow({
          url: platformUrl,
          title: `${platformName} - ${t('webViewer.windowTitle')}`,
        });

        if (result.success && result.windowId) {
          setWebViewWindowId(result.windowId);
          setLocalLoading(false);
          setIsRetrying(false);
        } else {
          throw new Error(result.error || 'Failed to open window');
        }
      } catch (error) {
        console.error('Error retrying window:', error);
        setLocalLoading(false);
        setIsRetrying(false);
        onLoadError?.(error instanceof Error ? error.message : 'Unknown error');
      }
    }
  };

  // Handle view mode toggle
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
    setLocalLoading(true);
  };

  useEffect(() => {
    console.debug('Electron detection state:', {
      isElectron,
      hasElectronAPI: !!window.electronAPI,
      apis: window.electronAPI ? Object.keys(window.electronAPI) : [],
    });
  }, [isElectron]);

  return (
    <div className={`relative ${className}`}>
      <div 
        ref={containerRef} 
        className={`w-full aspect-video bg-black rounded-lg webViewer-container ${showQuestions ? 'opacity-0 pointer-events-none' : ''}`}
      >
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

        {/* Success state for embedded mode */}
        {!isLoading && !hasError && isElectron && webViewMode === 'embedded' && (
          <div className="absolute inset-0 pointer-events-none">
            {/* This div serves as a placeholder for the BrowserView */}
          </div>
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

      {/* Questions interface - moved outside containerRef to ensure proper positioning */}
      <QuestionsContainer 
        questions={questions} 
        onAnswer={handleAnswerQuestion} 
        isVisible={showQuestions}
        watchingToken={watchingToken}
        onAllQuestionsCompleted={() => {
          // Hide questions when all completed
          // The useEffect will automatically handle showing the webview
          setShowQuestions(false);
        }}
        onSkipQuestions={async (password: string) => {
          // Use the skip questions handler
          const success = await handleSkipQuestions(password);
          if (success) {
            // Questions are already hidden by handleSkipQuestions
            console.log('Questions skipped successfully');
          }
        }}
      />
      
      {/* Overlay to ensure questions are always on top when visible */}
      {showQuestions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 pointer-events-auto z-[9998]"></div>
      )}
    </div>
  );
};
