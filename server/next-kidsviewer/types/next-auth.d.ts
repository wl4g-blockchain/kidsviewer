import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email?: string | null
      name?: string | null
      image?: string | null
      tenantId: number
      userType: number
      properties?: any
      tenant?: {
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
    userType?: number
    properties?: any
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    tenantId: number
    userType: number
    properties?: any
  }
}
