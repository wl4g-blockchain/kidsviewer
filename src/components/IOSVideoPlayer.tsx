import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../i18n/I18nProvider';
import { AlertCircle, ExternalLink, Loader2, Clock, Lock, RefreshCw, Bug, PlayCircle } from 'lucide-react';
import { isIPad } from '../utils/platformUtil';
import { View, Platform, BackHandler } from 'react-native';
import { WebView } from 'react-native-webview';

interface IOSVideoPlayerProps {
  url: string;
  platformName: string;
  onLoadError?: (error: string) => void;
  onLoadSuccess?: () => void;
  className?: string;
  timeLimit?: number; // Time limit in minutes
}

/**
 * Video player component for iOS using React Native WebView
 * Can load third-party video sites without CSP restrictions
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
  const [webViewActive, setWebViewActive] = useState(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [showDebug, setShowDebug] = useState(false);
  const webViewRef = useRef<WebView>(null);
  const timerId = useRef<NodeJS.Timeout | null>(null);
  const t = useTranslation();
  const isIpad = isIPad();

  // Add debug log
  const addLog = (message: string) => {
    console.log(message);
    setDebugLogs(prev => [
      `[${new Date().toISOString().slice(11, 19)}] ${message}`,
      ...prev.slice(0, 19)
    ]);
  };

  // Initialize component
  useEffect(() => {
    addLog(`Component mounted - URL: ${url}`);
    addLog(`Platform: ${Platform.OS}`);
    addLog(`Device: ${isIpad ? 'iPad' : 'iPhone'}`);
    
    // Clean up timer on unmount
    return () => {
      clearTimer();
    };
  }, []);

  // Start WebView
  const startWebView = () => {
    addLog('Starting WebView playback');
    setIsLoading(true);
    setWebViewActive(true);
  };

  // Handle WebView loading success
  const handleWebViewLoad = () => {
    addLog('WebView loaded successfully');
    setIsLoading(false);
    setTimerActive(true);
    startTimer();
    onLoadSuccess?.();
  };

  // Handle WebView loading error
  const handleWebViewError = (error: any) => {
    const errMsg = error?.description || 'Failed to load content';
    addLog(`WebView load error: ${errMsg}`);
    setIsLoading(false);
    setHasError(true);
    setErrorMessage(errMsg);
    onLoadError?.(errMsg);
  };

  // Start timer
  const startTimer = () => {
    addLog('Starting timer');
    clearTimer(); // Ensure no duplicate timers
    
    timerId.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          // Time's up - show questions
          addLog('Timer ended - handling time up');
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

  // Handle time up
  const handleTimesUp = () => {
    addLog('Handling time up');
    setTimerActive(false);
    setWebViewActive(false);
    
    // Show questions screen
    setShowQuestions(true);
  };

  // Format time for display
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Handle answering questions correctly
  const handleAnswerQuestion = () => {
    addLog('Question answered correctly - resuming playback');
    setShowQuestions(false);
    // Reset timer (give 10 minutes)
    setTimeRemaining(10 * 60);
    
    // Continue watching
    startWebView();
  };

  // Handle back button press on Android
  useEffect(() => {
    if (Platform.OS === 'android') {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        if (webViewActive && !showQuestions) {
          addLog('Back button pressed - stopping WebView');
          setWebViewActive(false);
          setTimerActive(false);
          clearTimer();
          return true; // Prevent default back behavior
        }
        return false;
      });

      return () => backHandler.remove();
    }
  }, [webViewActive, showQuestions]);

  return (
    <div className={`relative ${className}`}>
      <div className="w-full h-full min-h-[400px] bg-black rounded-lg overflow-hidden">
        {/* WebView container */}
        {webViewActive && !showQuestions && !showDebug && (
          <View style={{ width: '100%', height: '100%' }}>
            <WebView
              ref={webViewRef}
              source={{ uri: url }}
              style={{ flex: 1 }}
              onLoad={handleWebViewLoad}
              onError={handleWebViewError}
              onHttpError={(e) => handleWebViewError(e.nativeEvent)}
              allowsFullscreenVideo={true}
              allowsInlineMediaPlayback={true}
              mediaPlaybackRequiresUserAction={false}
              javaScriptEnabled={true}
              domStorageEnabled={true}
            />
            
            {/* Loading overlay */}
            {isLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white">
                <Loader2 className="w-12 h-12 animate-spin mb-4" />
                <p className="text-lg font-medium mb-2">{t('video.loading')}</p>
                <p className="text-sm text-gray-400">{platformName}</p>
              </div>
            )}
            
            {/* Control panel */}
            {!isLoading && (
              <div className="absolute top-2 right-2 bg-black bg-opacity-60 p-2 rounded-lg flex items-center space-x-2">
                <Clock className={`w-4 h-4 ${timeRemaining < 60 ? 'text-red-400' : 'text-blue-400'}`} />
                <span className={`text-sm font-bold ${timeRemaining < 60 ? 'text-red-400' : 'text-white'}`}>
                  {formatTime(timeRemaining)}
                </span>
              </div>
            )}
          </View>
        )}

        {/* Selection screen - before playback starts */}
        {!webViewActive && !showQuestions && !showDebug && !isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white p-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <PlayCircle className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold mb-2">{t('video.iosControlledNotice')}</h3>
            
            <p className="text-gray-300 text-center mb-4">{t('video.chooseViewMode')}</p>
            
            <p className="text-sm text-gray-400 text-center mb-6 max-w-md">{platformName}</p>

            <button
              onClick={startWebView}
              className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex flex-col items-center max-w-md w-full"
            >
              <span className="text-lg mb-1">{t('video.startWatching')}</span>
              <span className="text-xs text-blue-200">{t('video.nativeWebView')}</span>
            </button>
            
            <div className="mt-4 p-3 bg-blue-900 rounded-lg max-w-md">
              <p className="text-xs text-blue-200">{t('video.iosTimeLimit', { minutes: timeLimit })}</p>
            </div>
          </div>
        )}

        {/* Questions screen */}
        {showQuestions && !showDebug && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white p-6">
            <Lock className="w-16 h-16 text-blue-400 mb-4" />
            <h3 className="text-xl font-bold mb-2">{t('person.unlockToContinue')}</h3>
            <p className="text-gray-300 text-center mb-6">{t('time.timeUp')}</p>
            
            {/* Simple question UI for demo */}
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

            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={() => {
                  setHasError(false);
                  startWebView();
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                {t('video.tryAgain')}
              </button>
              
              <button
                onClick={() => {
                  setHasError(false);
                  setIsLoading(false);
                }}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors flex items-center justify-center"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                {t('common.back')}
              </button>
            </div>
          </div>
        )}

        {/* Debug interface */}
        {showDebug && (
          <div className="absolute inset-0 flex flex-col bg-gray-900 text-white p-4 overflow-auto">
            <div className="flex justify-between items-center mb-2 border-b border-gray-700 pb-2">
              <h3 className="text-lg font-bold flex items-center">
                <Bug className="w-5 h-5 mr-2" />
                Debug Console
              </h3>
              <button
                onClick={() => setShowDebug(false)}
                className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-sm rounded"
              >
                Close
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-2 mb-2 text-sm">
              <div className="bg-gray-800 p-2 rounded">
                <span className="font-bold">URL:</span> {url.substring(0, 30)}...
              </div>
              <div className="bg-gray-800 p-2 rounded">
                <span className="font-bold">Platform:</span> {Platform.OS}
              </div>
              <div className="bg-gray-800 p-2 rounded">
                <span className="font-bold">WebView:</span> {webViewActive ? 'Active' : 'Inactive'}
              </div>
              <div className="bg-gray-800 p-2 rounded">
                <span className="font-bold">Timer:</span> {timerActive ? 'Active' : 'Stopped'}
              </div>
              <div className="bg-gray-800 p-2 rounded">
                <span className="font-bold">Time Left:</span> {formatTime(timeRemaining)}
              </div>
            </div>

            <div className="flex mb-2">
              <button
                onClick={startWebView}
                className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-sm rounded mr-2 flex-1"
              >
                Start WebView
              </button>
              <button
                onClick={() => {
                  setWebViewActive(false);
                  setTimerActive(false);
                  clearTimer();
                }}
                className="px-2 py-1 bg-red-600 hover:bg-red-700 text-sm rounded flex-1"
              >
                Stop WebView
              </button>
            </div>

            <div className="bg-black p-2 rounded h-56 overflow-y-auto text-xs font-mono flex-1">
              {debugLogs.map((log, index) => (
                <div key={index} className="text-green-400 pb-1">{log}</div>
              ))}
              {debugLogs.length === 0 && <div className="text-gray-500">No logs yet...</div>}
            </div>
          </div>
        )}
        
        {/* Debug button */}
        <button
          onClick={() => setShowDebug(prev => !prev)}
          className="absolute bottom-2 right-2 bg-gray-800 bg-opacity-60 hover:bg-opacity-80 rounded-full p-2 text-white z-10"
          title="Toggle Debug View"
        >
          <Bug className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
