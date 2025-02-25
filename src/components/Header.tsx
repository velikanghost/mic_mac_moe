'use client'

import { LocalAccount, parseEther } from 'viem'
import { CustomConnectButton } from './CustomConnectButton'
import { Button } from './ui/button'
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from './ui/sheet'
import { Input } from './ui/input'
import { Copy } from 'lucide-react'
import { toast } from 'sonner'
import { useEffect, useState } from 'react'
import { useAccount, useSendTransaction } from 'wagmi'
import { deriveEncryptionKey, decryptData } from '@/lib/helpers'
import { privateKeyToAccount } from 'viem/accounts'

interface HeaderProps {
  signedMessage: string
}

const Header: React.FC<HeaderProps> = ({ signedMessage }) => {
  const { address: connectedAddress } = useAccount()
  const { sendTransactionAsync } = useSendTransaction()
  const [gameWallet, setGameWallet] = useState<LocalAccount>()
  const [depositAmount, setDepositAmount] = useState('0.3') // Default deposit amount

  useEffect(() => {
    const savedWallet = localStorage.getItem(`gameWallet_${connectedAddress}`)

    if (savedWallet) {
      const key = deriveEncryptionKey(signedMessage)

      const decryptedPrivateKey = decryptData(savedWallet, key)
      const account = privateKeyToAccount(decryptedPrivateKey as any)
      setGameWallet(account)
    }
  }, [signedMessage])

  const copyPrivateKey = () => {
    if (gameWallet) {
      navigator.clipboard.writeText(gameWallet.publicKey)
      toast.success('Private key copied to clipboard!')
    }
  }

  // Deposit DMON into the game wallet
  const depositTokens = async () => {
    if (!gameWallet) return

    try {
      const tx = await sendTransactionAsync({
        to: gameWallet?.address,
        value: parseEther(depositAmount),
      })

      //console.log(tx)

      toast.success(
        `Successfully deposited ${depositAmount} DMON to the game wallet!`,
      )
    } catch (error) {
      console.error('Error depositing tokens:', error)
    }
  }

  return (
    <nav className="flex justify-between items-center py-8 md:py-16">
      <h1 className="text-2xl font-bold text-center text-white">MicMacMoe</h1>
      <div className="flex items-center gap-4">
        <Sheet>
          <SheetTrigger asChild>
            <Button>Game Wallet</Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader className="mb-10">
              <SheetTitle className="text-xl font-semibold text-[#9F90F9]">
                Your MicMacMoe Wallet
              </SheetTitle>
              <SheetDescription>
                Here you can deposit DMON into your game wallet to play the
                game, and manage your game wallet.
              </SheetDescription>
            </SheetHeader>
            <div className="text-center">
              <p className="mb-4">
                Address:{' '}
                <span className="font-semibold text-[#9F90F9]">
                  {gameWallet?.address}
                </span>
              </p>
              <Button
                variant="outline"
                onClick={copyPrivateKey}
                className=" mb-4"
              >
                <Copy className="inline-block mr-2" /> Copy Private Key
              </Button>
              <div className="space-y-4 mt-6">
                <h3 className="text-lg text-[#9F90F9]">
                  Deposit DMON into Game Wallet
                </h3>
                <Input
                  type="text"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="max-w-sm mx-auto"
                />
                <Button variant="outline" onClick={depositTokens} className="">
                  Deposit {depositAmount} DMON
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        <CustomConnectButton />
      </div>
    </nav>
  )
}

export default Header
