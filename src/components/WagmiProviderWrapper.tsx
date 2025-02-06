'use client'

import { WagmiProvider } from 'wagmi'
import { getDefaultConfig, RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { QueryClientProvider, QueryClient } from '@tanstack/react-query'
import { monadDevnet } from '@/lib/customChain'

const queryClient = new QueryClient()

const config = getDefaultConfig({
  appName: process.env.NEXT_PUBLIC_REOWN_APP_NAME!,
  projectId: process.env.NEXT_PUBLIC_REOWN_PROJECT_ID!,
  chains: [monadDevnet],
})

export default function WagmiProviderWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
