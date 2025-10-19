import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'KidsViewer API',
  description: 'KidsViewer Backend API Server',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  )
}
