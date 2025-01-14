'use client'

import { useState } from 'react'
import { ethers, Wallet } from 'ethers'
import crypto from 'crypto'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { FiCopy } from 'react-icons/fi'
import Game from '@/components/Game'

export default function Home() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [gameWallet, setGameWallet] = useState<any>(null)
  const [gameWalletFunded, setGameWalletFunded] = useState<boolean>(false)
  const [signingMessage, setSigningMessage] = useState<boolean>(false)
  const [depositAmount, setDepositAmount] = useState<string>('1') // Default deposit of 1 DMON
  const [currentStep, setCurrentStep] = useState<number>(1) // Tracks the user's current step
  const [encryptionKey, setEncryptionKey] = useState<Buffer | null>(null)
  const [gameWalletSigner, setGameWalletSigner] = useState<Wallet>()

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

  // Function to connect MetaMask and derive encryption key
  const connectWallet = async () => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const address = await signer.getAddress()

      // Ask the user to sign a message
      setSigningMessage(true)
      const signedMessage = await signer.signMessage(
        'Sign this message to secure your game wallet.',
      )
      setSigningMessage(false)

      setWalletAddress(address)

      // Derive encryption key from the signed message
      const key = deriveEncryptionKey(signedMessage)
      setEncryptionKey(key)

      // Check if a game wallet already exists
      const savedWallet = localStorage.getItem(`gameWallet_${address}`)
      if (savedWallet) {
        const decryptedPrivateKey = decryptData(savedWallet, key)
        const restoredWallet = new ethers.Wallet(decryptedPrivateKey)
        setGameWallet(restoredWallet)
        console.log('Restored game wallet:', restoredWallet.address)

        const provider = new ethers.JsonRpcProvider(
          process.env.NEXT_PUBLIC_MONAD_RPC_URL,
        )

        const signerr = restoredWallet.connect(provider)
        setGameWalletSigner(signerr)

        setGameWalletFunded(true) // Mark the wallet as funded
        setCurrentStep(4) // Skip to the game screen if wallet is funded
      } else {
        setCurrentStep(2) // Proceed to generate a new game wallet
      }
    } catch (error) {
      console.error('Error connecting wallet:', error)
      setSigningMessage(false)
    }
  }

  // Generate a new game wallet and encrypt it
  const generateGameWallet = () => {
    if (!walletAddress || !encryptionKey) return

    const tempWallet = ethers.Wallet.createRandom()
    setGameWallet(tempWallet)

    // Encrypt and save the wallet to localStorage
    const encryptedPrivateKey = encryptData(
      tempWallet.privateKey,
      encryptionKey,
    )
    localStorage.setItem(`gameWallet_${walletAddress}`, encryptedPrivateKey)
    console.log('Generated and encrypted game wallet:', tempWallet.address)

    const provider = new ethers.JsonRpcProvider(
      process.env.NEXT_PUBLIC_MONAD_RPC_URL,
    )

    const signerr = tempWallet.connect(provider)
    setGameWalletSigner(signerr as any)
    setCurrentStep(3) // Proceed to deposit step
  }

  // Copy the private key of the game wallet
  const copyPrivateKey = () => {
    if (gameWallet) {
      navigator.clipboard.writeText(gameWallet.privateKey)
      alert('Private key copied to clipboard!')
    }
  }

  // Deposit DMON into the game wallet
  const depositTokens = async () => {
    if (!walletAddress || !gameWallet) return

    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()

      const tx = await signer.sendTransaction({
        to: gameWallet.address,
        value: ethers.parseEther(depositAmount),
      })

      await tx.wait()

      alert(`Successfully deposited ${depositAmount} DMON to the game wallet!`)

      setGameWalletFunded(true)
      setCurrentStep(4)
    } catch (error) {
      console.error('Error depositing tokens:', error)
    }
  }

  // Disconnect the wallet and clear game wallet data
  const disconnectWallet = () => {
    if (walletAddress) {
      localStorage.removeItem(`gameWallet_${walletAddress}`) // Remove wallet from localStorage
    }
    setWalletAddress(null)
    setGameWallet(null)
    setGameWalletFunded(false)
    setEncryptionKey(null)
    setCurrentStep(1) // Reset to the initial step
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#632ADB] to-[#9E8CFF] text-white">
      <div className="container mx-auto py-12 px-4">
        <h1 className="text-5xl font-bold mb-8 text-center text-[#9F90F9]">
          Mic-Mac-Moe
        </h1>
        <div className="max-w-md mx-auto bg-[#200052] rounded-3xl p-8 shadow-lg">
          {currentStep === 1 && (
            <div className="text-center">
              <h2 className="text-2xl font-semibold mb-4 text-[#9F90F9]">
                Connect Wallet
              </h2>
              <Button
                onClick={connectWallet}
                className="bg-[#9F90F9] text-[#200052]"
                disabled={signingMessage}
              >
                {signingMessage ? 'Signing Message...' : 'Connect Wallet'}
              </Button>
            </div>
          )}

          {currentStep === 2 && walletAddress && (
            <div className="text-center">
              <h2 className="text-2xl font-semibold mb-4 text-[#9F90F9]">
                Generate Game Wallet
              </h2>
              <p className="mb-4">
                Connected as:{' '}
                <span className="font-semibold text-[#9F90F9]">
                  {walletAddress}
                </span>
              </p>
              <Button
                onClick={generateGameWallet}
                className="bg-[#9F90F9] text-[#200052]"
              >
                Generate Game Wallet
              </Button>
            </div>
          )}

          {currentStep === 3 && gameWallet && (
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
              <Button
                onClick={copyPrivateKey}
                className="bg-[#9F90F9] text-[#200052] mb-4"
              >
                <FiCopy className="inline-block mr-2" /> Copy Private Key
              </Button>
              <div className="space-y-4">
                <h3 className="text-lg text-[#9F90F9]">
                  Deposit DMON into Game Wallet
                </h3>
                <Input
                  type="text"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full bg-[#200052] text-white placeholder-gray-300 border-[#9F90F9]"
                />
                <Button
                  onClick={depositTokens}
                  className="w-full bg-[#9F90F9] text-[#200052]"
                >
                  Deposit {depositAmount} DMON
                </Button>
              </div>
            </div>
          )}

          {currentStep === 4 && gameWalletFunded && (
            <div className="text-center">
              <h2 className="text-2xl font-semibold mb-4 text-[#9F90F9]">
                Game Ready
              </h2>
              {gameWalletSigner && walletAddress && (
                <Game
                  gameWalletSigner={gameWalletSigner}
                  walletAddress={walletAddress}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>

    // <div className="min-h-screen bg-gradient-to-b from-[#1F2937] to-[#4F46E5] text-white">
    //   <div className="container mx-auto py-12 px-4">
    //     <h1 className="text-5xl font-bold mb-8 text-center text-[#5FEDDF]">
    //       Mic-Mac-Moe
    //     </h1>
    //     <div className="max-w-md mx-auto bg-[#111827] rounded-3xl p-8 shadow-lg">
    //       {currentStep === 1 && (
    //         <div className="text-center">
    //           <h2 className="text-2xl font-semibold mb-4">Connect Wallet</h2>
    //           <Button
    //             onClick={connectWallet}
    //             className="bg-[#5FEDDF] text-[#111827]"
    //             disabled={signingMessage}
    //           >
    //             {signingMessage ? 'Signing Message...' : 'Connect Wallet'}
    //           </Button>
    //         </div>
    //       )}

    //       {currentStep === 2 && walletAddress && (
    //         <div className="text-center">
    //           <h2 className="text-2xl font-semibold mb-4">
    //             Generate Game Wallet
    //           </h2>
    //           <p className="mb-4">
    //             Connected as:{' '}
    //             <span className="font-semibold text-[#5FEDDF]">
    //               {walletAddress}
    //             </span>
    //           </p>
    //           <Button
    //             onClick={generateGameWallet}
    //             className="bg-[#5FEDDF] text-[#111827]"
    //           >
    //             Generate Game Wallet
    //           </Button>
    //         </div>
    //       )}

    //       {currentStep === 3 && gameWallet && (
    //         <div className="text-center">
    //           <h2 className="text-2xl font-semibold mb-4">
    //             Game Wallet Generated
    //           </h2>
    //           <p className="mb-4">
    //             Game Wallet Address:{' '}
    //             <span className="font-semibold text-[#5FEDDF]">
    //               {gameWallet.address}
    //             </span>
    //           </p>
    //           <Button
    //             onClick={copyPrivateKey}
    //             className="bg-[#5FEDDF] text-[#111827] mb-4"
    //           >
    //             <FiCopy className="inline-block mr-2" /> Copy Private Key
    //           </Button>
    //           <div className="space-y-4">
    //             <h3 className="text-lg">Deposit DMON into Game Wallet</h3>
    //             <Input
    //               type="text"
    //               value={depositAmount}
    //               onChange={(e) => setDepositAmount(e.target.value)}
    //               className="w-full bg-[#4F46E5] text-white placeholder-gray-300 border-[#5FEDDF]"
    //             />
    //             <Button
    //               onClick={depositTokens}
    //               className="w-full bg-[#5FEDDF] text-[#111827]"
    //             >
    //               Deposit {depositAmount} DMON
    //             </Button>
    //           </div>
    //         </div>
    //       )}

    //       {currentStep === 4 && gameWalletFunded && (
    //         <div className="text-center">
    //           <h2 className="text-2xl font-semibold mb-4">Game Ready</h2>
    //           {gameWalletSigner && walletAddress && (
    //             <Game
    //               gameWalletSigner={gameWalletSigner}
    //               walletAddress={walletAddress}
    //             />
    //           )}
    //         </div>
    //       )}
    //     </div>
    //   </div>
    // </div>
  )
}
