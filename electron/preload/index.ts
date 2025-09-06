import { contextBridge, ipcRenderer } from 'electron'

console.log('预加载脚本开始执行 [' + new Date().toISOString() + ']');

// 确保脚本执行前等待一下DOM准备就绪
const exposeAPI = () => {
  try {
    console.log('尝试暴露API到渲染进程...');
    
    const api = {
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
      },
      
      // Enhanced video window management - for separate window approach
      openVideoWindow: (params: { url: string; title?: string }) => 
        ipcRenderer.invoke('open-video-window', params),
      closeVideoWindow: (windowId: number) => 
        ipcRenderer.invoke('close-video-window', windowId),
      closeAllVideoWindows: () => 
        ipcRenderer.invoke('close-all-video-windows')
    };

    // 测试IPC通道是否正常工作
    ipcRenderer.invoke('ping').catch(err => {
      console.error('IPC测试失败:', err);
    });

    // 暴露API到window对象
    contextBridge.exposeInMainWorld('electronAPI', api);

    console.log('API已成功暴露到渲染进程:', Object.keys(api));
    
    // 添加一个标记，以便在渲染进程中检查preload是否正确执行
    contextBridge.exposeInMainWorld('__ELECTRON_PRELOAD_EXECUTED__', true);
    
  } catch (error) {
    console.error('暴露API失败:', error);
  }
};

// 立即执行一次
exposeAPI();

// 确保DOM加载完成后API已准备就绪
const waitForDOM = () => {
  try {
    if (typeof document !== 'undefined') {
      document.addEventListener('DOMContentLoaded', () => {
        // 检查API是否已经成功暴露
        const win = window as any;
        if (!win.electronAPI) {
          console.warn('DOMContentLoaded事件触发，但electronAPI不存在，尝试重新暴露');
          exposeAPI();
        } else {
          console.log('DOMContentLoaded事件触发，electronAPI已存在');
        }
      });
    }
  } catch (e) {
    console.error('等待DOM事件错误:', e);
  }
};

// 尝试等待DOM事件
setTimeout(waitForDOM, 0);

// Type definitions for the exposed API
declare global {
  interface Window {
    __ELECTRON_PRELOAD_EXECUTED__: boolean;
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
      
      // Enhanced video window management - for separate window approach
      openVideoWindow: (params: { url: string; title?: string }) => 
        Promise<{ success: boolean; windowId?: number; error?: string }>
      closeVideoWindow: (windowId: number) => 
        Promise<{ success: boolean; error?: string }>
      closeAllVideoWindows: () => 
        Promise<{ success: boolean; error?: string }>
    }
  }
} 