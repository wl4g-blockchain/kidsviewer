import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GitHubProvider from "next-auth/providers/github"
import GoogleProvider from "next-auth/providers/google"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"
import NodeRSA from "node-rsa"
import { ethers } from "ethers"
import { ec, hash } from "starknet"

// NextAuth.js v4 configuration
const authOptions = {
    secret: process.env.NEXTAUTH_SECRET || 'fallback-secret-key',
    debug: process.env.NODE_ENV === 'development',
    trustHost: true,
    useSecureCookies: process.env.NODE_ENV === 'production',
    // Ensure the base URL is correct for OAuth callbacks
    basePath: '/api/v1/auth',
    cookies: {
        sessionToken: {
            name: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.session-token' : 'next-auth.session-token',
            options: {
                httpOnly: true,
                sameSite: 'lax' as const,
                path: '/',
                secure: process.env.NODE_ENV === 'production',
            },
        },
    },
    events: {
        async signIn(message: any) {
            console.log('Sign in event:', message)
        },
        async signOut(message: any) {
            console.log('Sign out event:', message)
        },
        async createUser(message: any) {
            console.log('Create user event:', message)
        },
        async updateUser(message: any) {
            console.log('Update user event:', message)
        },
        async linkAccount(message: any) {
            console.log('Link account event:', message)
        },
        async session(message: any) {
            console.log('Session event:', message)
        },
    },
    adapter: undefined, // disable adapter, use JWT
    logger: {
        error: (code: string, metadata: any) => {
            console.error('NextAuth Error:', code, metadata)
        },
        warn: (code: string) => {
            console.warn('NextAuth Warning:', code)
        },
        debug: (code: string, metadata: any) => {
            console.log('NextAuth Debug:', code, metadata)
        }
    },
    providers: [
        GitHubProvider({
            clientId: process.env.VITE_GITHUB_CLIENT_ID || '',
            clientSecret: process.env.VITE_GITHUB_CLIENT_SECRET || '',
            authorization: {
                params: {
                    scope: 'read:user user:email',
                },
            },
            profile(profile) {
                return {
                    id: profile.id.toString(),
                    name: profile.name || profile.login,
                    email: profile.email,
                    image: profile.avatar_url,
                    tenantId: '1', // 默认租户ID
                    userType: 1, // 默认用户类型
                }
            },
        }),
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || '',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
            authorization: {
                params: {
                    scope: 'openid email profile',
                },
            },
            profile(profile) {
                return {
                    id: profile.sub,
                    name: profile.name,
                    email: profile.email,
                    image: profile.picture,
                    tenantId: '1', // 默认租户ID
                    userType: 1, // 默认用户类型
                }
            },
        }),
        CredentialsProvider({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
                encryptedPassword: { label: "Encrypted Password", type: "text" },
            },
            async authorize(credentials) {
                console.log('=== NextAuth credentials provider called ===')
                console.log('NextAuth credentials received:', {
                    email: credentials?.email,
                    hasPassword: !!credentials?.password,
                    hasEncryptedPassword: !!credentials?.encryptedPassword,
                    encryptedPasswordLength: credentials?.encryptedPassword?.length
                })
                
                if (!credentials?.email) {
                    console.log('No email provided, returning null')
                    return null
                }

                // If encrypted password is provided, decrypt it first
                let password = credentials.password
                if (credentials.encryptedPassword) {
                    console.log('Attempting to decrypt password...')
                    try {
                        const privateKeyBase64 = process.env.NEXTAUTH_RSA_PRIVATE_KEY
                        if (!privateKeyBase64) {
                            console.error('RSA private key not configured')
                            return null
                        }
                        console.log('RSA private key found, length:', privateKeyBase64.length)
                        // Decode base64 to get the actual PEM format
                        const privateKeyPem = Buffer.from(privateKeyBase64, 'base64').toString('utf8')
                        console.log('Private key PEM decoded, length:', privateKeyPem.length)
                        const key = new NodeRSA(privateKeyPem)
                        password = key.decrypt(credentials.encryptedPassword as string, 'utf8')
                        console.log('Password decrypted successfully, length:', password.length)
                        console.log('Decrypted password preview:', password.substring(0, 10) + '...')
                    } catch (error) {
                        console.error('Password decryption failed:', error)
                        return null
                    }
                } else {
                    console.log('No encrypted password provided, using plain password')
                }

                if (!password) {
                    return null
                }

                // Find user by email
                console.log('Looking for user with email:', credentials.email)
                const user = await prisma.sysUser.findFirst({
                    where: {
                        email: credentials.email,
                        delFlag: 0,
                    },
                })

                if (!user) {
                    console.log('User not found for email:', credentials.email)
                    return null
                }
                
                if (!user.password) {
                    console.log('User found but no password set for email:', credentials.email)
                    return null
                }
                
                console.log('User found:', { id: user.id, email: user.email, name: user.name })

                // Verify password using double SHA512 hash comparison
                // Database stores: sha512(sha512(password))
                // We need to compare: sha512(sha512(inputPassword))
                console.log('Verifying password...')
                const firstHash = crypto.createHash('sha512').update(password as string).digest('hex')
                const hashedPassword = crypto.createHash('sha512').update(firstHash).digest('hex')
                console.log('Password hash comparison:', {
                    inputHash: hashedPassword.substring(0, 20) + '...',
                    storedHash: user.password.substring(0, 20) + '...',
                    match: hashedPassword === user.password
                })
                
                if (hashedPassword !== user.password) {
                    console.log('Password verification failed')
                    return null
                }
                
                console.log('Password verification successful!')

                return {
                    id: user.id.toString(),
                    email: user.email,
                    name: user.name,
                    tenantId: user.tenantId.toString(),
                    userType: user.userType,
                }
            },
        }),
        CredentialsProvider({
            name: "wallet",
            credentials: {
                address: { label: "Wallet Address", type: "text" },
                signature: { label: "Signature", type: "text" },
                message: { label: "Message", type: "text" },
                chain: { label: "Chain", type: "text" },
                chainId: { label: "Chain ID", type: "text" },
            },
            async authorize(credentials) {
                if (!credentials?.address || !credentials?.signature || !credentials?.message || !credentials?.chain || !credentials?.chainId) {
                    return null
                }

                const { address, signature, message, chain, chainId } = credentials

                try {
                    // Verify signature based on chain
                    let isValidSignature = false
                    let recoveredAddress = ''

                    if (chain === 'ethereum') {
                        // Verify Ethereum signature
                        recoveredAddress = ethers.verifyMessage(message, signature)
                        isValidSignature = recoveredAddress.toLowerCase() === address.toLowerCase()
                    } else if (chain === 'starknet') {
                        // Verify Starknet signature using starknet.js
                        try {
                            // Calculate message hash using Pedersen hash
                            const messageHash = hash.computeHashOnElements([message])
                            
                            // Parse signature - Starknet signatures are typically in format [r, s]
                            let signatureArray
                            if (typeof signature === 'string') {
                                // Try to parse as JSON array first, then as comma-separated values
                                try {
                                    signatureArray = JSON.parse(signature)
                                } catch {
                                    signatureArray = signature.split(',').map(s => s.trim())
                                }
                            } else {
                                signatureArray = signature
                            }
                            
                            // Verify signature using starkCurve
                            // Note: verify(signature, msgHash, pubKey) - signature should be in format [r, s]
                            isValidSignature = ec.starkCurve.verify(
                                signatureArray,
                                messageHash,
                                address
                            )
                            recoveredAddress = address
                        } catch (error) {
                            console.error('Starknet signature verification failed:', error)
                            isValidSignature = false
                            recoveredAddress = ''
                        }
                    } else {
                        console.error(`Unsupported chain: ${chain}`)
                        return null
                    }

                    if (!isValidSignature) {
                        console.error('Signature verification failed')
                        return null
                    }

                    // Find user by wallet address
                    const user = await prisma.sysUser.findFirst({
                        where: {
                            delFlag: 0,
                            wallets: {
                                path: ['$'],
                                array_contains: [{
                                    chain: chain,
                                    address: address.toLowerCase(),
                                    chainId: parseInt(chainId)
                                }]
                            }
                        },
                        include: {
                            sys_tenant: true
                        }
                    })

                    if (!user) {
                        console.error('User not found for wallet address:', address)
                        return null
                    }

                    return {
                        id: user.id.toString(),
                        email: user.email,
                        name: user.name,
                        tenantId: user.tenantId.toString(),
                        userType: user.userType,
                    }

                } catch (error) {
                    console.error('Wallet authentication error:', error)
                    return null
                }
            },
        }),
    ],
    session: {
        strategy: "jwt" as const,
    },
    callbacks: {
        async jwt({ token, user, account }: any) {
            if (user) {
                token.tenantId = parseInt(user.tenantId)
                token.userType = user.userType || 1
            }

            // Handle GitHub/Google login - fetch user data from database
            if ((account?.provider === 'github' || account?.provider === 'google') && user?.email) {
                try {
                    const dbUser = await prisma.sysUser.findFirst({
                        where: {
                            email: user.email,
                            delFlag: 0,
                        },
                    })

                    if (dbUser) {
                        token.tenantId = parseInt(dbUser.tenantId.toString())
                        token.userType = dbUser.userType
                    } else {
                        console.log('OAuth user not found in database:', user.email)
                    }
                } catch (error) {
                    console.error('Error fetching OAuth user from database:', error)
                }
            }

            return token
        },
        async session({ session, token }: any) {
            if (token) {
                session.user.id = token.sub!
                    ; (session.user as any).tenantId = token.tenantId as number
                    ; (session.user as any).userType = token.userType as number
                session.user.properties = token.properties as any

                // Ensure tenant information is available in session
                if (token.tenantId) {
                    try {
                        const tenant = await prisma.sysTenant.findUnique({
                            where: { id: token.tenantId as number },
                        })

                        if (tenant) {
                            ; (session.user as any).tenant = {
                                properties: tenant.properties as any
                            }
                        }
                    } catch (error) {
                        console.error('Error fetching tenant information:', error)
                    }
                }
            }
            return session
        },
    },
    pages: {
        signIn: "/login",
        error: "/login",
        signOut: "/login",
    },
}

// Export both the handler and authOptions for v4 compatibility
export default NextAuth(authOptions)
export { authOptions }
