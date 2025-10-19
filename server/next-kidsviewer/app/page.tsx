import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export default async function HomePage() {
  // Check if user is authenticated
  const session = await getServerSession(authOptions)
  
  if (session) {
    // User is authenticated, redirect to app
    redirect('/app')
  } else {
    // User is not authenticated, redirect to login
    redirect('/login')
  }
}
