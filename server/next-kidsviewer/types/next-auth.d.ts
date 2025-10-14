import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name: string
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
    email: string
    name: string
    tenantId: string
    userType: number
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    tenantId: number
    userType: number
    properties?: any
  }
}
