import { Core } from '@walletconnect/core'
import { WalletKit } from '@reown/walletkit'

const core = new Core({
  projectId: process.env.NEXT_PUBLIC_REOWN_PROJECT_ID, // Replace with your WalletConnect project ID
})

export const walletKit = await WalletKit.init({
  core,
  metadata: {
    name: 'Mic-Mac-Moe',
    description: 'A decentralized Mic-Mac-Moe game',
    url: 'http://localhost:3000',
    icons: [],
  },
})
