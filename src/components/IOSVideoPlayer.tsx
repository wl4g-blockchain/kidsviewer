import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../i18n/I18nProvider';
import { AlertCircle, Loader2, Clock, Lock, RefreshCw, Bug, PlayCircle, X, Maximize2, Monitor } from 'lucide-react';
import { isIPad } from '../utils/platformUtil';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';

interface IOSVideoPlayerProps {
  url: string;
  platformName: string;
  onLoadError?: (error: string) => void;
  onLoadSuccess?: () => void;
  className?: string;
  timeLimit?: number; // Time limit in minutes
}

/**
 * iOS-specific video player component with fallback popup solution
 * Uses iframe embedding as primary method, with popup window as fallback
 * Features hidden address bar and bottom area in popup mode
 * Supports i18n with English comments
 */
export const IOSVideoPlayer: React.FC<IOSVideoPlayerProps> = ({
  url,
  platformName,
  onLoadError,
  onLoadSuccess,
  className = '',
  timeLimit = 30, // Default 30 minutes
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(timeLimit * 60); // Convert to seconds
  const [timerActive, setTimerActive] = useState(false);
  const [showQuestions, setShowQuestions] = useState(false);
  const [browserOpened, setBrowserOpened] = useState(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [showDebug, setShowDebug] = useState(false);
  const [useIframe, setUseIframe] = useState(true); // Default to iframe mode
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [usePopup, setUsePopup] = useState(false); // Popup mode for fallback
  const [popupWindow, setPopupWindow] = useState<Window | null>(null);
  const [popupActive, setPopupActive] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const timerId = useRef<number | null>(null);
  const t = useTranslation();
  const isIpad = isIPad();

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

    // Try to detect if URL allows embedding
    checkEmbeddable(url);

    return () => {
      // Clean up timer
      clearTimer();
      // Close popup if open
      if (popupWindow && !popupWindow.closed) {
        popupWindow.close();
      }
    };
  }, []);

  // Check if URL allows embedding
  const checkEmbeddable = async (targetUrl: string) => {
    try {
      // We can only do basic checks here, cannot accurately determine all CSP restrictions
      addLog(`Checking if URL allows embedding: ${targetUrl}`);

      // Simple judgment based on URL
      const disallowedDomains = ['youtube.com', 'netflix.com', 'hulu.com', 'bilibili.com', 'iqiyi.com'];

      const urlObj = new URL(targetUrl);
      const domain = urlObj.hostname.replace('www.', '');

      const isDisallowed = disallowedDomains.some(d => domain.includes(d));
      if (isDisallowed) {
        addLog(`Detected domain that may not allow embedding: ${domain}`);
        setUseIframe(false);
        setUsePopup(true); // Use popup as fallback
      } else {
        addLog(`No clear embedding restrictions detected, trying iframe`);
        setUseIframe(true);
      }
    } catch (error) {
      addLog(`Error checking embeddability: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // Open popup window with hidden address bar and bottom area
  const openPopupWindow = async () => {
    addLog('Attempting to open popup window...');
    try {
      setIsLoading(true);

      addLog(`Opening URL: ${url}`);

      // Create popup window with specific features to hide address bar and bottom area
      const popupFeatures = [
        'width=1200',
        'height=800',
        'left=' + (screen.width / 2 - 600),
        'top=' + (screen.height / 2 - 400),
        'menubar=no',
        'toolbar=no',
        'location=no', // Hide address bar
        'status=no', // Hide status bar (bottom area)
        'resizable=yes',
        'scrollbars=yes',
        'titlebar=no', // Hide title bar
        'directories=no',
        'fullscreen=no',
      ].join(',');

      const newWindow = window.open(url, 'videoPlayer', popupFeatures);

      if (!newWindow) {
        throw new Error('Popup blocked by browser');
      }

      setPopupWindow(newWindow);
      setPopupActive(true);
      setUsePopup(true);
      setBrowserOpened(true);
      setTimerActive(true);
      startTimer();

      // Monitor popup window
      const checkClosed = setInterval(() => {
        if (newWindow.closed) {
          addLog('Popup window was closed');
          setPopupActive(false);
          setBrowserOpened(false);
          setTimerActive(false);
          clearTimer();
          clearInterval(checkClosed);
        }
      }, 1000);

      addLog('Popup window opened successfully');
      setIsLoading(false);
      onLoadSuccess?.();
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Failed to open popup window';
      addLog(`Failed to open popup window: ${errMsg}`);
      console.error('Failed to open popup window:', error);
      setHasError(true);
      setErrorMessage(errMsg);
      setIsLoading(false);
      onLoadError?.(errMsg);
    }
  };

  // Open internal browser (original method)
  const openInternalBrowser = async () => {
    addLog('Attempting to open internal browser...');
    try {
      setIsLoading(true);

      // Check if Capacitor is available
      if (!Capacitor.isNativePlatform()) {
        const errMsg = 'Capacitor platform not available, cannot use controlled browser';
        addLog(`Error: ${errMsg}`);
        throw new Error(errMsg);
      }

      addLog(`Preparing to open URL: ${url}`);

      // Set timer
      startTimer();

      // Open browser
      addLog('Calling Browser.open...');
      await Browser.open({
        url: url,
        toolbarColor: '#000000',
        presentationStyle: 'popover', // Try non-fullscreen mode
      });

      addLog('Browser opened');
      setBrowserOpened(true);
      setTimerActive(true);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Failed to open browser';
      addLog(`Failed to open browser: ${errMsg}`);
      console.error('Failed to open browser:', error);
      setHasError(true);
      setErrorMessage(errMsg);
      setIsLoading(false);
      onLoadError?.(errMsg);
    }
  };

  // iframe load handler
  const handleIframeLoad = () => {
    addLog('iframe loaded');
    setIsLoading(false);
    setIframeLoaded(true);
    setTimerActive(true);
    startTimer();
    onLoadSuccess?.();
  };

  // iframe load error handler
  const handleIframeError = () => {
    addLog('iframe load failed, may have content security policy restrictions');
    setIsLoading(false);
    setHasError(true);
    setErrorMessage('Content load failed, possibly due to security restrictions. Please try popup mode.');
    onLoadError?.('iframe load error');
  };

  // Start iframe content playback
  const startIframeView = () => {
    addLog('Starting iframe viewing mode');
    setIsLoading(true);
    // iframe loading will trigger handleIframeLoad or handleIframeError
  };

  // Close browser
  const closeBrowser = async () => {
    addLog('Attempting to close browser');
    try {
      if (popupWindow && !popupWindow.closed) {
        popupWindow.close();
        setPopupWindow(null);
        setPopupActive(false);
      } else {
        await Browser.close();
      }
      addLog('Browser closed');
      setBrowserOpened(false);
      setTimerActive(false);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      addLog(`Failed to close browser: ${errMsg}`);
      console.error('Failed to close browser:', error);
    }
  };

  // Start timer
  const startTimer = () => {
    addLog('Starting timer');
    clearTimer(); // Ensure no multiple timers running

    timerId.current = window.setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          // Time up - show questions
          addLog('Timer ended - triggering time up handling');
          handleTimesUp();
          clearTimer();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Clear timer
  const clearTimer = () => {
    if (timerId.current !== null) {
      addLog('Clearing timer');
      clearInterval(timerId.current);
      timerId.current = null;
    }
  };

  // Time up handler - force stop video and show questions
  const handleTimesUp = async () => {
    addLog('Handling time up');
    setTimerActive(false);

    if (browserOpened) {
      // If in browser mode, close browser
      try {
        addLog('Attempting to close browser');
        await closeBrowser();
        addLog('Browser closed');
        setBrowserOpened(false);
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : 'Unknown error';
        addLog(`Failed to close browser: ${errMsg}`);
      }
    }

    // Show questions interface
    setShowQuestions(true);
  };

  // Format time
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Answer question and continue watching
  const handleAnswerQuestion = () => {
    addLog('Question answered correctly - continuing to watch');
    setShowQuestions(false);
    // Reset timer (give 10 minutes)
    setTimeRemaining(10 * 60);

    // Continue watching
    if (useIframe) {
      startIframeView();
    } else if (usePopup) {
      openPopupWindow();
    } else {
      openInternalBrowser();
    }
  };

  // Handle browser close event
  const handleBrowserClosed = () => {
    addLog('Handling browser close event');
    setBrowserOpened(false);
    setTimerActive(false);
    clearTimer();
  };

  // Toggle fullscreen for popup
  const toggleFullscreen = () => {
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

  // Set up browser event listeners
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    // Set up listeners on browser events
    const setupBrowserListeners = async () => {
      addLog('Setting up browser event listeners');
      try {
        // Listen for browser close event
        Browser.addListener('browserFinished', () => {
          addLog('Event: Browser was closed');
          handleBrowserClosed();
        });

        // Listen for browser page load complete event
        Browser.addListener('browserPageLoaded', () => {
          addLog('Event: Browser page loaded');
          setIsLoading(false);
          onLoadSuccess?.();
        });

        addLog('Browser listeners set up complete');
      } catch (err) {
        const error = err as Error;
        addLog(`Error setting up listeners: ${error.message}`);
      }
    };

    setupBrowserListeners();

    return () => {
      // Clean up listeners
      if (browserOpened) {
        closeBrowser();
      }
      try {
        Browser.removeAllListeners();
        addLog('Removed all listeners');
      } catch (error) {
        addLog(`Error removing listeners: ${(error as Error).message}`);
      }
    };
  }, []);

  return (
    <div className={`relative ${className}`}>
      <div className="w-full h-full min-h-[400px] bg-black rounded-lg overflow-hidden">
        {/* Iframe container - when using iframe mode */}
        {useIframe && !showQuestions && !showDebug && (
          <div className="w-full h-full relative">
            <iframe
              ref={iframeRef}
              src={isLoading ? '' : url}
              className="w-full h-full border-0"
              onLoad={handleIframeLoad}
              onError={handleIframeError}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />

            {/* Loading overlay */}
            {isLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white">
                <Loader2 className="w-12 h-12 animate-spin mb-4" />
                <p className="text-lg font-medium mb-2">{t('video.loading')}</p>
                <p className="text-sm text-gray-400">{platformName}</p>
              </div>
            )}

            {/* Control panel - floating above iframe */}
            {iframeLoaded && (
              <div className="absolute top-2 right-2 bg-black bg-opacity-60 p-2 rounded-lg flex items-center space-x-2">
                <Clock className={`w-4 h-4 ${timeRemaining < 60 ? 'text-red-400' : 'text-blue-400'}`} />
                <span className={`text-sm font-bold ${timeRemaining < 60 ? 'text-red-400' : 'text-white'}`}>
                  {formatTime(timeRemaining)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Mode selection interface - when not started watching */}
        {!iframeLoaded && !browserOpened && !showQuestions && !showDebug && !isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white p-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <PlayCircle className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold mb-2">{t('video.iosControlledNotice')}</h3>

            <p className="text-gray-300 text-center mb-4">{t('video.chooseViewMode')}</p>

            <p className="text-sm text-gray-400 text-center mb-6 max-w-md">{platformName}</p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-lg">
              <button
                onClick={startIframeView}
                className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex flex-col items-center"
              >
                <span className="text-lg mb-1">{t('video.embeddedMode')}</span>
                <span className="text-xs text-blue-200">{t('video.embeddedModeDesc')}</span>
              </button>

              <button
                onClick={openInternalBrowser}
                className="px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors flex flex-col items-center"
              >
                <span className="text-lg mb-1">{t('video.browserMode')}</span>
                <span className="text-xs text-gray-300">{t('video.browserModeDesc')}</span>
              </button>

              <button
                onClick={openPopupWindow}
                className="px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex flex-col items-center"
              >
                <span className="text-lg mb-1">{t('video.popupMode')}</span>
                <span className="text-xs text-green-200">{t('video.popupModeDesc')}</span>
              </button>
            </div>

            <div className="mt-4 p-3 bg-blue-900 rounded-lg max-w-md">
              <p className="text-xs text-blue-200">{t('video.iosTimeLimit', { minutes: timeLimit })}</p>
            </div>

            {/* Popup mode info */}
            <div className="mt-2 p-2 bg-gray-800 rounded-lg max-w-md">
              <div className="flex items-center justify-center">
                <span className="text-xs text-gray-300">{t('video.popupFallback')}</span>
              </div>
              <p className="text-xs text-gray-400 mt-1 text-center">{t('video.popupModeDesc')}</p>
            </div>
          </div>
        )}

        {/* Browser/popup closed interface - browser mode */}
        {browserOpened && !showDebug && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white p-6">
            <Clock className="w-16 h-16 text-blue-400 mb-4" />
            <h3 className="text-xl font-bold mb-2">{t('time.timeRemaining')}</h3>
            <div className="text-4xl font-bold mb-6">{formatTime(timeRemaining)}</div>
            <p className="text-sm text-gray-400 text-center mb-6 max-w-md">{t('video.videoIsPlaying')}</p>

            {/* Popup controls */}
            {usePopup && popupActive && (
              <div className="flex space-x-2 mb-4">
                <button onClick={toggleFullscreen} className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm flex items-center">
                  {isFullscreen ? <Monitor className="w-4 h-4 mr-1" /> : <Maximize2 className="w-4 h-4 mr-1" />}
                  {isFullscreen ? t('video.popupExitFullscreenButton') : t('video.popupFullscreenButton')}
                </button>
                <button onClick={closeBrowser} className="px-3 py-2 bg-red-600 hover:bg-red-700 rounded text-sm flex items-center">
                  <X className="w-4 h-4 mr-1" />
                  {t('video.popupCloseButton')}
                </button>
              </div>
            )}

            <p className="text-xs text-gray-500 text-center">{usePopup ? t('video.popupCloseHint') : t('video.returnToAppWhenDone')}</p>
          </div>
        )}

        {/* Questions interface */}
        {showQuestions && !showDebug && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white p-6">
            <Lock className="w-16 h-16 text-blue-400 mb-4" />
            <h3 className="text-xl font-bold mb-2">{t('person.unlockToContinue')}</h3>
            <p className="text-gray-300 text-center mb-6">{t('time.timeUp')}</p>

            {/* Here you can integrate actual question UI, using a simple button for demo */}
            <div className="max-w-md w-full space-y-4">
              <div className="bg-gray-800 p-4 rounded-lg">
                <p className="text-center mb-4">2 + 2 = ?</p>
                <div className="grid grid-cols-2 gap-3">
                  <button className="p-3 bg-gray-700 rounded hover:bg-gray-600">3</button>
                  <button onClick={handleAnswerQuestion} className="p-3 bg-gray-700 rounded hover:bg-gray-600">
                    4
                  </button>
                  <button className="p-3 bg-gray-700 rounded hover:bg-gray-600">5</button>
                  <button className="p-3 bg-gray-700 rounded hover:bg-gray-600">6</button>
                </div>
              </div>
              <p className="text-sm text-center text-gray-400">{t('person.unlockToContinue')}</p>
            </div>
          </div>
        )}

        {/* Error state */}
        {hasError && !showDebug && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white p-6">
            <AlertCircle className="w-16 h-16 text-red-400 mb-4" />
            <h3 className="text-xl font-bold mb-2">{t('video.loadError')}</h3>
            <p className="text-gray-300 text-center mb-2">{platformName}</p>
            <p className="text-sm text-gray-400 text-center mb-6 max-w-md">{errorMessage || t('video.loadErrorDescription')}</p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => {
                  setHasError(false);
                  setUseIframe(true);
                  setUsePopup(false);
                  startIframeView();
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                {t('video.tryEmbeddedMode')}
              </button>

              <button
                onClick={() => {
                  setHasError(false);
                  setUseIframe(false);
                  setUsePopup(false);
                  openInternalBrowser();
                }}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors flex items-center justify-center"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                {t('video.tryBrowserMode')}
              </button>

              <button
                onClick={() => {
                  setHasError(false);
                  setUseIframe(false);
                  setUsePopup(true);
                  openPopupWindow();
                }}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center justify-center"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                {t('video.popupMode')}
              </button>
            </div>
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
                <span className="font-bold">Browser Status:</span> {browserOpened ? 'Open' : 'Closed'}
              </div>
              <div className="bg-gray-800 p-2 rounded">
                <span className="font-bold">Timer:</span> {timerActive ? 'Active' : 'Stopped'}
              </div>
              <div className="bg-gray-800 p-2 rounded">
                <span className="font-bold">Time Remaining:</span> {formatTime(timeRemaining)}
              </div>
              <div className="bg-gray-800 p-2 rounded">
                <span className="font-bold">Mode:</span> {useIframe ? 'iframe' : usePopup ? 'popup' : 'browser'}
              </div>
              <div className="bg-gray-800 p-2 rounded">
                <span className="font-bold">iframe Status:</span> {iframeLoaded ? 'Loaded' : 'Not Loaded'}
              </div>
              <div className="bg-gray-800 p-2 rounded">
                <span className="font-bold">Popup Status:</span> {popupActive ? 'Active' : 'Inactive'}
              </div>
              <div className="bg-gray-800 p-2 rounded">
                <span className="font-bold">Fullscreen:</span> {isFullscreen ? 'Yes' : 'No'}
              </div>
            </div>

            <div className="flex mb-2">
              <button
                onClick={() => {
                  setUseIframe(true);
                  setUsePopup(false);
                  startIframeView();
                }}
                className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-sm rounded mr-2 flex-1"
              >
                Use iframe
              </button>
              <button onClick={openInternalBrowser} className="px-2 py-1 bg-green-600 hover:bg-green-700 text-sm rounded mr-2 flex-1">
                Open Browser
              </button>
              <button onClick={openPopupWindow} className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-sm rounded mr-2 flex-1">
                Open Popup
              </button>
              <button onClick={closeBrowser} className="px-2 py-1 bg-red-600 hover:bg-red-700 text-sm rounded flex-1">
                Close
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
