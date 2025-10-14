// NextAuth API handler for Vite/React app
// This calls the real NextJS API endpoints

// Real NextAuth API endpoints
export class NextAuthAPI {
    private baseUrl: string

    constructor(baseUrl: string = '') {
        // In development, use relative path to leverage Vite proxy
        // In production, use the full URL
        if (import.meta.env.DEV) {
            this.baseUrl = baseUrl || ''
        } else {
            this.baseUrl = baseUrl || (import.meta.env.VITE_NEXTAUTH_URL || 'http://localhost:3000')
        }
    }

    async signIn(provider: string, credentials?: any) {
        // For credentials provider, call our custom login API
        if (provider === 'credentials' && credentials) {
            try {
                console.log('SignIn called with credentials:', {
                    email: credentials.email,
                    hasPassword: !!credentials.password,
                    hasEncryptedPassword: !!credentials.encryptedPassword
                });

                // Call our custom login API directly
                const response = await fetch(`${this.baseUrl}/api/auth/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        email: credentials.email,
                        password: credentials.password,
                        encryptedPassword: credentials.encryptedPassword,
                    }),
                })

                if (!response.ok) {
                    const error = await response.json()
                    return { ok: false, error: error.error || 'Sign in failed' }
                }

                const data = await response.json()
                return { ok: true, data }
            } catch (error: any) {
                return { ok: false, error: error.message || 'Sign in failed' }
            }
        }

        // For wallet provider, call NextAuth API
        if (provider === 'wallet' && credentials) {
            try {
                const response = await fetch(`${this.baseUrl}/api/auth/signin/wallet`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        provider,
                        ...credentials,
                    }),
                })

                if (!response.ok) {
                    const error = await response.json()
                    return { ok: false, error: error.message || 'Wallet sign in failed' }
                }

                const data = await response.json()
                return { ok: true, data }
            } catch (error: any) {
                return { ok: false, error: error.message || 'Wallet sign in failed' }
            }
        }

        // For social providers, redirect to OAuth
        if (['github', 'google'].includes(provider)) {
            // Redirect to NextAuth OAuth
            window.location.href = `${this.baseUrl}/api/auth/signin/${provider}`
            return { ok: true }
        }

        return { ok: false, error: 'Unsupported provider' }
    }

    async signOut() {
        try {
            const response = await fetch(`${this.baseUrl}/api/auth/signout`, {
                method: 'POST',
            })
            return { ok: response.ok }
        } catch (error) {
            return { ok: false, error: 'Sign out failed' }
        }
    }

    async getSession() {
        try {
            const response = await fetch(`${this.baseUrl}/api/auth/session`)
            if (!response.ok) {
                return null
            }
            return await response.json()
        } catch (error) {
            console.error('Error fetching session:', error)
            return null
        }
    }

    async getCsrfToken() {
        try {
            const response = await fetch(`${this.baseUrl}/api/auth/csrf`)
            if (!response.ok) {
                return null
            }
            const data = await response.json()
            return data.csrfToken
        } catch (error) {
            console.error('Error fetching CSRF token:', error)
            return null
        }
    }

    async getPublicKey() {
        try {
            const response = await fetch(`${this.baseUrl}/api/auth/public-key`)
            if (!response.ok) {
                throw new Error('Failed to fetch public key')
            }
            const data = await response.json()
            return data.publicKey
        } catch (error) {
            console.error('Failed to fetch public key:', error)
            return null
        }
    }

    async register(userData: any) {
        try {
            const response = await fetch(`${this.baseUrl}/api/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData),
            })

            if (!response.ok) {
                const error = await response.json()
                return { ok: false, error: error.message || 'Registration failed' }
            }

            const data = await response.json()
            return { ok: true, data }
        } catch (error: any) {
            console.error('Registration error:', error)
            return { ok: false, error: error.message || 'Registration failed' }
        }
    }

    async walletLogin(walletData: {
        address: string
        signature: string
        message: string
        chain: string
        chainId: number
    }) {
        try {
            console.log('Wallet login called with:', walletData)
            
            const response = await fetch(`${this.baseUrl}/api/auth/wallet`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(walletData),
            })

            if (!response.ok) {
                const error = await response.json()
                return { ok: false, error: error.error || 'Wallet login failed' }
            }

            const data = await response.json()
            return { ok: true, data }
        } catch (error: any) {
            console.error('Wallet login error:', error)
            return { ok: false, error: error.message || 'Wallet login failed' }
        }
    }
}

// Create singleton instance
export const nextAuthAPI = new NextAuthAPI()