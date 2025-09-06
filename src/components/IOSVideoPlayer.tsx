import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../i18n/I18nProvider';
import { AlertCircle, ExternalLink, Loader2, Clock, Lock, RefreshCw, Bug, PlayCircle } from 'lucide-react';
import { isIPad } from '../utils/platformUtil';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';

interface IOSVideoPlayerProps {
  url: string;
  platformName: string;
  onLoadError?: (error: string) => void;
  onLoadSuccess?: () => void;
  className?: string;
  timeLimit?: number; // 时间限制（分钟）
}

/**
 * iOS专用视频播放器组件
 * 使用iframe嵌入方式播放视频，结合Browser作为备用选项
 */
export const IOSVideoPlayer: React.FC<IOSVideoPlayerProps> = ({ 
  url, 
  platformName, 
  onLoadError,
  onLoadSuccess,
  className = '',
  timeLimit = 30, // 默认30分钟
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(timeLimit * 60); // 转换为秒
  const [timerActive, setTimerActive] = useState(false);
  const [showQuestions, setShowQuestions] = useState(false);
  const [browserOpened, setBrowserOpened] = useState(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [showDebug, setShowDebug] = useState(false);
  const [useIframe, setUseIframe] = useState(true); // 默认使用iframe模式
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const timerId = useRef<number | null>(null);
  const t = useTranslation();
  const isIpad = isIPad();

  // 添加调试日志
  const addLog = (message: string) => {
    console.log(message);
    setDebugLogs(prev => [
      `[${new Date().toISOString().slice(11, 19)}] ${message}`,
      ...prev.slice(0, 19)
    ]);
  };

  // 当组件挂载时初始化
  useEffect(() => {
    addLog(`组件挂载 - URL: ${url}`);
    addLog(`Capacitor环境: ${Capacitor.isNativePlatform() ? '是' : '否'}`);
    addLog(`平台: ${Capacitor.getPlatform()}`);
    
    // 尝试检测URL是否允许嵌入
    checkEmbeddable(url);
    
    return () => {
      // 清理计时器
      clearTimer();
    };
  }, []);

  // 检查URL是否允许嵌入
  const checkEmbeddable = async (targetUrl: string) => {
    try {
      // 这里我们只能做一些基础检查，无法准确判断所有CSP限制
      addLog(`检查URL是否允许嵌入: ${targetUrl}`);
      
      // 基于URL的简单判断
      const disallowedDomains = [
        'youtube.com',
        'netflix.com', 
        'hulu.com',
        'bilibili.com',
        'iqiyi.com'
      ];
      
      const urlObj = new URL(targetUrl);
      const domain = urlObj.hostname.replace('www.', '');
      
      const isDisallowed = disallowedDomains.some(d => domain.includes(d));
      if (isDisallowed) {
        addLog(`检测到可能不允许嵌入的域名: ${domain}`);
        setUseIframe(false);
      } else {
        addLog(`未检测到明确的嵌入限制，尝试使用iframe`);
        setUseIframe(true);
      }
    } catch (error) {
      addLog(`检查嵌入性出错: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
  
  // 在Safari中打开视频
  const openInternalBrowser = async () => {
    addLog('尝试打开内部浏览器...');
    try {
      setIsLoading(true);
      
      // 检查Capacitor是否可用
      if (!Capacitor.isNativePlatform()) {
        const errMsg = 'Capacitor平台不可用，无法使用受控浏览器';
        addLog(`错误: ${errMsg}`);
        throw new Error(errMsg);
      }

      addLog(`准备打开URL: ${url}`);
      
      // 设置计时器
      startTimer();
      
      // 打开浏览器
      addLog('调用Browser.open...');
      await Browser.open({
        url: url,
        toolbarColor: '#000000',
        presentationStyle: 'popover', // 尝试使用非全屏模式
      });

      addLog('浏览器已打开');
      setBrowserOpened(true);
      setTimerActive(true);
      
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : '打开浏览器失败';
      addLog(`打开浏览器失败: ${errMsg}`);
      console.error('打开浏览器失败:', error);
      setHasError(true);
      setErrorMessage(errMsg);
      setIsLoading(false);
      onLoadError?.(errMsg);
    }
  };

  // iframe加载处理
  const handleIframeLoad = () => {
    addLog('iframe加载完成');
    setIsLoading(false);
    setIframeLoaded(true);
    setTimerActive(true);
    startTimer();
    onLoadSuccess?.();
  };

  // iframe加载错误处理
  const handleIframeError = () => {
    addLog('iframe加载失败，可能存在内容安全策略限制');
    setIsLoading(false);
    setHasError(true);
    setErrorMessage('内容加载失败，可能由于安全限制。请尝试使用浏览器模式。');
    onLoadError?.('iframe加载错误');
  };

  // 启动iframe内容播放
  const startIframeView = () => {
    addLog('启动iframe观看模式');
    setIsLoading(true);
    // iframe的加载会触发handleIframeLoad或handleIframeError
  };

  // 关闭浏览器
  const closeBrowser = async () => {
    addLog('尝试关闭浏览器');
    try {
      await Browser.close();
      addLog('浏览器已关闭');
      setBrowserOpened(false);
      setTimerActive(false);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : '未知错误';
      addLog(`关闭浏览器失败: ${errMsg}`);
      console.error('关闭浏览器失败:', error);
    }
  };
  
  // 启动计时器
  const startTimer = () => {
    addLog('启动计时器');
    clearTimer(); // 确保没有多个计时器运行
    
    timerId.current = window.setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          // 时间到 - 显示问题
          addLog('计时结束 - 触发时间到处理');
          handleTimesUp();
          clearTimer();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };
  
  // 清除计时器
  const clearTimer = () => {
    if (timerId.current !== null) {
      addLog('清除计时器');
      clearInterval(timerId.current);
      timerId.current = null;
    }
  };

  // 时间到处理函数 - 强制停止视频并显示问题
  const handleTimesUp = async () => {
    addLog('处理时间到');
    setTimerActive(false);
    
    if (browserOpened) {
      // 如果是浏览器模式，关闭浏览器
      try {
        addLog('尝试关闭浏览器');
        await Browser.close();
        addLog('浏览器已关闭');
        setBrowserOpened(false);
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : '未知错误';
        addLog(`关闭浏览器失败: ${errMsg}`);
      }
    }
    
    // 显示问题界面
    setShowQuestions(true);
  };

  // 格式化时间
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // 回答问题后继续观看
  const handleAnswerQuestion = () => {
    addLog('回答问题正确 - 继续观看');
    setShowQuestions(false);
    // 重置计时器（给10分钟）
    setTimeRemaining(10 * 60);
    
    // 继续观看
    if (useIframe) {
      startIframeView();
    } else {
      openInternalBrowser();
    }
  };

  // 切换到浏览器模式
  const switchToBrowserMode = () => {
    addLog('切换到浏览器模式');
    setUseIframe(false);
    openInternalBrowser();
  };

  // 在浏览器关闭时的处理
  const handleBrowserClosed = () => {
    addLog('处理浏览器关闭事件');
    setBrowserOpened(false);
    setTimerActive(false);
    clearTimer();
  };

  // 设置浏览器事件监听
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    
    // 在浏览器事件上设置监听器
    const setupBrowserListeners = async () => {
      addLog('设置浏览器事件监听器');
      try {
        // 监听浏览器关闭事件
        Browser.addListener('browserFinished', () => {
          addLog('事件: Browser was closed');
          handleBrowserClosed();
        });

        // 监听浏览器页面加载完成事件
        Browser.addListener('browserPageLoaded', () => {
          addLog('事件: Browser page loaded');
          setIsLoading(false);
          onLoadSuccess?.();
        });
        
        addLog('浏览器监听器设置完成');
      } catch (err) {
        const error = err as Error;
        addLog(`设置监听器错误: ${error.message}`);
      }
    };

    setupBrowserListeners();

    return () => {
      // 清理监听器
      if (browserOpened) {
        closeBrowser();
      }
      try {
        Browser.removeAllListeners();
        addLog('已移除所有监听器');
      } catch (error) {
        addLog(`移除监听器错误: ${(error as Error).message}`);
      }
    };
  }, []);

  return (
    <div className={`relative ${className}`}>
      <div className="w-full h-full min-h-[400px] bg-black rounded-lg overflow-hidden">
        {/* Iframe容器 - 当使用iframe模式时 */}
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
            
            {/* 控制面板 - 悬浮在iframe上方 */}
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

        {/* 选择模式界面 - 未开始观看时 */}
        {!iframeLoaded && !browserOpened && !showQuestions && !showDebug && !isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white p-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <PlayCircle className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold mb-2">{t('video.iosControlledNotice')}</h3>
            
            <p className="text-gray-300 text-center mb-4">{t('video.chooseViewMode')}</p>
            
            <p className="text-sm text-gray-400 text-center mb-6 max-w-md">{platformName}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-md">
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
            </div>
            
            <div className="mt-4 p-3 bg-blue-900 rounded-lg max-w-md">
              <p className="text-xs text-blue-200">{t('video.iosTimeLimit', { minutes: timeLimit })}</p>
            </div>
          </div>
        )}

        {/* 浏览器关闭后的界面 - 浏览器模式 */}
        {browserOpened && !showDebug && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white p-6">
            <Clock className="w-16 h-16 text-blue-400 mb-4" />
            <h3 className="text-xl font-bold mb-2">{t('time.timeRemaining')}</h3>
            <div className="text-4xl font-bold mb-6">{formatTime(timeRemaining)}</div>
            <p className="text-sm text-gray-400 text-center mb-6 max-w-md">{t('video.videoIsPlaying')}</p>
          </div>
        )}

        {/* 问题界面 */}
        {showQuestions && !showDebug && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white p-6">
            <Lock className="w-16 h-16 text-blue-400 mb-4" />
            <h3 className="text-xl font-bold mb-2">{t('person.unlockToContinue')}</h3>
            <p className="text-gray-300 text-center mb-6">{t('time.timeUp')}</p>
            
            {/* 这里可以集成实际的问题UI，为了演示先用一个简单按钮 */}
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
        
        {/* 错误状态 */}
        {hasError && !showDebug && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white p-6">
            <AlertCircle className="w-16 h-16 text-red-400 mb-4" />
            <h3 className="text-xl font-bold mb-2">{t('video.loadError')}</h3>
            <p className="text-gray-300 text-center mb-2">{platformName}</p>
            <p className="text-sm text-gray-400 text-center mb-6 max-w-md">{errorMessage || t('video.loadErrorDescription')}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setHasError(false);
                  setUseIframe(!useIframe);
                  useIframe ? openInternalBrowser() : startIframeView();
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                {useIframe ? t('video.tryBrowserMode') : t('video.tryEmbeddedMode')}
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

        {/* 调试界面 - 显示日志和状态信息 */}
        {showDebug && (
          <div className="absolute inset-0 flex flex-col bg-gray-900 text-white p-4 overflow-auto">
            <div className="flex justify-between items-center mb-2 border-b border-gray-700 pb-2">
              <h3 className="text-lg font-bold flex items-center">
                <Bug className="w-5 h-5 mr-2" />
                调试控制台
              </h3>
              <button
                onClick={() => setShowDebug(false)}
                className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-sm rounded"
              >
                关闭
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-2 mb-2 text-sm">
              <div className="bg-gray-800 p-2 rounded">
                <span className="font-bold">URL:</span> {url.substring(0, 30)}...
              </div>
              <div className="bg-gray-800 p-2 rounded">
                <span className="font-bold">Capacitor:</span> {Capacitor.isNativePlatform() ? '是' : '否'}
              </div>
              <div className="bg-gray-800 p-2 rounded">
                <span className="font-bold">平台:</span> {Capacitor.getPlatform()}
              </div>
              <div className="bg-gray-800 p-2 rounded">
                <span className="font-bold">浏览器状态:</span> {browserOpened ? '已打开' : '未打开'}
              </div>
              <div className="bg-gray-800 p-2 rounded">
                <span className="font-bold">计时器:</span> {timerActive ? '活跃' : '停止'}
              </div>
              <div className="bg-gray-800 p-2 rounded">
                <span className="font-bold">剩余时间:</span> {formatTime(timeRemaining)}
              </div>
              <div className="bg-gray-800 p-2 rounded">
                <span className="font-bold">模式:</span> {useIframe ? 'iframe嵌入' : '浏览器'}
              </div>
              <div className="bg-gray-800 p-2 rounded">
                <span className="font-bold">iframe状态:</span> {iframeLoaded ? '已加载' : '未加载'}
              </div>
            </div>

            <div className="flex mb-2">
              <button
                onClick={() => {
                  setUseIframe(true);
                  startIframeView();
                }}
                className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-sm rounded mr-2 flex-1"
              >
                使用iframe
              </button>
              <button
                onClick={openInternalBrowser}
                className="px-2 py-1 bg-green-600 hover:bg-green-700 text-sm rounded mr-2 flex-1"
              >
                打开浏览器
              </button>
              <button
                onClick={closeBrowser}
                className="px-2 py-1 bg-red-600 hover:bg-red-700 text-sm rounded flex-1"
              >
                关闭浏览器
              </button>
            </div>

            <div className="bg-black p-2 rounded h-56 overflow-y-auto text-xs font-mono flex-1">
              {debugLogs.map((log, index) => (
                <div key={index} className="text-green-400 pb-1">{log}</div>
              ))}
              {debugLogs.length === 0 && <div className="text-gray-500">暂无日志...</div>}
            </div>
          </div>
        )}
        
        {/* 调试按钮 - 右下角 */}
        <button
          onClick={() => setShowDebug(prev => !prev)}
          className="absolute bottom-2 right-2 bg-gray-800 bg-opacity-60 hover:bg-opacity-80 rounded-full p-2 text-white z-10"
          title="切换调试视图"
        >
          <Bug className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
