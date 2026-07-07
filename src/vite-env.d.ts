/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_ENABLED?: string
  readonly VITE_API_BASE_URL?: string
  readonly VITE_SHOW_DEMO_TOOLS?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
