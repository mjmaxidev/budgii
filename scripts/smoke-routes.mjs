import http from 'node:http'
import { spawn } from 'node:child_process'
import process from 'node:process'
import puppeteer from 'puppeteer'

const host = '127.0.0.1'
const port = Number(process.env.SMOKE_PORT ?? 4173)
const baseUrl = process.env.SMOKE_BASE_URL ?? `http://${host}:${port}`
const viteBin = process.platform === 'win32' ? 'node_modules/.bin/vite.cmd' : 'node_modules/.bin/vite'

const routes = [
  '/home',
  '/transactions',
  '/reports',
  '/settings',
  '/scan-receipt',
  '/receipt-history',
  '/categories-tags',
  '/family-members',
  '/account-settings',
  '/preferences',
  '/budget-setup',
  '/income-tracking',
  '/recurring-transactions',
  '/spending-alerts',
  '/deal-watchlist',
  '/todays-deal-report',
  '/shopping-list',
  '/notifications',
]

let preview

if (!process.env.SMOKE_BASE_URL) {
  preview = spawn(viteBin, ['preview', '--host', host, '--port', String(port), '--strictPort'], {
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  preview.stdout.on('data', (chunk) => process.stdout.write(chunk))
  preview.stderr.on('data', (chunk) => process.stderr.write(chunk))
}

try {
  await waitForServer(baseUrl)
  await runSmoke()
} finally {
  if (preview) {
    preview.kill('SIGTERM')
  }
}

async function runSmoke() {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  try {
    const page = await browser.newPage()
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 })

    const failures = []
    const consoleErrors = []

    page.on('console', (message) => {
      if (message.type() === 'error') {
        consoleErrors.push(message.text())
      }
    })

    page.on('pageerror', (error) => {
      consoleErrors.push(error.message)
    })

    for (const route of routes) {
      consoleErrors.length = 0
      await page.goto(`${baseUrl}/#${route}`, { waitUntil: 'networkidle0' })
      await page.waitForSelector('#root', { timeout: 10_000 })

      const result = await page.evaluate(() => {
        const root = document.querySelector('#root')
        const text = root?.textContent?.replace(/\s+/g, ' ').trim() ?? ''
        return {
          textLength: text.length,
          bodyText: document.body.textContent?.replace(/\s+/g, ' ').trim().slice(0, 200) ?? '',
        }
      })

      if (result.textLength < 20) {
        failures.push(`${route} rendered too little text: "${result.bodyText}"`)
      }

      if (consoleErrors.length > 0) {
        failures.push(`${route} emitted browser errors: ${consoleErrors.join(' | ')}`)
      }
    }

    if (failures.length > 0) {
      throw new Error(`Route smoke test failed:\n${failures.map((failure) => `- ${failure}`).join('\n')}`)
    }
  } finally {
    await browser.close()
  }
}

async function waitForServer(url) {
  const deadline = Date.now() + 30_000
  while (Date.now() < deadline) {
    if (await canReach(url)) return
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
  throw new Error(`Timed out waiting for ${url}`)
}

function canReach(url) {
  return new Promise((resolve) => {
    const request = http.get(url, (response) => {
      response.resume()
      resolve(response.statusCode >= 200 && response.statusCode < 500)
    })
    request.on('error', () => resolve(false))
    request.setTimeout(1000, () => {
      request.destroy()
      resolve(false)
    })
  })
}
