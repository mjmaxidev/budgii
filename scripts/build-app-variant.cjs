#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const variant = process.argv[2] // 'app' or 'qa'
const command = process.argv[3] // 'dist', 'start', etc.

if (!variant || !command) {
  console.error('Usage: node build-app-variant.cjs <app|qa> <dist|start>')
  process.exit(1)
}

// Each variant is a genuinely distinct app: its own bundle id (appId), product
// name, entry point, and — derived from appId/name by the OS — its own userData
// (localStorage) directory. The two can be installed and run side by side.
const VARIANTS = {
  app: { main: 'electron/main-app.cjs', productName: 'Budgii', appId: 'app.mjproductions.budgii' },
  qa: { main: 'electron/main-qa.cjs', productName: 'Budgii QA', appId: 'app.mjproductions.budgii.qa' },
}

const config = VARIANTS[variant]
if (!config) {
  console.error(`Unknown variant "${variant}" — expected "app" or "qa"`)
  process.exit(1)
}

const pkgPath = path.join(__dirname, '..', 'package.json')
const original = fs.readFileSync(pkgPath, 'utf-8') // restore verbatim afterwards
const pkg = JSON.parse(original)

pkg.main = config.main
pkg.build = pkg.build || {}
pkg.build.productName = config.productName
pkg.build.appId = config.appId

fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2))

try {
  if (command === 'dist') {
    execSync('npm run build && electron-builder', { stdio: 'inherit' })
  } else if (command === 'start') {
    execSync('npm run build && electron .', { stdio: 'inherit' })
  } else {
    console.error(`Unknown command "${command}" — expected "dist" or "start"`)
    process.exitCode = 1
  }
} finally {
  // Restore package.json exactly as it was.
  fs.writeFileSync(pkgPath, original)
}
