import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from '../i18n/I18nProvider';
import { AlertCircle, Loader2, Bug, X, Maximize2, Monitor } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { QuestionsContainer, Question as QuestionType } from './QuestionModal';
import { useWatchingSession } from '../hooks/useWatchingSession';

interface IOSWebViewerProps {
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

/**
 * iOS-specific web viewer component using popup window solution
 * Features hidden address bar and bottom area in popup mode
 * Supports i18n with English comments
 */
export const IOSWebViewer: React.FC<IOSWebViewerProps> = ({
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
    setShowQuestions,
    clearError,
    resetWatchingSession,
  } = useWatchingSession(personId, platformId, onLoadError, onLoadSuccess);

  // Convert session questions to component format
  const questions: QuestionType[] = useMemo(
    () =>
      sessionQuestions.map(q => ({
        id: q.id,
        question: q.question,
        options: q.options,
      })),
    [sessionQuestions]
  );

  // Local component state
  const [popupWindow, setPopupWindow] = useState<Window | null>(null);
  const [popupActive, setPopupActive] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [showDebug, setShowDebug] = useState(false);
  const [showStartButton, setShowStartButton] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);

  const t = useTranslation();

  // Add debug log
  const addLog = (message: string) => {
    console.log(message);
    setDebugLogs(prev => [`[${new Date().toISOString().slice(11, 19)}] ${message}`, ...prev.slice(0, 19)]);
  };

