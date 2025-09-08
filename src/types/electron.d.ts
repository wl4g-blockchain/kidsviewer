export interface ElectronAPI {
  ping: () => Promise<void>;
  openUrl: (url: string) => Promise<{ success: boolean; error?: string }>;
  getAppVersion: () => Promise<string>;

  // Video BrowserView APIs
  createVideoView: (params: {
    url: string;
    bounds: { x: number; y: number; width: number; height: number };
  }) => Promise<{ success: boolean; error?: string }>;
  destroyVideoView: () => Promise<{ success: boolean; error?: string }>;
  updateVideoBounds: (bounds: { x: number; y: number; width: number; height: number }) => Promise<{ success: boolean; error?: string }>;

  // Video event listeners
  onVideoLoadError: (callback: (data: { url: string; error: string }) => void) => void;
  onVideoLoadSuccess: (callback: (data: { url: string }) => void) => void;
  removeVideoListeners: () => void;

  // Enhanced video window management - for separate window approach
  openVideoWindow: (params: { url: string; title?: string }) => Promise<{ success: boolean; windowId?: number; error?: string }>;
  closeVideoWindow: (windowId: number) => Promise<{ success: boolean; error?: string }>;
  closeAllVideoWindows: () => Promise<{ success: boolean; error?: string }>;

  // Video visibility control for questions
  hideVideoView: () => Promise<{ success: boolean; error?: string }>;
  showVideoView: () => Promise<{ success: boolean; error?: string }>;
  minimizeVideoWindow: (windowId: number) => Promise<{ success: boolean; error?: string }>;
  restoreVideoWindow: (windowId: number) => Promise<{ success: boolean; error?: string }>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
