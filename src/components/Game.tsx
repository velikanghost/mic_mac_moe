import { FC, useEffect, useState } from 'react'
import GameBoard from './GameBoard'
import {
  createPublicClient,
  createWalletClient,
  http,
  LocalAccount,
} from 'viem'
import { FiCopy } from 'react-icons/fi'
import { mmmAbi } from '../lib/MicMacMoe'
import { monadDevnet } from '@/lib/customChain'

interface GameProps {
  connectedAddress: string
  gameWallet: LocalAccount
}

const transport = http(process.env.NEXT_PUBLIC_MONAD_RPC_URL)
const contractAddress = process.env.NEXT_PUBLIC_MICMACMOE_CONTRACT_ADDRESS

const publicClient = createPublicClient({
  chain: monadDevnet,
  transport,
})

const Game: FC<GameProps> = ({ connectedAddress, gameWallet }) => {
  const [board, setBoard] = useState<any>(null)
  const [currentGame, setCurrentGame] = useState<string | null>(null)
  const [currentTurn, setCurrentTurn] = useState<string>('')
  const [joinerInput, setJoinerInput] = useState<any>()
  const [player2Address, setPlayer2Address] = useState<string>('')
  const [gameId, setGameId] = useState<`0x${string}`>(
    (localStorage.getItem('gameId')! as `0x${string}`) || '',
  )
  const [isMoving, setIsMoving] = useState(false)

  const walletClient = createWalletClient({
    account: gameWallet,
    chain: monadDevnet,
    transport,
  })

  useEffect(() => {
    console.log('Setting up contract event listener...')

    const unwatch = publicClient.watchContractEvent({
      address: contractAddress as `0x${string}`,
      abi: mmmAbi,
      onLogs: async (logs) => {
        console.log('Event Logs:', logs[0].eventName)
        if (logs[0].eventName === 'MoveMade') {
          const game = await publicClient.readContract({
            address: contractAddress as `0x${string}`,
            abi: mmmAbi,
            functionName: 'games',
            args: [gameId as `0x${string}`],
          })

          const rawBoard = await publicClient.readContract({
            address: contractAddress as `0x${string}`,
            abi: mmmAbi,
            functionName: 'getBoard',
            args: [gameId as `0x${string}`],
          })

          const currentTurn = game[2]
          console.log({ currentTurn })

          setBoard(rawBoard)
          setCurrentTurn(currentTurn.toLowerCase())
          setCurrentGame(gameId)
        }

        if (logs[0].eventName === 'GameEnded') {
          const game = await publicClient.readContract({
            address: contractAddress as `0x${string}`,
            abi: mmmAbi,
            functionName: 'games',
            args: [gameId as `0x${string}`],
          })

          const rawBoard = await publicClient.readContract({
            address: contractAddress as `0x${string}`,
            abi: mmmAbi,
            functionName: 'getBoard',
            args: [gameId as `0x${string}`],
          })

          setBoard(rawBoard)
        }
      },
    })

    // const logs = publicClient.getLogs()
    // console.log('Fetched Logs:', logs)

    return () => {
      unwatch()
    }
  }, [currentTurn])

  const fetchGameState = async (gameId: `0x${string}`) => {
    try {
      console.log('Fetching game state for gameId:', gameId)

      const game = await publicClient.readContract({
        address: contractAddress as `0x${string}`,
        abi: mmmAbi,
        functionName: 'games',
        args: [gameId as `0x${string}`],
      })

      const rawBoard = await publicClient.readContract({
        address: contractAddress as `0x${string}`,
        abi: mmmAbi,
        functionName: 'getBoard',
        args: [gameId as `0x${string}`],
      })

      const currentTurn = game[2]
      console.log({ currentTurn })

      setBoard(rawBoard)
      setCurrentTurn(currentTurn.toLowerCase())
      setCurrentGame(gameId)
      console.log('Game state updated successfully!')
    } catch (error) {
      console.error('Error fetching game state:', error)
      setBoard([]) // Fallback to an empty board on error
    }
  }

  const createGame = async (opponentAddress: string) => {
    if (!connectedAddress || !opponentAddress) return

    const walletClient = createWalletClient({
      account: gameWallet,
      chain: monadDevnet,
      transport,
    })

    const hash = await walletClient.writeContract({
      address: contractAddress as `0x${string}`,
      abi: mmmAbi,
      functionName: 'createGame',
      args: [
        opponentAddress as `0x${string}`,
        connectedAddress as `0x${string}`,
      ],
    })

    const txnReceipt = await publicClient.waitForTransactionReceipt({ hash })
    const gameId = txnReceipt.logs[0].topics[1]

    localStorage.setItem('gameId', gameId!)
    setGameId(gameId!)

    const game = await publicClient.readContract({
      address: contractAddress as `0x${string}`,
      abi: mmmAbi,
      functionName: 'games',
      args: [gameId as `0x${string}`],
    })

    const rawBoard = await publicClient.readContract({
      address: contractAddress as `0x${string}`,
      abi: mmmAbi,
      functionName: 'getBoard',
      args: [gameId as `0x${string}`],
    })

    const currentTurn = game[2]
    console.log({ currentTurn })

    setBoard(rawBoard)
    setCurrentTurn(currentTurn.toLowerCase())
    setCurrentGame(gameId!)
    console.log('Game created with ID:', gameId)
  }

  const makeMove = async (index: number) => {
    if (currentTurn !== connectedAddress.toLowerCase()) {
      alert("It's not your turn!")
      return
    }
    setIsMoving(true)

    try {
      const hash = await walletClient.writeContract({
        address: contractAddress as `0x${string}`,
        abi: mmmAbi,
        functionName: 'makeMove',
        args: [gameId, index, connectedAddress as `0x${string}`],
      })

      const txnReceipt = await publicClient.waitForTransactionReceipt({ hash })

      console.log({ txnReceipt })

      await fetchGameState(gameId)
      setIsMoving(false)
    } catch (error) {
      console.log(error)
      setIsMoving(false)
    }
  }

  const handleJoinGame = async () => {
    if (!joinerInput) {
      alert('Please enter a valid game ID.')
      return
    }
    setGameId(joinerInput)

    localStorage.setItem('gameId', joinerInput)

    const game = await publicClient.readContract({
      address: contractAddress as `0x${string}`,
      abi: mmmAbi,
      functionName: 'games',
      args: [joinerInput as `0x${string}`],
    })

    const rawBoard = await publicClient.readContract({
      address: contractAddress as `0x${string}`,
      abi: mmmAbi,
      functionName: 'getBoard',
      args: [joinerInput as `0x${string}`],
    })

    const currentTurn = game[2]
    console.log({ currentTurn })

    setBoard(rawBoard)
    setCurrentTurn(currentTurn.toLowerCase())
    setCurrentGame(joinerInput)
    console.log('Game joined with ID:', joinerInput)
    //await fetchGameState(joinerInput)
  }

  const closeGame = () => {
    setCurrentGame(null)
    setBoard(null)
    setCurrentTurn('')
  }

  const copyGameId = () => {
    if (gameId) {
      navigator.clipboard.writeText(gameId)
      alert('Game Id copied to clipboard!')
    }
  }

  const exitGame = async () => {
    if (!currentGame) return
    //const contract = new ethers.Contract(contractAddress!, mmmAbi, gameWalletClient);
    // await contract.exitGame(currentGame)
    // closeGame()
  }

  return (
    <div>
      {currentGame ? (
        board ? (
          <>
            <p className="mb-6 text-center font-semibold text-[#9F90F9]">
              {currentTurn === connectedAddress.toLowerCase()
                ? "It's your turn!"
                : "Waiting for opponent's move..."}
            </p>
            <p>{gameId.slice(0, 12) + '....' + gameId.slice(54)}</p>
            <button
              onClick={copyGameId}
              className="bg-[#9F90F9] text-[#200052] mb-4"
            >
              <FiCopy className="inline-block mr-2" /> Copy GameId
            </button>
            <GameBoard
              board={board}
              onCellClick={(index) => makeMove(index)}
              isMoving={isMoving}
            />
            <div className="mt-6 space-y-4">
              <button
                onClick={closeGame}
                className="w-full bg-[#9F90F9] text-[#200052]"
              >
                <FiCopy className="inline-block mr-2" /> Close Game
              </button>
              <button
                onClick={exitGame}
                className="w-full text-white bg-red-500 hover:bg-red-600"
              >
                <FiCopy className="inline-block mr-2" /> Exit Game
              </button>
            </div>
          </>
        ) : (
          <p className="text-center text-[#9F90F9]">Loading game state...</p>
        )
      ) : (
        <div className="space-y-4">
          <input
            placeholder="Enter Opponent Address"
            onChange={(e) => setPlayer2Address(e.target.value)}
            className="w-full bg-[#200052] text-white placeholder-gray-300 placeholder-opacity-50 border-[#9F90F9]"
          />
          <button
            onClick={() => createGame(player2Address)}
            className="w-full bg-[#9F90F9] text-[#200052]"
          >
            Start Game
          </button>
          <br />
          <input
            placeholder="Enter Game ID"
            onChange={(e) => setJoinerInput(e.target.value)}
            className="w-full bg-[#200052] text-white placeholder-gray-300 placeholder-opacity-50 border-[#9F90F9]"
          />
          <button
            onClick={handleJoinGame}
            className="w-full bg-[#9F90F9] text-[#200052]"
          >
            Join Game
          </button>
        </div>
      )}
    </div>
  )
}

export default Game
