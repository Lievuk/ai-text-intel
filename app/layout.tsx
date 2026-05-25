import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AI Text Intelligence',
  description: 'Analyze text for sentiment, key themes, writing style, and readability using AI',
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
