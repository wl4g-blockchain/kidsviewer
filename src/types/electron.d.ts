// Electron API type definitions
declare global {
  interface Window {
    electronAPI: {
      ping: () => Promise<void>
      openUrl: (url: string) => Promise<{ success: boolean; error?: string }>
      getAppVersion: () => Promise<string>
      
      // Video BrowserView APIs
      createVideoView: (params: { url: string; bounds: { x: number; y: number; width: number; height: number } }) => 
        Promise<{ success: boolean; error?: string }>
      destroyVideoView: () => Promise<{ success: boolean; error?: string }>
      updateVideoBounds: (bounds: { x: number; y: number; width: number; height: number }) => 
        Promise<{ success: boolean; error?: string }>
      
      // Video event listeners
      onVideoLoadError: (callback: (data: { url: string; error: string }) => void) => void
      onVideoLoadSuccess: (callback: (data: { url: string }) => void) => void
      removeVideoListeners: () => void
    }
  }
}

export {}; 