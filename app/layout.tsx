import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Visibl - AI-Native Engineering Design Notebook',
  description: 'Multi-agent reasoning with persistent memory',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

