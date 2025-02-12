import { FC, useEffect, useState } from 'react'
import GameBoard from './GameBoard'
import {
  createPublicClient,
  createWalletClient,
  http,
  LocalAccount,
} from 'viem'
import { mmmAbi } from '../lib/MicMacMoe'
import { monadDevnet } from '@/lib/customChain'
import { CircleX, Copy, LogOut } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { toast } from 'sonner'
import { Bars } from 'react-loader-spinner'
import { getPlayLetter } from '@/lib/helpers'

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
  const [game, setGame] = useState<any>(null)
  const [currentTurn, setCurrentTurn] = useState<string>('')
  const [joinerInput, setJoinerInput] = useState<string>('')
  const [player2Address, setPlayer2Address] = useState<string>('')
  const [gameId, setGameId] = useState<string>(
    (localStorage.getItem('gameId')! as `0x${string}`) || '',
  )
  const [isMoving, setIsMoving] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

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
          const rawGame = await publicClient.readContract({
            address: contractAddress as `0x${string}`,
            abi: mmmAbi,
            functionName: 'games',
            args: [gameId as `0x${string}`],
          })

          if (!rawGame.includes(connectedAddress as `0x${string}`)) {
            return
          }

          const rawBoard = await publicClient.readContract({
            address: contractAddress as `0x${string}`,
            abi: mmmAbi,
            functionName: 'getBoard',
            args: [gameId as `0x${string}`],
          })

          const currentTurn = rawGame[2]

          setGame(rawGame)
          setBoard(rawBoard)
          setCurrentTurn(currentTurn.toLowerCase())
          setGameId(gameId)
        }

        if (logs[0].eventName === 'GameEnded') {
          const rawGame = await publicClient.readContract({
            address: contractAddress as `0x${string}`,
            abi: mmmAbi,
            functionName: 'games',
            args: [gameId as `0x${string}`],
          })

          // if (!rawGame.includes(connectedAddress as `0x${string}`)) {
          //   return
          // }

          //console.log('Endgame: ', rawGame)

          const rawBoard = await publicClient.readContract({
            address: contractAddress as `0x${string}`,
            abi: mmmAbi,
            functionName: 'getBoard',
            args: [gameId as `0x${string}`],
          })

          setBoard(rawBoard)
          toast.success(`Winner is ${rawGame[4]}`)
        }
      },
    })

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

      setBoard(rawBoard)
      setCurrentTurn(currentTurn.toLowerCase())
      setGameId(gameId)
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

    setIsCreating(true)

    try {
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

      const rawGame = await publicClient.readContract({
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

      const currentTurn = rawGame[2]

      //setGameId(gameId!)
      setGame(rawGame)
      setBoard(rawBoard)
      setCurrentTurn(currentTurn.toLowerCase())
      setGameId(gameId!)
      setIsCreating(false)
    } catch (error) {
      console.error(error)
      setIsCreating(false)
    }
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
        args: [
          gameId as `0x${string}`,
          index,
          connectedAddress as `0x${string}`,
        ],
      })

      const txnReceipt = await publicClient.waitForTransactionReceipt({ hash })

      await fetchGameState(gameId as `0x${string}`)
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
    setIsJoining(true)

    try {
      localStorage.setItem('gameId', joinerInput)

      const game = await publicClient.readContract({
        address: contractAddress as `0x${string}`,
        abi: mmmAbi,
        functionName: 'games',
        args: [joinerInput as `0x${string}`],
      })

      if (!game.includes(connectedAddress as `0x${string}`)) {
        toast.error('You do not have an invite to this game')
        setIsJoining(false)
        return
      }

      const rawBoard = await publicClient.readContract({
        address: contractAddress as `0x${string}`,
        abi: mmmAbi,
        functionName: 'getBoard',
        args: [joinerInput as `0x${string}`],
      })

      const currentTurn = game[2]

      setBoard(rawBoard)
      setCurrentTurn(currentTurn.toLowerCase())
      setGameId(joinerInput)
      setIsJoining(false)
    } catch (error) {
      console.error(error)
      setIsJoining(false)
    }
  }

  const closeGame = () => {
    setGameId('')
    setBoard(null)
    setCurrentTurn('')
    localStorage.removeItem('gameId')
  }

  const copyGameId = () => {
    if (gameId) {
      navigator.clipboard.writeText(gameId)
      toast.success('Game Id copied to clipboard!')
    }
  }

  return (
    <div className="bg-[#200052] rounded-3xl p-4 md:p-8 shadow-lg">
      {gameId ? (
        board ? (
          <>
            <p className="mb-6 text-center font-semibold text-[#9F90F9]">
              {currentTurn === connectedAddress.toLowerCase()
                ? `It's your turn! You are ${getPlayLetter(
                    game,
                    connectedAddress,
                  )}`
                : "Waiting for opponent's move..."}
            </p>
            <Button onClick={copyGameId} className="mb-4 font-medium px-4">
              <Copy />
              Game ID: {gameId.slice(0, 12) + '....' + gameId.slice(54)}
            </Button>
            <GameBoard
              board={board}
              onCellClick={(index) => makeMove(index)}
              isMoving={isMoving}
            />
            <div className="mt-6 space-y-4">
              <Button
                variant="destructive"
                onClick={closeGame}
                className="mt-4"
              >
                <LogOut className="inline-block mr-2" /> Exit Game
              </Button>
            </div>
          </>
        ) : (
          <div className="flex flex-col justify-center items-center text-white">
            <CircleX size={40} />
            <p>This game has ended</p>
            <Button variant="destructive" onClick={closeGame} className="mt-4">
              <LogOut className="inline-block mr-2" /> Exit Game
            </Button>
          </div>
        )
      ) : (
        <div className="flex flex-col justify-center gap-6">
          <h2>Start a new game</h2>
          <div className="grid flex-1 ">
            <Input
              placeholder="Enter Opponent Address"
              onChange={(e) => setPlayer2Address(e.target.value)}
              className="w-full  placeholder-gray-300 placeholder-opacity-50 border-[#9F90F9]"
            />
            <Button onClick={() => createGame(player2Address)} className="mt-4">
              {isCreating ? (
                <Bars
                  height="40"
                  color="purple"
                  ariaLabel="bars-loading"
                  wrapperClass="mx-auto text-center"
                  visible={true}
                />
              ) : (
                'Start game'
              )}
            </Button>
          </div>

          <h2>Join an existing game</h2>
          <div className="grid flex-1 ">
            <Input
              placeholder="Enter Game ID"
              onChange={(e) => setJoinerInput(e.target.value)}
              className="w-full bg-[#200052] text-white placeholder-gray-300 placeholder-opacity-50 border-[#9F90F9]"
            />
            <Button onClick={handleJoinGame} className="mt-4">
              {isJoining ? (
                <Bars
                  height="40"
                  color="purple"
                  ariaLabel="bars-loading"
                  wrapperClass="mx-auto text-center"
                  visible={true}
                />
              ) : (
                'Join game'
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Game
