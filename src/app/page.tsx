'use client'

import { useState } from 'react'
import crypto from 'crypto'
import { NextPage } from 'next'
import {
  LocalAccount,
  PublicClient,
  WalletClient,
  createPublicClient,
  createWalletClient,
  http,
  parseEther,
} from 'viem'
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'
import { useAccount, useSignMessage } from 'wagmi'
import { useSendTransaction } from 'wagmi'
import { monadDevnet } from '@/lib/customChain'
import { FiCopy } from 'react-icons/fi'
import Game from '@/components/Game'

// Function to derive encryption key using SHA-256
const deriveEncryptionKey = (input: string): Buffer => {
  return crypto.createHash('sha256').update(input).digest()
}

// Function to encrypt data using AES-256-CBC
const encryptData = (data: string, key: Buffer): string => {
  const iv = crypto.randomBytes(16) // Generate a random IV
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv)
  const encrypted = Buffer.concat([cipher.update(data), cipher.final()])
  return `${iv.toString('hex')}:${encrypted.toString('hex')}` // Store IV along with the encrypted data
}

// Function to decrypt data using AES-256-CBC
const decryptData = (encryptedData: string, key: Buffer): string => {
  const [ivHex, encryptedHex] = encryptedData.split(':')
  const iv = Buffer.from(ivHex, 'hex')
  const encrypted = Buffer.from(encryptedHex, 'hex')
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv)
  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ])
  return decrypted.toString()
}

const Home: NextPage = () => {
  const { address: connectedAddress, isConnected } = useAccount()

  const [encryptionKey, setEncryptionKey] = useState<Buffer | null>(null)
  const [gameWallet, setGameWallet] = useState<LocalAccount>()
  const [depositAmount, setDepositAmount] = useState('0.1') // Default deposit amount
  const [gameWalletFunded, setGameWalletFunded] = useState<boolean>(false)
  const [currentStep, setCurrentStep] = useState<number>(1) // Tracks the user's current step
  const [gameWalletClient, setGameWalletClient] = useState<WalletClient>()
  const { signMessage } = useSignMessage()
  const [signature, setSignature] = useState<string>('')
  const { sendTransactionAsync } = useSendTransaction()
  const [gamePublicClient, setGamePublicClient] = useState<PublicClient>()

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
          console.log('Signature:', signedMessage)
          // Check if a game wallet already exists
          const savedWallet = localStorage.getItem(
            `gameWallet_${connectedAddress}`,
          )
          if (savedWallet) {
            const key = deriveEncryptionKey(signedMessage)
            setEncryptionKey(key)

            console.log({ key })

            const decryptedPrivateKey = decryptData(savedWallet, key)
            const account = privateKeyToAccount(decryptedPrivateKey as any)
            setGameWallet(account)
            console.log('Restored game wallet:', account.address)

            const client = createWalletClient({
              account: account,
              chain: monadDevnet,
              transport: http(
                'https://rpc-devnet.monadinfra.com/rpc/3fe540e310bbb6ef0b9f16cd23073b0a',
              ),
            })

            console.log({ client })
            const publicClient = createPublicClient({
              chain: monadDevnet,
              transport: http(
                `https://rpc-devnet.monadinfra.com/rpc/3fe540e310bbb6ef0b9f16cd23073b0a`,
              ),
            })

            setGamePublicClient(publicClient)

            setGameWalletClient(client)

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

    console.log('Generated Wallet:', account)
    console.log('Private Key:', privateKey)
    console.log('Address:', account.address)

    setGameWallet(account)

    const key = deriveEncryptionKey(signature)
    setEncryptionKey(key)

    // Encrypt and save the wallet to localStorage
    const encryptedPrivateKey = encryptData(privateKey, key)
    localStorage.setItem(`gameWallet_${connectedAddress}`, encryptedPrivateKey!)
    console.log('Generated and encrypted game wallet:', account.address)

    const client = createWalletClient({
      account,
      chain: monadDevnet,
      transport: http(process.env.NEXT_PUBLIC_MONAD_RPC_URL),
    })

    const publicClient = createPublicClient({
      chain: monadDevnet,
      transport: http(process.env.NEXT_PUBLIC_MONAD_RPC_URL),
    })

    setGamePublicClient(publicClient)
    setGameWalletClient(client)
    setCurrentStep(2)

    return account
  }

  const copyPrivateKey = () => {
    if (gameWallet) {
      navigator.clipboard.writeText(gameWallet.publicKey)
      alert('Private key copied to clipboard!')
    }
  }

  // Deposit DMON into the game wallet
  const depositTokens = async () => {
    //if (!walletAddress || !gameWallet) return;

    try {
      const tx = await sendTransactionAsync({
        to: gameWallet?.address,
        value: parseEther(depositAmount),
      })

      console.log(tx)

      alert(`Successfully deposited ${depositAmount} DMON to the game wallet!`)

      setGameWalletFunded(true)
      setCurrentStep(3)
    } catch (error) {
      console.error('Error depositing tokens:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#632ADB] to-[#9E8CFF] text-white">
      <div className="container px-4 py-12 mx-auto">
        <h1 className="text-5xl font-bold mb-8 text-center text-[#9F90F9]">
          Mic-Mac-Moe
        </h1>
        <div className="max-w-md mx-auto bg-[#200052] rounded-3xl p-8 shadow-lg">
          {currentStep === 1 && isConnected && (
            <div className="text-center">
              {!signature ? (
                <button
                  onClick={handleSignMessage}
                  className="px-4 py-2 text-white bg-blue-500 rounded"
                >
                  Sign Message
                </button>
              ) : (
                <>
                  <h2 className="text-2xl font-semibold mb-4 text-[#9F90F9]">
                    Generate Game Wallet
                  </h2>
                  <p className="mb-4">
                    Connected as:{' '}
                    <span className="font-semibold text-[#9F90F9]">
                      {connectedAddress}
                    </span>
                  </p>
                  <button
                    onClick={generateGameWallet}
                    className="bg-[#9F90F9] text-[#200052]"
                  >
                    Generate Game Wallet
                  </button>
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
              <button
                onClick={copyPrivateKey}
                className="bg-[#9F90F9] text-[#200052] mb-4"
              >
                <FiCopy className="inline-block mr-2" /> Copy Private Key
              </button>
              <div className="space-y-4">
                <h3 className="text-lg text-[#9F90F9]">
                  Deposit DMON into Game Wallet
                </h3>
                <input
                  type="text"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full bg-[#200052] text-white placeholder-gray-300 border-[#9F90F9]"
                />
                <button
                  onClick={depositTokens}
                  className="w-full bg-[#9F90F9] text-[#200052]"
                >
                  Deposit {depositAmount} DMON
                </button>
              </div>
            </div>
          )}

          {currentStep === 3 && gameWalletFunded && (
            <div className="text-center">
              <h2 className="text-2xl font-semibold mb-4 text-[#9F90F9]">
                Game Ready
              </h2>
              {gameWalletClient &&
                connectedAddress &&
                gamePublicClient &&
                gameWallet && (
                  <Game
                    gameWalletClient={gameWalletClient}
                    walletAddress={connectedAddress}
                    gamePublicClient={gamePublicClient}
                    gameWallet={gameWallet}
                  />
                )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Home
