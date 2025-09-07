/**
 * 平台检测工具
 */

/**
 * 检测当前是否运行在iOS环境中
 */
export const isIOS = (): boolean => {
  const userAgent = navigator.userAgent.toLowerCase();
  return (
    /iphone|ipad|ipod/.test(userAgent) || 
    (/mac/.test(userAgent) && navigator.maxTouchPoints > 1) // iPad Pro新版使用Mac UA
  );
};

/**
 * 检测当前是否运行在iPad环境中
 */
export const isIPad = (): boolean => {
  const userAgent = navigator.userAgent.toLowerCase();
  return /ipad/.test(userAgent) || 
         (/mac/.test(userAgent) && navigator.maxTouchPoints > 1); // iPad Pro新版使用Mac UA
};

/**
 * 检测当前是否运行在电子环境中
 */
export const isElectron = (): boolean => {
  const win = window as any;
  return (
    (window.navigator && window.navigator.userAgent && window.navigator.userAgent.indexOf('Electron') >= 0) ||
    (typeof window !== 'undefined' && window.electronAPI !== undefined) ||
    (typeof window !== 'undefined' && win.process && win.process.type === 'renderer')
  );
};

/**
 * 检测当前是否运行在网页环境中(非Electron,非iOS)
 */
export const isWebBrowser = (): boolean => {
  return !isElectron() && !isIOS();
};

/**
 * 获取当前平台名称
 */
export const getPlatformName = (): string => {
  if (isElectron()) return 'electron';
  if (isIOS()) return isIPad() ? 'ipad' : 'ios';
  return 'web';
};

/**
 * 检测是否支持嵌入式视图
 */
export const supportsEmbeddedView = (): boolean => {
  return isElectron(); // 目前只有Electron支持嵌入式视图
}; 

// Platform detection utilities

/**
 * Check if the current platform is iOS
 * @returns {boolean} True if running on iOS platform
 */
export const isPlatformIOS = (): boolean => {
  // Check if running in Capacitor iOS environment
  if (typeof (window as any).Capacitor !== 'undefined') {
    return (window as any).Capacitor.getPlatform() === 'ios';
  }
  
  // Fallback to user agent check for web
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
};

/**
 * Check if the current platform is Electron
 * @returns {boolean} True if running in Electron environment
 */
export const isPlatformElectron = (): boolean => {
  return typeof (window as any).electron !== 'undefined';
};

/**
 * Check if the current platform is Web
 * @returns {boolean} True if running in web browser
 */
export const isPlatformWeb = (): boolean => {
  return !isPlatformIOS() && !isPlatformElectron();
}; 