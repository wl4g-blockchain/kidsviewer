import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email?: string | null
      name?: string | null
      image?: string | null
      tenantId: number
      userType?: string
      tenant?: {
        id: number
        properties?: any
      }
    }
  }

  interface User {
    id: string
    email?: string | null
    name?: string | null
    image?: string | null
    tenantId: string
    userType?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    tenantId: number
    userType?: string
  }
}
