const { contextBridge } = require('electron')

// Minimal, safe bridge. The app is fully client-side (localStorage persistence),
// so nothing privileged is exposed yet. Extend here if native features are added
// (e.g. real receipt-file dialogs, notifications for the daily deal check).
contextBridge.exposeInMainWorld('budgetApp', {
  platform: process.platform,
  isElectron: true,
})
