const { app, BrowserWindow, shell, nativeImage } = require('electron')
const path = require('path')

// Set unique app ID so app and QA versions can run simultaneously
app.setAppUserModelId('app.mjproductions.budgii')

const DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL || (process.env.ELECTRON_DEV ? 'http://localhost:5173' : '')
const isDev = !!DEV_SERVER_URL

/** @type {BrowserWindow | null} */
let mainWindow = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 390,
    height: 844,
    minWidth: 320,
    minHeight: 600,
    backgroundColor: '#efe2d2',
    title: 'Budgii',
    titleBarStyle: 'default',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  if (isDev) {
    mainWindow.loadURL(DEV_SERVER_URL + '#/')
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    const indexPath = path.join(__dirname, '..', 'dist', 'index.html')
    mainWindow.loadURL(`file://${indexPath}#/`)
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
      try {
        const wc = mainWindow.webContents
        const before = await wc.executeJavaScript(`(async () => {
          location.hash = '#/budget-setup'
          await new Promise(r => setTimeout(r, 400))
          const el = Array.from(document.querySelectorAll('input')).find(i => i.placeholder === '1000')
          el && el.focus()
          return JSON.stringify({ found: !!el, activeTag: document.activeElement && document.activeElement.tagName, activeIsTarget: document.activeElement === el })
        })()`)
        console.log('SMOKE_TEST: before = ' + before)
        for (const ch of ['5', '0', '0']) {
          wc.sendInputEvent({ type: 'keyDown', keyCode: ch })
          wc.sendInputEvent({ type: 'char', keyCode: ch })
          wc.sendInputEvent({ type: 'keyUp', keyCode: ch })
        }
        await new Promise((r) => setTimeout(r, 250))
        const after = await wc.executeJavaScript(`(() => {
          const el = Array.from(document.querySelectorAll('input')).find(i => i.placeholder === '1000')
          const persisted = JSON.parse(localStorage.getItem('budgii') || '{}')
          return JSON.stringify({ fieldValue: el ? el.value : null, storeLimit: persisted?.state?.budget?.limit })
        })()`)
        console.log('SMOKE_TEST: after real-typing = ' + after)
      } catch (err) {
        console.error('SMOKE_TEST: eval error ' + err)
      }
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
