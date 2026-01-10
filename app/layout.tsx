import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Visibl — AI-Native Engineering Design Console',
  description: 'Multi-agent reasoning with persistent memory for engineering design artifacts',
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

