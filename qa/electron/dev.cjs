/**
 * QA Dev launcher: starts the Vite dev server on port 5173, waits for it to report its URL,
 * then launches Electron with the /qa route. Kills both on exit.
 */
const { spawn } = require('child_process')
const electron = require('electron')

const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm'
let electronProc = null
let started = false

const vite = spawn(npmCmd, ['run', 'dev'], { stdio: ['inherit', 'pipe', 'inherit'] })

function launchElectron(url) {
  if (started) return
  started = true
  console.log(`\n[electron-qa] launching against ${url}\n`)
  const env = { ...process.env, VITE_DEV_SERVER_URL: url }
  delete env.ELECTRON_RUN_AS_NODE
  electronProc = spawn(electron, ['qa/electron/main.cjs'], { stdio: 'inherit', env })
  electronProc.on('close', () => shutdown(0))
}

vite.stdout.on('data', (chunk) => {
  const text = chunk.toString()
  process.stdout.write(text)
  const match = text.match(/Local:\s+(http:\/\/localhost:\d+\/?)/)
  if (match) launchElectron(match[1])
})

function shutdown(code) {
  try {
    vite.kill()
  } catch {}
  try {
    electronProc && electronProc.kill()
  } catch {}
  process.exit(code)
}

process.on('SIGINT', () => shutdown(0))
process.on('SIGTERM', () => shutdown(0))
vite.on('close', (code) => shutdown(code ?? 0))
