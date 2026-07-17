const { app, BrowserWindow, shell, nativeImage } = require('electron')
const path = require('path')

// Set unique app ID so app and QA versions can run simultaneously
app.setAppUserModelId('app.mjproductions.budgii.qa')

const DEV_SERVER_URL =
  process.env.VITE_DEV_SERVER_URL || (process.env.ELECTRON_DEV ? 'http://localhost:5173' : '')
const isDev = !!DEV_SERVER_URL

/** @type {BrowserWindow | null} */
let mainWindow = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1080,
    height: 1000,
    minWidth: 560,
    minHeight: 720,
    backgroundColor: '#efe2d2',
    title: 'Budgii - QA',
    titleBarStyle: 'default',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, '..', '..', 'electron', 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  if (isDev) {
    mainWindow.loadURL(DEV_SERVER_URL + 'qa/index.html')
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    const qaPath = path.join(__dirname, '..', '..', 'dist', 'qa', 'index.html')
    mainWindow.loadURL(`file://${qaPath}`)
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) {
      shell.openExternal(url)
      return { action: 'deny' }
    }
    return { action: 'allow' }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  if (process.env.SMOKE_TEST) {
    mainWindow.webContents.on('did-finish-load', async () => {
      console.log('SMOKE_TEST: did-finish-load OK')
      app.quit()
    })
    mainWindow.webContents.on('did-fail-load', (_e, code, desc) => {
      console.error(`SMOKE_TEST: did-fail-load ${code} ${desc}`)
      app.exit(1)
    })
  }
}

app.whenReady().then(() => {
  if (process.platform === 'darwin') {
    const iconPath = path.join(__dirname, 'icon.png')
    try {
      const img = nativeImage.createFromPath(iconPath)
      if (!img.isEmpty()) app.dock.setIcon(img)
    } catch {
      /* icon optional */
    }
  }

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
