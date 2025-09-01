import { app, BrowserWindow, BrowserView, ipcMain, shell } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'

let mainWindow: BrowserWindow | null = null
let videoView: BrowserView | null = null

// Create main window
function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      webSecurity: false, // Allow loading external content
      nodeIntegration: false,
      contextIsolation: true
    },
    titleBarStyle: 'hiddenInset',
    vibrancy: 'under-window',
    visualEffectState: 'active'
  })

  // Show window when ready
  mainWindow.on('ready-to-show', () => {
    mainWindow!.show()
  })

  // Load app
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../dist/index.html'))
  }

  // Open external links in default browser
  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // Handle window close
  mainWindow.on('closed', () => {
    mainWindow = null
    if (videoView) {
      videoView.webContents.close()
      videoView = null
    }
  })

  // Test IPC handler
  ipcMain.handle('ping', () => console.log('pong'))
}

// Create video BrowserView for embedded content
function createVideoView(url: string, bounds: { x: number; y: number; width: number; height: number }) {
  if (!mainWindow) return null

  // Destroy existing view if any
  if (videoView) {
    mainWindow.removeBrowserView(videoView)
    videoView.webContents.close()
  }

  videoView = new BrowserView({
    webPreferences: {
      webSecurity: false,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      allowRunningInsecureContent: true
    }
  })

  mainWindow.addBrowserView(videoView)
  videoView.setBounds(bounds)
  videoView.setAutoResize({ width: true, height: true })

  // Load the video URL
  videoView.webContents.loadURL(url)

  // Handle navigation events
  videoView.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error(`Failed to load ${validatedURL}: ${errorDescription} (${errorCode})`)
    mainWindow?.webContents.send('video-load-error', { url: validatedURL, error: errorDescription })
  })

  videoView.webContents.on('did-finish-load', () => {
    console.log('Video content loaded successfully')
    mainWindow?.webContents.send('video-load-success', { url })
  })

  // Prevent new window creation
  videoView.webContents.setWindowOpenHandler(() => {
    return { action: 'deny' }
  })

  return videoView
}

// App event handlers
app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.kidsviewer.app')
  
  // Development mode setup
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    console.log('Running in development mode')
  }

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// IPC handlers for video functionality
ipcMain.handle('create-video-view', async (_, { url, bounds }) => {
  try {
    const view = createVideoView(url, bounds)
    return { success: !!view }
  } catch (error) {
    console.error('Error creating video view:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
})

ipcMain.handle('destroy-video-view', async () => {
  try {
    if (videoView && mainWindow) {
      mainWindow.removeBrowserView(videoView)
      videoView.webContents.close()
      videoView = null
    }
    return { success: true }
  } catch (error) {
    console.error('Error destroying video view:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
})

ipcMain.handle('update-video-bounds', async (_, bounds) => {
  try {
    if (videoView) {
      videoView.setBounds(bounds)
    }
    return { success: true }
  } catch (error) {
    console.error('Error updating video bounds:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
})

// IPC handlers for app functionality
ipcMain.handle('open-url', async (_, url: string) => {
  try {
    const win = new BrowserWindow({
      width: 1000,
      height: 800,
      webPreferences: {
        webSecurity: false,
        nodeIntegration: false,
        contextIsolation: true
      }
    })
    win.loadURL(url)
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
})

ipcMain.handle('get-app-version', () => {
  return app.getVersion()
}) 