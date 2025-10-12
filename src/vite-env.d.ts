/// <reference types="vite/client" />

// Ethereum provider type definition
interface Window {
  ethereum?: {
    request: (args: { method: string; params?: any[] }) => Promise<any>;
    on: (event: string, callback: (...args: any[]) => void) => void;
    removeListener: (event: string, callback: (...args: any[]) => void) => void;
    isMetaMask?: boolean;
  };
  starknet?: any;
}

interface ImportMetaEnv {
    readonly VITE_GITHUB_CLIENT_ID: string
    readonly VITE_GOOGLE_CLIENT_ID: string
    readonly VITE_WALLETCONNECT_PROJECT_ID: string
    readonly VITE_GOOGLE_CLIENT_SECRET: string
    readonly VITE_GITHUB_CLIENT_SECRET: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
