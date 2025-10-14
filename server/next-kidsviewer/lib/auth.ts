import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GitHubProvider from "next-auth/providers/github"
import GoogleProvider from "next-auth/providers/google"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"
import NodeRSA from "node-rsa"

export const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
        GitHubProvider({
            clientId: process.env.GITHUB_CLIENT_ID!,
            clientSecret: process.env.GITHUB_CLIENT_SECRET!,
        }),
        CredentialsProvider({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
                encryptedPassword: { label: "Encrypted Password", type: "text" },
            },
            async authorize(credentials) {
                if (!credentials?.email) {
                    return null
                }

                // If encrypted password is provided, decrypt it first
                let password = credentials.password
                if (credentials.encryptedPassword) {
                    try {
                        const privateKeyBase64 = process.env.RSA_PRIVATE_KEY!
                        // Decode base64 to get the actual PEM format
                        const privateKeyPem = Buffer.from(privateKeyBase64, 'base64').toString('utf8')
                        const key = new NodeRSA(privateKeyPem)
                        password = key.decrypt(credentials.encryptedPassword, 'utf8')
                    } catch (error) {
                        console.error('Password decryption failed:', error)
                        return null
                    }
                }

                if (!password) {
                    return null
                }

                // Find user by email
                const user = await prisma.sysUser.findFirst({
                    where: {
                        email: credentials.email,
                        delFlag: 0,
                    },
                })

                if (!user || !user.password) {
                    return null
                }

                // Verify password using SHA256 hash comparison
                const hashedPassword = crypto.createHash('sha256').update(password).digest('hex')
                if (hashedPassword !== user.password) {
                    return null
                }

                return {
                    id: user.id.toString(),
                    email: user.email || '',
                    name: user.name || '',
                    tenantId: user.tenantId.toString(),
                    userType: user.userType,
                }
            },
        }),
    ],
    session: {
        strategy: "jwt",
    },
    callbacks: {
        async jwt({ token, user, account }) {
            if (user) {
                token.tenantId = parseInt(user.tenantId)
                token.userType = user.userType
            }

            // Handle Google/GitHub login - fetch user data from database
            if ((account?.provider === 'google' || account?.provider === 'github') && user?.email) {
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
        async session({ session, token }) {
            if (token) {
                session.user.id = token.sub!
                session.user.tenantId = token.tenantId as number
                session.user.userType = token.userType as number
                session.user.properties = token.properties as any
                
                // Ensure tenant information is available in session
                if (token.tenantId) {
                    try {
                        const tenant = await prisma.sysTenant.findUnique({
                            where: { id: token.tenantId as number },
                        })
                        
                        if (tenant) {
                            session.user.tenant = {
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
    },
}