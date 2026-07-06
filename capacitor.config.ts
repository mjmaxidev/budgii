import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'app.mjproductions.budgii',
  appName: 'Budgii',
  webDir: 'dist',
  server: {
    // Use https scheme on Android so cookies/localStorage behave like a secure origin.
    androidScheme: 'https',
  },
  ios: {
    // Safe areas handled in CSS (safe-top / safe-bottom) — automatic double-counts bottom inset.
    contentInset: 'never',
  },
}

export default config
