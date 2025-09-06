import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../i18n/I18nProvider';
import { AlertCircle, Loader2, Bug, X, Maximize2, Monitor } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { APIFactory } from '../api/APIFactory';
import { QuestionsContainer, Question as QuestionType } from './QuestionModal';
import { Question as APIQuestion } from '../types';

interface IOSWebViewerProps {
  url: string;
  platformName: string;
  personId: string;
  onLoadError?: (error: string) => void;
  onLoadSuccess?: () => void;
  className?: string;
}

/**
 * iOS-specific web viewer component using popup window solution
 * Features hidden address bar and bottom area in popup mode
 * Supports i18n with English comments
 */
export const IOSWebViewer: React.FC<IOSWebViewerProps> = ({ url, platformName, personId, onLoadError, onLoadSuccess, className = '' }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showQuestions, setShowQuestions] = useState(false);
  const [questions, setQuestions] = useState<QuestionType[]>([]);
  const [popupWindow, setPopupWindow] = useState<Window | null>(null);
  const [popupActive, setPopupActive] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [showDebug, setShowDebug] = useState(false);
  const [watchingToken, setWatchingToken] = useState<string | null>(null);
  const [showStartButton, setShowStartButton] = useState(false); // Add new state for start button
  const checkIntervalRef = useRef<number | null>(null);
  const t = useTranslation();
  const api = APIFactory.createAPIHandler();

  // Add debug log
  const addLog = (message: string) => {
    console.log(message);
    setDebugLogs(prev => [`[${new Date().toISOString().slice(11, 19)}] ${message}`, ...prev.slice(0, 19)]);
  };

  // Initialize component on mount
  useEffect(() => {
    addLog(`Component mounted - URL: ${url}`);
    addLog(`Capacitor environment: ${Capacitor.isNativePlatform() ? 'Yes' : 'No'}`);
    addLog(`Platform: ${Capacitor.getPlatform()}`);

    // Start watching session and immediately open popup
    startWatchingSession();

    return () => {
      // Close popup if open
      if (popupWindow && !popupWindow.closed) {
        popupWindow.close();
      }

      // Clear checking interval
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, []);

  // Start watching session
  const startWatchingSession = async () => {
    try {
      addLog(`Starting watching session for person: ${personId}`);
      const response = await api.startWatching(personId, url);

      if (response.errcode === '200' && response.data?.watchingToken) {
        addLog(`Watching session started with token: ${response.data.watchingToken.substring(0, 10)}...`);
        setWatchingToken(response.data.watchingToken);
        startCheckingWatchingStatus(response.data.watchingToken);

        // Instead of immediately opening popup, show a button for user to click
        setIsLoading(false);
        setShowStartButton(true);
      } else {
        throw new Error('Failed to start watching session');
      }
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      addLog(`Error starting watching session: ${errMsg}`);
      setHasError(true);
      setErrorMessage(`Failed to start watching session: ${errMsg}`);
      onLoadError?.(errMsg);
    }
  };

  // Periodically check watching status
  const startCheckingWatchingStatus = (token: string) => {
    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current);
    }

    addLog('Starting to check watching status');

    checkIntervalRef.current = window.setInterval(async () => {
      if (!token) return;

      try {
        const response = await api.checkWatching(token);

        if (response.errcode === '200' && response.data) {
          // Check if questions need to be shown
          if (response.data.questions && response.data.questions.length > 0) {
            addLog(`Questions received: ${response.data.questions.length}`);
            setQuestions(convertAPIQuestionToModalQuestion(response.data.questions));
            setShowQuestions(true);
          }

          // Check if daily time exceeded
          if (response.data.dailyTimeExceeded) {
            addLog('Daily time limit exceeded');

            // Close popup window if open
            if (popupWindow && !popupWindow.closed) {
              popupWindow.close();
              setPopupWindow(null);
              setPopupActive(false);
            }

            setHasError(true);
            setErrorMessage(t('time.dailyLimitExceeded'));

            if (checkIntervalRef.current) {
              clearInterval(checkIntervalRef.current);
            }
          }
        } else {
          addLog(`Error checking watching status: ${response.errmsg}`);
        }
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : 'Unknown error';
        addLog(`Error checking watching status: ${errMsg}`);
      }
    }, 1000); // Check every second
  };

  // Helper function to convert API Question to QuestionModal Question type
  const convertAPIQuestionToModalQuestion = (apiQuestions: APIQuestion[]): QuestionType[] => {
    return apiQuestions.map(q => ({
      id: q.id,
      question: q.content,
      options: q.options || [],
    }));
  };

  // Open popup window with hidden address bar and bottom area
  const openPopupWindow = async () => {
    addLog('Attempting to open content in app browser...');
    try {
      setIsLoading(true);
      addLog(`Opening URL: ${url}`);

      // Use Capacitor Browser plugin to open URL in app
      if (Capacitor.isNativePlatform()) {
        await Browser.open({
          url,
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

        const newWindow = window.open(url, 'webViewer', popupFeatures);

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

      setIsLoading(false);
      onLoadSuccess?.();
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Failed to open content';
      addLog(`Failed to open content: ${errMsg}`);
      console.error('Failed to open content:', error);
      setHasError(true);
      setErrorMessage(errMsg);
      setIsLoading(false);
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

  // Handle answering questions
  const handleAnswerQuestion = async (questionId: string, answer: string) => {
    if (!watchingToken) return;

    addLog(`Submitting answer for question ${questionId}: ${answer}`);

    try {
      const response = await api.verifyQuestion(watchingToken, questionId, answer);

      if (response.errcode === '200' && response.data) {
        if (response.data.correct && response.data.newWatchingToken) {
          addLog('Answer correct, received new token');
          // Update token and continue watching
          setWatchingToken(response.data.newWatchingToken);
          setShowQuestions(false);
          startCheckingWatchingStatus(response.data.newWatchingToken);

          // Reopen popup if it was closed
          if (!popupActive) {
            openPopupWindow();
          }
        } else {
          addLog('Incorrect answer');
          // Could show feedback for incorrect answer
        }
      }
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      addLog(`Error verifying question: ${errMsg}`);
    }
  };

  return (
    <div className={`relative webViewer-container ${className}`}>
      <div className="w-full h-full min-h-[400px] bg-black rounded-lg overflow-hidden">
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
        <QuestionsContainer questions={questions} onAnswer={handleAnswerQuestion} isVisible={showQuestions} />

        {/* Error state */}
        {hasError && !showDebug && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white p-6">
            <AlertCircle className="w-16 h-16 text-red-400 mb-4" />
            <h3 className="text-xl font-bold mb-2">{t('webViewer.loadError')}</h3>
            <p className="text-gray-300 text-center mb-2">{platformName}</p>
            <p className="text-sm text-gray-400 text-center mb-6 max-w-md">{errorMessage || t('webViewer.loadErrorDescription')}</p>

            <button
              onClick={() => {
                setHasError(false);
                startWatchingSession();
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
                <span className="font-bold">URL:</span> {url.substring(0, 30)}...
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
              <button onClick={() => window.open(url, '_blank')} className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-sm rounded flex-1">
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
