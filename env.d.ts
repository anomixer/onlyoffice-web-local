/// <reference types="vite/client" />

interface ImportMetaEnv {
  VITE_API_URL: string
  VITE_APP_TITLE: string
  VITE_PORT: number
  // 其他環境變數宣告...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
