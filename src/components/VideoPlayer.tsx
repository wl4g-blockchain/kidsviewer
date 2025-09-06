import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from '../i18n/I18nProvider';
import { AlertCircle, ExternalLink, Loader2, RefreshCw, Maximize2 } from 'lucide-react';
import { isIOS, isElectron as checkIsElectron } from '../utils/platformUtil';
import { IOSVideoPlayer } from './IOSVideoPlayer';

interface VideoPlayerProps {
  url: string;
  platformName: string;
  onLoadError?: (error: string) => void;
  onLoadSuccess?: () => void;
  className?: string;
  timeLimit?: number; // 添加时间限制参数（分钟）
}

export const VideoPlayer: React.FC<VideoPlayerProps> = (props) => {
  const { url, platformName, onLoadError, onLoadSuccess, className = '', timeLimit } = props;
  
  // 根据平台选择合适的播放器实现
  if (isIOS()) {
    return (
      <IOSVideoPlayer 
        url={url} 
        platformName={platformName}
        onLoadError={onLoadError}
        onLoadSuccess={onLoadSuccess}
        className={className}
        timeLimit={timeLimit}
      />
    );
  } else {
    // 使用Electron或网页实现
    return <ElectronVideoPlayer {...props} />;
  }
};

// Electron版播放器实现
const ElectronVideoPlayer: React.FC<VideoPlayerProps> = ({ url, platformName, onLoadError, onLoadSuccess, className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isElectron, setIsElectron] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [videoWindowId, setVideoWindowId] = useState<number | null>(null);
  const [videoViewMode, setVideoViewMode] = useState<'embedded' | 'window'>('embedded');
  const t = useTranslation();

  // 增强对Electron环境和预加载脚本的检测
  useEffect(() => {
    const checkElectron = () => {
      // 检测多种可能的Electron特征
      const win = window as any;
      const isElectronEnv = checkIsElectron();
      
      // 检查预加载脚本是否执行
      const isPreloadExecuted = win.__ELECTRON_PRELOAD_EXECUTED__ === true;
      
      console.log('Electron 环境检查:', { 
        isElectronEnv,
        hasElectronAPI: typeof window !== 'undefined' && !!window.electronAPI,
        preloadExecuted: isPreloadExecuted,
        userAgent: window.navigator?.userAgent,
        windowKeys: Object.keys(window).filter(k => k.includes('electron') || k.includes('ELECTRON'))
      });
      
      setIsElectron(isElectronEnv);
      
      // 如果检测到是Electron，但electronAPI未定义，记录错误
      if (isElectronEnv && !window.electronAPI) {
        console.error('在Electron环境中运行，但electronAPI未定义。请检查预加载脚本。');
        
        // 添加更详细的错误信息
        setHasError(true);
        setErrorMessage('Electron API未加载。这通常是由于预加载脚本未正确执行导致的。请尝试重启应用。');
        setIsLoading(false);
      }
    };

    checkElectron();
    
    // 如果API未加载，每秒尝试重新检查
    let timer: number | null = null;
    if (!window.electronAPI && isElectron) {
      timer = window.setInterval(() => {
        if (window.electronAPI) {
          console.log('electronAPI已成功加载');
          clearInterval(timer!);
          window.location.reload(); // 刷新页面以重新加载组件
        }
      }, 1000);
    }
    
    return () => {
      if (timer !== null) clearInterval(timer);
    };
  }, []);

  // Initialize BrowserView when component mounts
  useEffect(() => {
    if (!isElectron || !containerRef.current || videoViewMode !== 'embedded') return;

    const initializeVideoView = async () => {
      try {
        setIsLoading(true);
        setHasError(false);
        setErrorMessage('');
        setIsRetrying(true);

        // 确认electronAPI是否可用
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

        console.log('Creating video view with bounds:', bounds);
        console.log('Loading URL:', url);

        // Create BrowserView
        const result = await window.electronAPI.createVideoView({ url, bounds });

        if (result.success) {
          console.log('Video view created successfully');
          setIsRetrying(false);
        } else {
          throw new Error(result.error || 'Failed to create video view');
        }
      } catch (error) {
        console.error('Error initializing video view:', error);
        setHasError(true);
        setErrorMessage(error instanceof Error ? error.message : 'Unknown error');
        setIsLoading(false);
        setIsRetrying(false);
        onLoadError?.(error instanceof Error ? error.message : 'Unknown error');
      }
    };

    // Set up event listeners
    const handleVideoLoadError = (data: { url: string; error: string }) => {
      console.error('Video load error:', data);
      setHasError(true);
      setErrorMessage(data.error);
      setIsLoading(false);
      setIsRetrying(false);
      onLoadError?.(data.error);
    };

    const handleVideoLoadSuccess = (data: { url: string }) => {
      console.log('Video loaded successfully:', data.url);
      setIsLoading(false);
      setHasError(false);
      setErrorMessage('');
      setIsRetrying(false);
      onLoadSuccess?.();
    };

    // 确保API存在
    if (window.electronAPI) {
      window.electronAPI.onVideoLoadError(handleVideoLoadError);
      window.electronAPI.onVideoLoadSuccess(handleVideoLoadSuccess);
    }

    // Initialize with a small delay to ensure DOM is ready
    const timer = setTimeout(initializeVideoView, 100);

    return () => {
      clearTimeout(timer);
      if (window.electronAPI) {
        window.electronAPI.removeVideoListeners();
      }
    };
  }, [isElectron, url, onLoadError, onLoadSuccess, videoViewMode]);

  // Initialize window mode when selected
  useEffect(() => {
    if (!isElectron || videoViewMode !== 'window') return;

    const openVideoInWindow = async () => {
      try {
        setIsLoading(true);
        setHasError(false);
        setErrorMessage('');

        // 确认API可用
        if (!window.electronAPI || !window.electronAPI.openVideoWindow) {
          throw new Error('Electron API for opening video window is not available');
        }

        const result = await window.electronAPI.openVideoWindow({ 
          url, 
          title: `${platformName} - ${t('video.playerWindowTitle')}`,
        });

        if (result.success && result.windowId) {
          console.log('Video window opened successfully with ID:', result.windowId);
          setVideoWindowId(result.windowId);
          setIsLoading(false);
          onLoadSuccess?.();
        } else {
          throw new Error(result.error || 'Failed to open video window');
        }
      } catch (error) {
        console.error('Error opening video window:', error);
        setHasError(true);
        setErrorMessage(error instanceof Error ? error.message : 'Unknown error');
        setIsLoading(false);
        onLoadError?.(error instanceof Error ? error.message : 'Unknown error');
      }
    };

    openVideoInWindow();

    return () => {
      if (window.electronAPI && videoWindowId !== null) {
        window.electronAPI.closeVideoWindow(videoWindowId);
        setVideoWindowId(null);
      }
    };
  }, [isElectron, url, platformName, videoViewMode, t, onLoadError, onLoadSuccess]);

  // Handle window resize and update BrowserView bounds
  useEffect(() => {
    if (!isElectron || !containerRef.current || hasError || videoViewMode !== 'embedded') return;

    const updateBounds = () => {
      if (!containerRef.current || !window.electronAPI) return;

      const rect = containerRef.current.getBoundingClientRect();
      const bounds = {
        x: Math.round(rect.left),
        y: Math.round(rect.top),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      };

      console.log('Updating video bounds:', bounds);
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
  }, [isElectron, hasError, videoViewMode]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isElectron && window.electronAPI) {
        if (videoViewMode === 'embedded') {
          window.electronAPI.destroyVideoView();
        } else if (videoWindowId !== null) {
          window.electronAPI.closeVideoWindow(videoWindowId);
        }
      }
    };
  }, [isElectron, videoViewMode, videoWindowId]);

  // Switch between embedded and window modes
  const toggleViewMode = async () => {
    if (!isElectron || !window.electronAPI) return;
    
    // Clean up current mode
    if (videoViewMode === 'embedded') {
      await window.electronAPI.destroyVideoView();
    } else if (videoWindowId !== null) {
      await window.electronAPI.closeVideoWindow(videoWindowId);
      setVideoWindowId(null);
    }
    
    // Toggle mode
    setVideoViewMode(prev => (prev === 'embedded' ? 'window' : 'embedded'));
    setIsLoading(true);
  };

  // Fallback to open in new window - 直接使用内部窗口而不是外部浏览器
  const openInNewWindow = () => {
    if (isElectron && window.electronAPI && window.electronAPI.openVideoWindow) {
      // 优先使用我们的独立窗口功能
      window.electronAPI.openVideoWindow({ 
        url, 
        title: `${platformName} - ${t('video.playerWindowTitle')}` 
      }).then(result => {
        if (result.success && result.windowId) {
          setVideoWindowId(result.windowId);
          setVideoViewMode('window');
        }
      }).catch(error => {
        console.error('Error opening video window:', error);
        // 降级到普通的openUrl
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

    if (videoViewMode === 'embedded' && containerRef.current && window.electronAPI) {
      try {
        const rect = containerRef.current.getBoundingClientRect();
        const bounds = {
          x: Math.round(rect.left),
          y: Math.round(rect.top),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        };

        console.log(`Retry ${retryCount + 1}: Creating video view with bounds:`, bounds);

        const result = await window.electronAPI.createVideoView({ url, bounds });

        if (!result.success) {
          throw new Error(result.error || 'Failed to create video view');
        }
      } catch (error) {
        console.error('Error retrying video load:', error);
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
          title: `${platformName} - ${t('video.playerWindowTitle')}`,
        });

        if (result.success && result.windowId) {
          setVideoWindowId(result.windowId);
          setIsLoading(false);
          setIsRetrying(false);
        } else {
          throw new Error(result.error || 'Failed to open video window');
        }
      } catch (error) {
        console.error('Error retrying video window:', error);
        setHasError(true);
        setErrorMessage(error instanceof Error ? error.message : 'Unknown error');
        setIsLoading(false);
        setIsRetrying(false);
        onLoadError?.(error instanceof Error ? error.message : 'Unknown error');
      }
    }
  };

  useEffect(() => {
    console.log('Debug: Electron detection state:', { 
      isElectron, 
      hasElectronAPI: !!window.electronAPI,
      apis: window.electronAPI ? Object.keys(window.electronAPI) : []
    });
  }, [isElectron]);

  return (
    <div className={`relative ${className}`}>
      <div ref={containerRef} className="w-full h-full min-h-[400px] bg-black rounded-lg overflow-hidden">
        {/* Loading state */}
        {isLoading && !hasError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white">
            <Loader2 className="w-12 h-12 animate-spin mb-4" />
            <p className="text-lg font-medium mb-2">{isRetrying ? '重新加载中...' : t('video.loading')}</p>
            <p className="text-sm text-gray-400">{platformName}</p>
            {isRetrying && <p className="text-xs text-gray-500 mt-2">第 {retryCount + 1} 次尝试</p>}
          </div>
        )}

        {/* Error state */}
        {hasError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white p-6">
            <AlertCircle className="w-16 h-16 text-red-400 mb-4" />
            <h3 className="text-xl font-bold mb-2">{t('video.loadError')}</h3>
            <p className="text-gray-300 text-center mb-2">{platformName}</p>
            <p className="text-sm text-gray-400 text-center mb-6 max-w-md">{errorMessage || t('video.loadErrorDescription')}</p>

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
                {t('video.openInNewWindow')}
              </button>
            </div>

            <div className="mt-4 p-3 bg-yellow-900 rounded-lg max-w-md">
              <p className="text-xs text-yellow-200">{t('video.embedHint')}</p>
            </div>

            {retryCount > 0 && <div className="mt-3 text-xs text-gray-500">已尝试 {retryCount} 次</div>}
          </div>
        )}

        {/* Success state for embedded mode */}
        {!isLoading && !hasError && isElectron && videoViewMode === 'embedded' && (
          <div className="absolute inset-0 pointer-events-none">{/* This div serves as a placeholder for the BrowserView */}</div>
        )}
        
        {/* Success state for window mode */}
        {!isLoading && !hasError && isElectron && videoViewMode === 'window' && videoWindowId !== null && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white p-6">
            <h3 className="text-xl font-bold mb-4">{t('video.runningInWindow')}</h3>
            <p className="text-gray-300 mb-8">{platformName}</p>
            <p className="text-sm text-gray-400 text-center mb-6 max-w-md">{t('video.windowModeDescription')}</p>
            
            <div className="flex flex-row gap-3">
              <button
                onClick={toggleViewMode}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center"
              >
                <Maximize2 className="w-4 h-4 mr-2" />
                {t('video.switchToEmbedded')}
              </button>
            </div>
          </div>
        )}

        {/* Improved detection for Electron environment */}
        {!isElectron && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white p-6">
            <AlertCircle className="w-16 h-16 text-yellow-400 mb-4" />
            <h3 className="text-xl font-bold mb-2">{t('video.electronRequired')}</h3>
            <p className="text-gray-300 text-center mb-4">{t('video.electronRequiredDescription')}</p>
            <p className="text-xs text-gray-400 text-center mb-6">
              {navigator.userAgent}
            </p>

            <button
              onClick={openInNewWindow}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center"
            >
              <ExternalLink className="w-5 h-5 mr-2" />
              {t('video.openInBrowser')}
            </button>
          </div>
        )}
        
        {/* View mode toggle */}
        {isElectron && !hasError && !isLoading && videoViewMode === 'embedded' && (
          <button
            onClick={toggleViewMode}
            className="absolute top-2 right-2 p-2 bg-gray-800 bg-opacity-60 hover:bg-opacity-80 rounded-full text-white z-10"
            title={t('video.openInSeparateWindow')}
          >
            <Maximize2 className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};
