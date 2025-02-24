'use client'

import { WagmiProvider } from 'wagmi'
import { getDefaultConfig, RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { QueryClientProvider, QueryClient } from '@tanstack/react-query'
import { monadTestnet } from '@/lib/customChain'
import { useState, useEffect } from 'react'

const queryClient = new QueryClient()

export default function WagmiProviderWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  const [config, setConfig] = useState<any>(null)

  useEffect(() => {
    setConfig(
      getDefaultConfig({
        appName: process.env.NEXT_PUBLIC_REOWN_APP_NAME!,
        projectId: process.env.NEXT_PUBLIC_REOWN_PROJECT_ID!,
        chains: [monadTestnet],
      }),
    )
  }, [])

  if (!config) return null

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
