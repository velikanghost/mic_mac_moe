'use client'

import { useState } from 'react'
import { NextPage } from 'next'
import { LocalAccount, parseEther } from 'viem'
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'
import { useAccount, useSignMessage } from 'wagmi'
import { useSendTransaction } from 'wagmi'
import Game from '@/components/Game'
import { deriveEncryptionKey, decryptData, encryptData } from '@/lib/helpers'
import { CustomConnectButton } from '@/components/CustomConnectButton'
import Header from '@/components/Header'
import { Button } from '@/components/ui/button'
import { Copy } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

const Home: NextPage = () => {
  const { address: connectedAddress, isConnected } = useAccount()

  const [gameWallet, setGameWallet] = useState<LocalAccount>()
  const [depositAmount, setDepositAmount] = useState('1') // Default deposit amount
  const [gameWalletFunded, setGameWalletFunded] = useState<boolean>(false)
  const [currentStep, setCurrentStep] = useState<number>(1)
  const { signMessage } = useSignMessage()
  const [signature, setSignature] = useState<string>('')
  const { sendTransactionAsync } = useSendTransaction()

  const handleSignMessage = async () => {
    if (!isConnected || !connectedAddress) {
      alert('Please connect your wallet first!')
      return
    }

    const message = `Hello ${connectedAddress}, sign this message to prove ownership!`

    signMessage(
      { message },
      {
        onSuccess: (signedMessage) => {
          // Check if a game wallet already exists
          const savedWallet = localStorage.getItem(
            `gameWallet_${connectedAddress}`,
          )

          if (savedWallet) {
            const key = deriveEncryptionKey(signedMessage)

            const decryptedPrivateKey = decryptData(savedWallet, key)
            const account = privateKeyToAccount(decryptedPrivateKey as any)
            setGameWallet(account)

            console.log('Restored game wallet:', account.address)

            setGameWalletFunded(true) // Mark the wallet as funded
            setCurrentStep(3) // Skip to the game screen if wallet is funded
            setSignature(signedMessage)
          } else {
            setCurrentStep(1) // Proceed to generate a new game wallet
            setSignature(signedMessage)
          }
        },
        onError: (error) => {
          console.error('Signing failed', error)
        },
      },
    )
  }

  const generateGameWallet = async () => {
    // Generate a random private key
    const privateKey = generatePrivateKey()

    // Convert the private key into an account
    const account = privateKeyToAccount(privateKey)

    // console.log('Generated Wallet:', account)
    // console.log('Private Key:', privateKey)
    // console.log('Address:', account.address)

    setGameWallet(account)

    const key = deriveEncryptionKey(signature)

    // Encrypt and save the wallet to localStorage
    const encryptedPrivateKey = encryptData(privateKey, key)
    localStorage.setItem(`gameWallet_${connectedAddress}`, encryptedPrivateKey!)
    console.log('Generated and encrypted game wallet:', account.address)

    setCurrentStep(2)

    return account
  }

  const copyPrivateKey = () => {
    if (gameWallet) {
      navigator.clipboard.writeText(gameWallet.publicKey)
      toast.success('Private key copied to clipboard!')
    }
  }

  // Deposit DMON into the game wallet
  const depositTokens = async () => {
    if (!connectedAddress || !gameWallet) return

    try {
      const tx = await sendTransactionAsync({
        to: gameWallet?.address,
        value: parseEther(depositAmount),
      })

      //console.log(tx)

      toast.success(
        `Successfully deposited ${depositAmount} DMON to the game wallet!`,
      )

      setGameWalletFunded(true)
      setCurrentStep(3)
    } catch (error) {
      console.error('Error depositing tokens:', error)
    }
  }

  //bg-[#200052] rounded-3xl p-8 shadow-lg

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#632ADB] to-[#9E8CFF] text-white">
      <div className="container px-4 py-12 mx-auto">
        <Header />

        {!isConnected ? (
          <div className="text-center">
            <h1 className="text-6xl font-extrabold mb-6 leading-tight">
              Tic Tac Toe on <span className="text-[#52238d]">Monad</span>
            </h1>
            <div className="max-w-[16rem] mx-auto">
              <CustomConnectButton />
            </div>
          </div>
        ) : (
          <div className="max-w-xl mx-auto ">
            {currentStep === 1 && isConnected && (
              <div className="text-center">
                {!signature ? (
                  <>
                    <div className="text-center mt-[15%]">
                      <h1 className="text-6xl font-extrabold mb-6 leading-tight">
                        Tic Tac Toe on{' '}
                        <span className="text-[#9F7AEA]">Monad</span>
                      </h1>
                      <button
                        onClick={handleSignMessage}
                        className="bg-white py-3 px-6 text-[#52238d] rounded-xl hover:shadow-xl font-medium"
                      >
                        Sign Message
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <h2 className="text-2xl font-semibold mb-4 text-[#9F90F9]">
                      Generate Game Wallet
                    </h2>
                    <p>
                      To improve your experience, please generate a game wallet
                      to proceed.
                    </p>
                    <Button
                      variant="default"
                      onClick={generateGameWallet}
                      className="mt-4"
                    >
                      Generate Wallet
                    </Button>
                  </>
                )}
              </div>
            )}

            {currentStep === 2 && gameWallet && (
              <div className="text-center">
                <h2 className="text-2xl font-semibold mb-4 text-[#9F90F9]">
                  Game Wallet Generated
                </h2>
                <p className="mb-4">
                  Game Wallet Address:{' '}
                  <span className="font-semibold text-[#9F90F9]">
                    {gameWallet.address}
                  </span>
                </p>
                <Button onClick={copyPrivateKey} className=" mb-4">
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
                  <Button onClick={depositTokens} className="w-[40%]">
                    Deposit {depositAmount} DMON
                  </Button>
                </div>
              </div>
            )}

            {currentStep === 3 && gameWalletFunded && (
              <div className="text-center">
                {connectedAddress && gameWallet && (
                  <Game
                    connectedAddress={connectedAddress}
                    gameWallet={gameWallet}
                  />
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Home
