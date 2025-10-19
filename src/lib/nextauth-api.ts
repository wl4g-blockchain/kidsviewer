// NextAuth API handler for Vite/React app
// This calls the real NextJS API endpoints

// Real NextAuth API endpoints
export class NextAuthAPI {
    private baseUrl: string

    constructor() {
        // Always use relative path - Vite proxy handles routing to backend
        this.baseUrl = ''
    }

    async signIn(provider: string, credentials?: any) {
        // For credentials provider, use custom login API
        if (provider === 'credentials' && credentials) {
            try {
                console.log('SignIn called with credentials:', {
                    email: credentials.email,
                    hasPassword: !!credentials.password,
                    hasEncryptedPassword: !!credentials.encryptedPassword
                });

                // Use custom login API directly
                const response = await fetch(`${this.baseUrl}/api/v1/auth/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        email: credentials.email,
                        encryptedPassword: credentials.encryptedPassword || '',
                    }),
                })

                if (!response.ok) {
                    const error = await response.json()
                    return { ok: false, error: error.error || 'Sign in failed' }
                }

                const data = await response.json()
                
                if (data.success) {
                    console.log('Login successful, user:', data.user)
                    return { ok: true, data: data.user }
                } else {
                    return { ok: false, error: data.error || 'Login failed' }
                }
            } catch (error: any) {
                console.error('Login error:', error)
                return { ok: false, error: error.message || 'Sign in failed' }
            }
        }

        // For wallet provider, call NextAuth API
        if (provider === 'wallet' && credentials) {
            try {
                const response = await fetch(`${this.baseUrl}/api/v1/auth/signin/wallet`, {
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
            window.location.href = `${this.baseUrl}/api/v1/auth/signin/${provider}`
            return { ok: true }
        }

        return { ok: false, error: 'Unsupported provider' }
    }

    async signOut() {
        try {
            // First, get CSRF token for NextAuth signout
            const csrfToken = await this.getCsrfToken()
            
            const response = await fetch(`${this.baseUrl}/api/v1/auth/signout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: csrfToken ? `csrfToken=${encodeURIComponent(csrfToken)}` : '',
                redirect: 'manual' // Prevent automatic redirect
            })
            
            // Handle redirect manually
            if (response.type === 'opaqueredirect' || response.status === 302) {
                // NextAuth tried to redirect, but we'll handle it manually
                console.log('NextAuth signout completed, handling redirect manually')
                return { ok: true }
            }
            
            return { ok: response.ok }
        } catch (error) {
            return { ok: false, error: 'Sign out failed' }
        }
    }

    async getSession() {
        try {
            // First try to get NextAuth session
            const response = await fetch(`${this.baseUrl}/api/v1/auth/session`)
            if (response.ok) {
                const sessionData = await response.json()
                // Check if session has user data (not just empty object)
                if (sessionData && sessionData.user && sessionData.user.id) {
                    return sessionData
                }
            }


            return null
        } catch (error) {
            console.error('Error fetching session:', error)
            return null
        }
    }

    async getCsrfToken() {
        try {
            const response = await fetch(`${this.baseUrl}/api/v1/auth/csrf`)
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
            const response = await fetch(`${this.baseUrl}/api/v1/auth/public-key`)
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
            const response = await fetch(`${this.baseUrl}/api/v1/auth/register`, {
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
        chainName: string
        chainId: number
    }) {
        try {
            console.log('Wallet login called with:', walletData)
            
            // First, verify wallet signature and get user data
            const response = await fetch(`${this.baseUrl}/api/v1/auth/wallet`, {
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

            const walletResult = await response.json()
            
            if (!walletResult.success || !walletResult.user) {
                return { ok: false, error: 'Wallet verification failed' }
            }

            // Wallet verification successful, return user data
            // Session will be created by the wallet API itself
            return { ok: true, data: walletResult.user }
        } catch (error: any) {
            console.error('Wallet login error:', error)
            return { ok: false, error: error.message || 'Wallet login failed' }
        }
    }
}

// Create singleton instance
export const nextAuthAPI = new NextAuthAPI()