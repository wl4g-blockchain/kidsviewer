import { app, BrowserWindow, ipcMain, shell } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'

// Create main window
function createWindow(): void {
  const mainWindow = new BrowserWindow({
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
    mainWindow.show()
  })

  // Load app
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // Open external links in default browser
  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // Test IPC handler
  ipcMain.handle('ping', () => console.log('pong'))
}

// App event handlers
app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.kidsviewer.app')
  
  // Default open DevTools in development
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    import('electron-devtools-installer')
      .then(({ default: installExtension, REACT_DEVELOPER_TOOLS }) => {
        installExtension(REACT_DEVELOPER_TOOLS)
          .then((name) => console.log(`Added Extension: ${name}`))
          .catch((err) => console.log('An error occurred: ', err))
      })
      .catch((err) => console.log('An error occurred: ', err))
  }

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
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
    return { success: false, error: error.message }
  }
})

ipcMain.handle('get-app-version', () => {
  return app.getVersion()
}) 