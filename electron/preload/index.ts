import { contextBridge, ipcRenderer } from 'electron'

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  ping: () => ipcRenderer.invoke('ping'),
  openUrl: (url: string) => ipcRenderer.invoke('open-url', url),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  
  // Video BrowserView APIs
  createVideoView: (params: { url: string; bounds: { x: number; y: number; width: number; height: number } }) => 
    ipcRenderer.invoke('create-video-view', params),
  destroyVideoView: () => ipcRenderer.invoke('destroy-video-view'),
  updateVideoBounds: (bounds: { x: number; y: number; width: number; height: number }) => 
    ipcRenderer.invoke('update-video-bounds', bounds),
  
  // Video event listeners
  onVideoLoadError: (callback: (data: { url: string; error: string }) => void) => {
    ipcRenderer.on('video-load-error', (_, data) => callback(data))
  },
  onVideoLoadSuccess: (callback: (data: { url: string }) => void) => {
    ipcRenderer.on('video-load-success', (_, data) => callback(data))
  },
  
  // Remove listeners
  removeVideoListeners: () => {
    ipcRenderer.removeAllListeners('video-load-error')
    ipcRenderer.removeAllListeners('video-load-success')
  }
})

// Type definitions for the exposed API
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