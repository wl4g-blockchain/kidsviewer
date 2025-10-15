// Global API interceptor for handling authentication errors
import { nextAuthAPI } from '@/lib/nextauth-api'

// Store original fetch function
const originalFetch = window.fetch

// Flag to prevent multiple simultaneous auth error handling
let isHandlingAuthError = false

// Flag to track if user is authenticated
let isAuthenticated = false

// Function to update authentication status
export function updateAuthStatus(authenticated: boolean) {
    isAuthenticated = authenticated
    console.log('Auth status updated:', authenticated)
}

// Custom fetch wrapper that intercepts 401 responses
export function setupAPIInterceptor() {
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        try {
            const url = typeof input === 'string' ? input : input.toString()

      // Skip authentication check for auth-related endpoints
      const isAuthEndpoint = url.includes('/api/auth/signout') || 
                            url.includes('/api/auth/session') || 
                            url.includes('/api/auth/csrf') ||
                            url.includes('/api/auth/public-key') ||
                            url.includes('/api/auth/login') ||
                            url.includes('/api/auth/register') ||
                            url.includes('/api/auth/signin') ||
                            url.includes('/api/auth/wallet')

            // If user is not authenticated and trying to access protected endpoints, block the request
            if (!isAuthenticated && !isAuthEndpoint && url.includes('/api/')) {
                console.log('Blocking API request for unauthenticated user:', url)

                // Return a mock 401 response to trigger auth flow
                return new Response(JSON.stringify({ error: 'Authentication required' }), {
                    status: 401,
                    statusText: 'Unauthorized',
                    headers: { 'Content-Type': 'application/json' }
                })
            }

            const response = await originalFetch(input, init)

            // Check if response is 401 Unauthorized
            if (response.status === 401) {
                // Avoid infinite loop by not intercepting auth-related calls
                if (isAuthEndpoint) {
                    return response
                }

                // Prevent multiple simultaneous auth error handling
                if (isHandlingAuthError) {
                    console.log('Auth error handling already in progress, skipping')
                    return response
                }

                console.log('API request returned 401, handling authentication error:', url)
                isHandlingAuthError = true

                // Update auth status
                updateAuthStatus(false)

                // Dispatch custom event to notify auth provider
                const authErrorEvent = new CustomEvent('auth-error', {
                    detail: {
                        status: 401,
                        url: url,
                        response
                    }
                })
                window.dispatchEvent(authErrorEvent)

                // Clear any existing session data
                try {
                    await nextAuthAPI.signOut()
                } catch (error) {
                    console.error('Error during automatic signout:', error)
                }

                // Redirect to login page if not already there
                if (!window.location.pathname.includes('/auth')) {
                    console.log('Redirecting to login page due to 401 error')
                    window.location.href = '/auth'
                }

                // Reset flag after a short delay
                setTimeout(() => {
                    isHandlingAuthError = false
                }, 1000)
            }

            return response
        } catch (error) {
            console.error('Fetch error:', error)
            throw error
        }
    }
}

// Function to restore original fetch (useful for testing)
export function restoreOriginalFetch() {
    window.fetch = originalFetch
}
