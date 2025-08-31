import { contextBridge, ipcRenderer } from 'electron'

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  ping: () => ipcRenderer.invoke('ping'),
  openUrl: (url: string) => ipcRenderer.invoke('open-url', url),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  // Add more API methods as needed
})

// Type definitions for the exposed API
declare global {
  interface Window {
    electronAPI: {
      ping: () => Promise<void>
      openUrl: (url: string) => Promise<{ success: boolean; error?: string }>
      getAppVersion: () => Promise<string>
    }
  }
} 