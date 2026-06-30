/**
 * App Dev launcher: starts the Vite dev server on port 5174, waits for it to report its URL,
 * then launches Electron with just the app (no /qa route). Kills both on exit.
 */
const { spawn } = require('child_process')
const electron = require('electron')

const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm'
let electronProc = null
let started = false

// Start Vite on port 5174
const vite = spawn(npmCmd, ['exec', 'vite', '--', '--port', '5174'], { stdio: ['inherit', 'pipe', 'inherit'] })

function launchElectron(url) {
  if (started) return
  started = true
  console.log(`\n[electron-app] launching against ${url}\n`)
  const env = { ...process.env, VITE_DEV_SERVER_URL: url }
  delete env.ELECTRON_RUN_AS_NODE
  electronProc = spawn(electron, ['electron/main-app.cjs'], { stdio: 'inherit', env })
  electronProc.on('close', () => shutdown(0))
}

vite.stdout.on('data', (chunk) => {
  const text = chunk.toString()
  process.stdout.write(text)
  const match = text.match(/Local:\s+(http:\/\/localhost:5174\/?)/)
  if (match) launchElectron(match[1])
})

function shutdown(code) {
  try { vite.kill() } catch {}
  try { electronProc && electronProc.kill() } catch {}
  process.exit(code)
}

process.on('SIGINT', () => shutdown(0))
process.on('SIGTERM', () => shutdown(0))
vite.on('close', (code) => shutdown(code ?? 0))
