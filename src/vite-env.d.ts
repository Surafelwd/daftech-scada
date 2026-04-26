/// <reference types="vite/client" />

declare interface ImportMetaEnv {
  readonly VITE_USE_FIREBASE_EMULATORS?: string;
}

declare interface ImportMeta {
  readonly env: ImportMetaEnv;
}
