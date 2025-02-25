import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import '@rainbow-me/rainbowkit/styles.css'
import './globals.css'
import WagmiProviderWrapper from '@/app/WagmiProviderWrapper'
import { Toaster } from '@/components/ui/sonner'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'MicMacMoe',
  description: 'Tic Tac Toe on Monad',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <WagmiProviderWrapper>{children}</WagmiProviderWrapper>
        <Toaster position="top-center" />
      </body>
    </html>
  )
}
