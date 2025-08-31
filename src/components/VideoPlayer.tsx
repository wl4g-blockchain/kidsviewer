import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from '../i18n/I18nProvider';
import { AlertCircle, ExternalLink, Loader2 } from 'lucide-react';

interface VideoPlayerProps {
  url: string;
  platformName: string;
  onLoadError?: (error: string) => void;
  onLoadSuccess?: () => void;
  className?: string;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  url,
  platformName,
  onLoadError,
  onLoadSuccess,
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isElectron, setIsElectron] = useState(false);
  const t = useTranslation();

  // Check if running in Electron
  useEffect(() => {
    setIsElectron(typeof window !== 'undefined' && window.electronAPI !== undefined);
  }, []);

  // Initialize BrowserView when component mounts
  useEffect(() => {
    if (!isElectron || !containerRef.current) return;

    const initializeVideoView = async () => {
      try {
        // Get container bounds
        const rect = containerRef.current!.getBoundingClientRect();
        const bounds = {
          x: Math.round(rect.left),
          y: Math.round(rect.top),
          width: Math.round(rect.width),
          height: Math.round(rect.height)
        };

        // Create BrowserView
        const result = await window.electronAPI.createVideoView({ url, bounds });
        
        if (result.success) {
          console.log('Video view created successfully');
        } else {
          throw new Error(result.error || 'Failed to create video view');
        }
      } catch (error) {
        console.error('Error initializing video view:', error);
        setHasError(true);
        setErrorMessage(error instanceof Error ? error.message : 'Unknown error');
        setIsLoading(false);
        onLoadError?.(error instanceof Error ? error.message : 'Unknown error');
      }
    };

    // Set up event listeners
    const handleVideoLoadError = (data: { url: string; error: string }) => {
      console.error('Video load error:', data);
      setHasError(true);
      setErrorMessage(data.error);
      setIsLoading(false);
      onLoadError?.(data.error);
    };

    const handleVideoLoadSuccess = (data: { url: string }) => {
      console.log('Video loaded successfully:', data.url);
      setIsLoading(false);
      setHasError(false);
      onLoadSuccess?.();
    };

    window.electronAPI.onVideoLoadError(handleVideoLoadError);
    window.electronAPI.onVideoLoadSuccess(handleVideoLoadSuccess);

    // Initialize with a small delay to ensure DOM is ready
    const timer = setTimeout(initializeVideoView, 100);

    return () => {
      clearTimeout(timer);
      window.electronAPI.removeVideoListeners();
    };
  }, [isElectron, url, onLoadError, onLoadSuccess]);

  // Handle window resize and update BrowserView bounds
  useEffect(() => {
    if (!isElectron || !containerRef.current || hasError) return;

    const updateBounds = () => {
      if (!containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const bounds = {
        x: Math.round(rect.left),
        y: Math.round(rect.top),
        width: Math.round(rect.width),
        height: Math.round(rect.height)
      };

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
  }, [isElectron, hasError]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isElectron) {
        window.electronAPI.destroyVideoView();
      }
    };
  }, [isElectron]);

  // Fallback to open in new window
  const openInNewWindow = () => {
    if (isElectron) {
      window.electronAPI.openUrl(url);
    } else {
      window.open(url, '_blank', 'width=1200,height=800');
    }
  };

  // Retry loading
  const retryLoad = async () => {
    if (!isElectron || !containerRef.current) return;

    setIsLoading(true);
    setHasError(false);
    setErrorMessage('');

    try {
      const rect = containerRef.current.getBoundingClientRect();
      const bounds = {
        x: Math.round(rect.left),
        y: Math.round(rect.top),
        width: Math.round(rect.width),
        height: Math.round(rect.height)
      };

      const result = await window.electronAPI.createVideoView({ url, bounds });
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create video view');
      }
    } catch (error) {
      console.error('Error retrying video load:', error);
      setHasError(true);
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error');
      setIsLoading(false);
      onLoadError?.(error instanceof Error ? error.message : 'Unknown error');
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div
        ref={containerRef}
        className="w-full h-full min-h-[400px] bg-black rounded-lg overflow-hidden"
      >
        {/* Loading state */}
        {isLoading && !hasError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white">
            <Loader2 className="w-12 h-12 animate-spin mb-4" />
            <p className="text-lg font-medium mb-2">{t('video.loading')}</p>
            <p className="text-sm text-gray-400">{platformName}</p>
          </div>
        )}

        {/* Error state */}
        {hasError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white p-6">
            <AlertCircle className="w-16 h-16 text-red-400 mb-4" />
            <h3 className="text-xl font-bold mb-2">{t('video.loadError')}</h3>
            <p className="text-gray-300 text-center mb-2">{platformName}</p>
            <p className="text-sm text-gray-400 text-center mb-6 max-w-md">
              {errorMessage || t('video.loadErrorDescription')}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={retryLoad}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center"
              >
                <Loader2 className="w-4 h-4 mr-2" />
                {t('common.retry')}
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
              <p className="text-xs text-yellow-200">
                {t('video.embedHint')}
              </p>
            </div>
          </div>
        )}

        {/* Success state - BrowserView will be overlaid here */}
        {!isLoading && !hasError && isElectron && (
          <div className="absolute inset-0 pointer-events-none">
            {/* This div serves as a placeholder for the BrowserView */}
          </div>
        )}

        {/* Fallback for non-Electron environments */}
        {!isElectron && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white p-6">
            <AlertCircle className="w-16 h-16 text-yellow-400 mb-4" />
            <h3 className="text-xl font-bold mb-2">{t('video.electronRequired')}</h3>
            <p className="text-gray-300 text-center mb-6">{t('video.electronRequiredDescription')}</p>
            
            <button
              onClick={openInNewWindow}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center"
            >
              <ExternalLink className="w-5 h-5 mr-2" />
              {t('video.openInBrowser')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}; 