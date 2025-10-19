'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function AppPage() {
  useEffect(() => {
    // Redirect to the Vite dev server in development
    if (process.env.NODE_ENV === 'development') {
      window.location.href = 'http://localhost:5173'
    }
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          KidsViewer
        </h1>
        <p className="text-gray-600 mb-8">
          A parental control app that limits children&apos;s screen time and promotes learning through educational challenges
        </p>
        <div className="space-y-4">
          <Link
            href="/api/auth/login"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Login
          </Link>
          <Link
            href="/api/auth/register"
            className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors ml-4"
          >
            Register
          </Link>
        </div>
        <div className="mt-8 text-sm text-gray-500">
          <p>API Endpoints:</p>
          <ul className="mt-2 space-y-1">
            <li><Link href="/api/auth/session" className="text-blue-600 hover:underline">Session</Link></li>
            <li><Link href="/api/auth/public-key" className="text-blue-600 hover:underline">Public Key</Link></li>
            <li><Link href="/api/sys/config" className="text-blue-600 hover:underline">System Config</Link></li>
          </ul>
        </div>
      </div>
    </div>
  )
}
