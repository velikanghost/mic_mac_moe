import { NextResponse } from 'next/server'
import { createPublicClient, createWalletClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { monadTestnet } from 'viem/chains'
import { mmmAbi } from '@/lib/MicMacMoe'
import { toast } from 'sonner'

if (!process.env.NEXT_PUBLIC_MONAD_RPC_URL) {
  throw new Error(
    'NEXT_PUBLIC_MONAD_RPC_URL is missing in environment variables.',
  )
}

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_MICMACMOE_CONTRACT_ADDRESS
const aiAddress = process.env.NEXT_PUBLIC_AI_WALLET_ADDRESS
const transport = http(process.env.NEXT_PUBLIC_MONAD_RPC_URL)
const account = privateKeyToAccount(`0x${process.env.AI_PRIVATE_KEY}`)

const publicClient = createPublicClient({
  chain: monadTestnet,
  transport,
})

export async function POST(req: Request) {
  try {
    const { gameId, aiMove } = await req.json()

    if (!gameId || !aiMove) {
      return NextResponse.json(
        { error: 'AI cannot initialize, please restart the game' },
        { status: 400 },
      )
    }

    if (!account || !aiAddress) {
      return NextResponse.json(
        { error: 'AI cannot initialize, please restart the game' },
        { status: 400 },
      )
    }

    const aiWalletClient = createWalletClient({
      account,
      chain: monadTestnet,
      transport,
    })

    const hash = await aiWalletClient.writeContract({
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi: mmmAbi,
      functionName: 'makeMove',
      args: [gameId as `0x${string}`, aiMove, aiAddress as `0x${string}`],
    })

    await publicClient.waitForTransactionReceipt({ hash })

    const receipt = await publicClient.waitForTransactionReceipt({ hash })

    return NextResponse.json({ success: true, txHash: receipt.transactionHash })
  } catch (error) {
    console.log(error)
    let errorMessage = 'Transaction failed'
    const errorMsg = error instanceof Error ? error.message : String(error)
    const match = errorMsg.match(
      /reverted with the following reason:\n(.+)\n\nContract Call/,
    )
    if (match) {
      errorMessage = match[1]
    }

    //return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