  // Initialize component on mount
  useEffect(() => {
    addLog(`Component mounted - platformId: ${platformId}`);
    addLog(`Capacitor environment: ${Capacitor.isNativePlatform() ? 'Yes' : 'No'}`);
    addLog(`Platform: ${Capacitor.getPlatform()}`);

    // Start watching session when component mounts or personId/platformId changes
    startWatching().then(() => {
      setShowStartButton(true);
    });

    return () => {
      // Close popup if open
      if (popupWindow && !popupWindow.closed) {
        popupWindow.close();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personId, platformId]); // Re-start when personId or platformId changes

  // Handle refresh - reset and restart watching session
  const handleRefresh = useCallback(() => {
    console.log('IOSWebViewer: Refreshing watching session...');
    resetWatchingSession();
    // Small delay to ensure state is reset before restarting
    setTimeout(() => {
      startWatching().then(() => {
        setShowStartButton(true);
      });
    }, 100);
  }, [resetWatchingSession, startWatching]);

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

  // Computed states based on session and local state
  const isLoading = sessionLoading || localLoading;
  const hasError = sessionError;
  const errorMessage = sessionErrorMessage;

  // Open popup window with hidden address bar and bottom area
  const openPopupWindow = async () => {
    addLog('Attempting to open content in app browser...');
    try {
      setLocalLoading(true);
      addLog(`Opening platformId: ${platformId}`);

      // Use Capacitor Browser plugin to open URL in app
      if (Capacitor.isNativePlatform()) {
        await Browser.open({
          url: platformUrl,
          presentationStyle: 'fullscreen',
          toolbarColor: '#000000',
          windowName: 'webViewer',
        });

        setPopupActive(true);
        addLog('Content opened in app browser successfully');

        // Monitor browser state
        Browser.addListener('browserFinished', () => {
          addLog('App browser was closed');
          setPopupActive(false);
        });
      } else {
        // Fallback for web/desktop - use window.open with specific features
        const webViewerContainer = document.querySelector('.webViewer-container') as HTMLElement;
        let popupWidth = 1200;
        let popupHeight = 800;

        if (webViewerContainer) {
          const rect = webViewerContainer.getBoundingClientRect();
          popupWidth = Math.max(800, Math.min(1400, rect.width + 100));
          popupHeight = Math.max(600, Math.min(1000, rect.height + 100));
          addLog(`Web viewer container size: ${rect.width}x${rect.height}, popup size: ${popupWidth}x${popupHeight}`);
        }

        const left = Math.max(0, (screen.width - popupWidth) / 2);
        const top = Math.max(0, (screen.height - popupHeight) / 2);

        const popupFeatures = [
          `width=${popupWidth}`,
          `height=${popupHeight}`,
          `left=${left}`,
          `top=${top}`,
          'menubar=no',
          'toolbar=no',
          'location=no',
          'status=no',
          'resizable=yes',
          'scrollbars=yes',
          'titlebar=no',
          'directories=no',
          'fullscreen=no',
        ].join(',');

        const newWindow = window.open(platformUrl, 'webViewer', popupFeatures);

        if (!newWindow) {
          throw new Error('Popup blocked by browser');
        }

        setPopupWindow(newWindow);
        setPopupActive(true);

        const checkClosed = setInterval(() => {
          if (newWindow.closed) {
            addLog('Popup window was closed by user');
            setPopupActive(false);
            clearInterval(checkClosed);
          }
        }, 1000);
      }

      setLocalLoading(false);
      onLoadSuccess?.();
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Failed to open content';
      addLog(`Failed to open content: ${errMsg}`);
      console.error('Failed to open content:', error);
      setLocalLoading(false);
      onLoadError?.(errMsg);
    }
  };

  // Close popup window
  const closePopupWindow = () => {
    addLog('Closing content viewer');
    if (Capacitor.isNativePlatform()) {
      Browser.close();
    } else if (popupWindow && !popupWindow.closed) {
      popupWindow.close();
      setPopupWindow(null);
    }
    setPopupActive(false);
    addLog('Content viewer closed');
  };

  // Toggle fullscreen for popup
  const toggleFullscreen = () => {
    if (Capacitor.isNativePlatform()) {
      // No need to handle fullscreen for in-app browser as it's already fullscreen
      return;
    }

    if (popupWindow && !popupWindow.closed) {
      if (!isFullscreen) {
        popupWindow.document.documentElement.requestFullscreen?.();
        setIsFullscreen(true);
        addLog('Entered fullscreen mode');
      } else {
        document.exitFullscreen?.();
        setIsFullscreen(false);
        addLog('Exited fullscreen mode');
      }
    }
  };

  // Handle answering questions with logging
  const handleAnswerQuestionWithLog = async (questionId: string, answer: string) => {
    addLog(`Submitting answer for question ${questionId}: ${answer}`);

    try {
      const result = await handleAnswerQuestion(questionId, answer);
      addLog(`Answer result: ${result}`);

      // Reopen popup if it was closed and questions are no longer showing
      if (!popupActive && !showQuestions) {
        openPopupWindow();
      }

      return result; // Return the result to QuestionModal
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      addLog(`Error verifying question: ${errMsg}`);
      return false; // Return false on error
    }
  };

  return (
    <div className={`relative webViewer-container ${className}`}>
      <div className="w-full aspect-video bg-black rounded-lg overflow-hidden">
        {/* Popup active interface */}
        {popupActive && !showQuestions && !showDebug && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white p-6">
            <h3 className="text-xl font-bold mb-2">{t('webViewer.contentRunning')}</h3>
            <p className="text-sm text-gray-400 text-center mb-6 max-w-md">{t('webViewer.contentIsRunning')}</p>

            {/* Popup controls */}
            <div className="flex space-x-2 mb-4">
              <button onClick={toggleFullscreen} className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm flex items-center">
                {isFullscreen ? <Monitor className="w-4 h-4 mr-1" /> : <Maximize2 className="w-4 h-4 mr-1" />}
                {isFullscreen ? t('webViewer.popupExitFullscreenButton') : t('webViewer.popupFullscreenButton')}
              </button>
              <button onClick={closePopupWindow} className="px-3 py-2 bg-red-600 hover:bg-red-700 rounded text-sm flex items-center">
                <X className="w-4 h-4 mr-1" />
                {t('webViewer.popupCloseButton')}
              </button>
            </div>

            <p className="text-xs text-gray-500 text-center">{t('webViewer.popupCloseHint')}</p>
          </div>
        )}

        {/* Questions interface */}
        <QuestionsContainer
          questions={questions}
          onAnswer={handleAnswerQuestionWithLog}
          isVisible={showQuestions}
          onAllQuestionsCompleted={() => {
            // Hide questions when all completed
            setShowQuestions(false);
          }}
          onSkipQuestions={() => {
            // Hide questions when skipped
            setShowQuestions(false);
          }}
        />

        {/* Error state */}
        {hasError && !showDebug && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white p-6">
            <AlertCircle className="w-16 h-16 text-red-400 mb-4" />
            <h3 className="text-xl font-bold mb-2">{t('webViewer.loadError')}</h3>
            <p className="text-gray-300 text-center mb-2">{platformName}</p>
            <p className="text-sm text-gray-400 text-center mb-6 max-w-md">{errorMessage || t('webViewer.loadErrorDescription')}</p>

            <button
              onClick={() => {
                clearError();
                startWatching().then(() => {
                  setShowStartButton(true);
                });
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center"
            >
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {t('common.retry')}
            </button>
          </div>
        )}

        {/* Loading state with start button */}
        {isLoading && !hasError && !showDebug && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white">
            <Loader2 className="w-12 h-12 animate-spin mb-4" />
            <p className="text-lg font-medium mb-2">{t('webViewer.loading')}</p>
            <p className="text-sm text-gray-400">{platformName}</p>
          </div>
        )}

        {/* Start button state */}
        {showStartButton && !isLoading && !hasError && !showDebug && !popupActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white p-6">
            <h3 className="text-xl font-bold mb-2">{t('webViewer.readyToStart')}</h3>
            <p className="text-sm text-gray-400 text-center mb-6 max-w-md">{t('webViewer.clickToStart')}</p>
            <button
              onClick={() => {
                setShowStartButton(false);
                openPopupWindow();
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center"
            >
              <Monitor className="w-4 h-4 mr-2" />
              {t('webViewer.startViewing')}
            </button>
          </div>
        )}

        {/* Debug interface - shows logs and status information */}
        {showDebug && (
          <div className="absolute inset-0 flex flex-col bg-gray-900 text-white p-4 overflow-auto">
            <div className="flex justify-between items-center mb-2 border-b border-gray-700 pb-2">
              <h3 className="text-lg font-bold flex items-center">
                <Bug className="w-5 h-5 mr-2" />
                Debug Console
              </h3>
              <button onClick={() => setShowDebug(false)} className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-sm rounded">
                Close
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-2 text-sm">
              <div className="bg-gray-800 p-2 rounded">
                <span className="font-bold">URL:</span> {platformUrl.substring(0, 30)}...
              </div>
              <div className="bg-gray-800 p-2 rounded">
                <span className="font-bold">Capacitor:</span> {Capacitor.isNativePlatform() ? 'Yes' : 'No'}
              </div>
              <div className="bg-gray-800 p-2 rounded">
                <span className="font-bold">Platform:</span> {Capacitor.getPlatform()}
              </div>
              <div className="bg-gray-800 p-2 rounded">
                <span className="font-bold">Popup Status:</span> {popupActive ? 'Active' : 'Inactive'}
              </div>
              <div className="bg-gray-800 p-2 rounded">
                <span className="font-bold">Fullscreen:</span> {isFullscreen ? 'Yes' : 'No'}
              </div>
              <div className="bg-gray-800 p-2 rounded">
                <span className="font-bold">Watching Token:</span> {watchingToken ? `${watchingToken.substring(0, 10)}...` : 'None'}
              </div>
            </div>

            <div className="flex mb-2">
              <button onClick={closePopupWindow} className="px-2 py-1 bg-red-600 hover:bg-red-700 text-sm rounded flex-1">
                Close Popup
              </button>
            </div>

            {/* Safari debug button */}
            <div className="flex mb-2">
              <button
                onClick={() => window.open(platformUrl, '_blank')}
                className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-sm rounded flex-1"
              >
                Open in Safari (Debug Only)
              </button>
            </div>

            <div className="bg-black p-2 rounded h-56 overflow-y-auto text-xs font-mono flex-1">
              {debugLogs.map((log, index) => (
                <div key={index} className="text-green-400 pb-1">
                  {log}
                </div>
              ))}
              {debugLogs.length === 0 && <div className="text-gray-500">No logs yet...</div>}
            </div>
          </div>
        )}

        {/* Debug button - bottom right corner */}
        <button
          onClick={() => setShowDebug(prev => !prev)}
          className="absolute bottom-2 right-2 bg-gray-800 bg-opacity-60 hover:bg-opacity-80 rounded-full p-2 text-white z-10"
          title="Toggle debug view"
        >
          <Bug className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
