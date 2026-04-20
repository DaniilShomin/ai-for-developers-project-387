/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BACKEND_URL: string
  readonly VITE_BACKEND_HOST: string
  readonly VITE_FRONTEND_PORT: string
  readonly VITE_ENABLE_MSW: string
  readonly DEV: boolean
  readonly PROD: boolean
  readonly MODE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
