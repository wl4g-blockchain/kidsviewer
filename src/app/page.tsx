import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export default async function HomePage() {
    // Check if user is logged in
    const session = await getServerSession(authOptions)
    
    if (!session) {
        // Redirect to login page if not authenticated
        redirect('/login')
    }
    
    // Redirect to parental page if authenticated (will be handled by App.tsx routing)
    redirect('/parental-page')
}