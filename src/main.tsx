import React from 'react'
import ReactDOM from 'react-dom/client'
import { Capacitor } from '@capacitor/core'
import { RouterProvider } from 'react-router-dom'
import { router } from './app/router'
import { initDeepLinks } from './capacitor/deepLinks'
import { initNativePushNotifications } from './capacitor/push'
import './index.css'

if (Capacitor.isNativePlatform()) {
  initNativePushNotifications()
  initDeepLinks((path) => {
    void router.navigate(path)
  })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
