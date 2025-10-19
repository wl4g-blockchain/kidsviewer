/**
 * Environment variable utility that works in both Vite and Next.js environments
 * Provides a unified interface for accessing environment variables
 */

// Type for environment variable access
type EnvAccessor = {
  VITE_WALLETCONNECT_APP_ID?: string
  VITE_GITHUB_CLIENT_ID?: string
  VITE_GITHUB_CLIENT_SECRET?: string
  VITE_GOOGLE_CLIENT_ID?: string
  VITE_GOOGLE_CLIENT_SECRET?: string
  VITE_NEXTAUTH_URL?: string
  VITE_NEXTAUTH_RSA_PRIVATE_KEY?: string
  NODE_ENV?: string
}

/**
 * Get environment variable value, supporting both Vite and Next.js environments
 * @param key - Environment variable key
 * @returns Environment variable value or undefined
 */
export const getEnvVar = (key: keyof EnvAccessor): string | undefined => {
  // Check for Vite environment first (client-side)
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env[key]
  }
  
  // Fallback to process.env for Next.js/Node.js environment
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key]
  }
  
  return undefined
}

/**
 * Get environment variable with fallback value
 * @param key - Environment variable key
 * @param fallback - Fallback value if environment variable is not set
 * @returns Environment variable value or fallback
 */
export const getEnvVarWithFallback = (key: keyof EnvAccessor, fallback: string): string => {
  return getEnvVar(key) || fallback
}

/**
 * Check if we're running in development mode
 * @returns true if in development mode
 */
export const isDevelopment = (): boolean => {
  const nodeEnv = getEnvVar('NODE_ENV')
  return nodeEnv === 'development' || nodeEnv === 'dev'
}

/**
 * Check if we're running in production mode
 * @returns true if in production mode
 */
export const isProduction = (): boolean => {
  const nodeEnv = getEnvVar('NODE_ENV')
  return nodeEnv === 'production' || nodeEnv === 'prod'
}
