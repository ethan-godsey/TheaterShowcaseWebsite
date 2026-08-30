/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

/**
 * vite/client declares lowercase image extensions only, and several assets in
 * this repo are .JPG / .JPEG. These shims go away once images move to S3 and
 * are referenced by URL instead of imported.
 */
declare module '*.JPG' {
  const src: string
  export default src
}
declare module '*.JPEG' {
  const src: string
  export default src
}
