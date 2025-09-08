export const isIOS = (): boolean => {
  const userAgent = navigator.userAgent.toLowerCase();
  return (
    /iphone|ipad|ipod/.test(userAgent) || (/mac/.test(userAgent) && navigator.maxTouchPoints > 1) // iPad Pro new version uses Mac UA
  );
};

export const isIPad = (): boolean => {
  const userAgent = navigator.userAgent.toLowerCase();
  return /ipad/.test(userAgent) || (/mac/.test(userAgent) && navigator.maxTouchPoints > 1); // iPad Pro new version uses Mac UA
};

export const isElectron = (): boolean => {
  const win = window as any;
  return (
    (window.navigator && window.navigator.userAgent && window.navigator.userAgent.indexOf('Electron') >= 0) ||
    (typeof window !== 'undefined' && window.electronAPI !== undefined) ||
    (typeof window !== 'undefined' && win.process && win.process.type === 'renderer')
  );
};

export const isWebBrowser = (): boolean => {
  return !isElectron() && !isIOS();
};

export const getPlatformName = (): string => {
  if (isElectron()) return 'electron';
  if (isIOS()) return isIPad() ? 'ipad' : 'ios';
  return 'web';
};

export const supportsEmbeddedView = (): boolean => {
  return isElectron(); // Currently only Electron supports embedded view
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
