import { FC, useEffect, useState } from 'react'
import GameBoard from './GameBoard'
import {
  createPublicClient,
  createWalletClient,
  http,
  LocalAccount,
} from 'viem'
import { mmmAbi } from '../lib/MicMacMoe'
import { monadTestnet } from '@/lib/customChain'
import { Circle, CircleX, Copy, LogIn, LogOut, Users, X } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { toast } from 'sonner'
import { Bars } from 'react-loader-spinner'
import { getPlayLetter } from '@/lib/helpers'
import { privateKeyToAccount } from 'viem/accounts'

interface GameProps {
  connectedAddress: string
  gameWallet: LocalAccount
}

const transport = http(process.env.NEXT_PUBLIC_MONAD_RPC_URL)
const contractAddress = process.env.NEXT_PUBLIC_MICMACMOE_CONTRACT_ADDRESS

const publicClient = createPublicClient({
  chain: monadTestnet,
  transport,
})

const Game: FC<GameProps> = ({ connectedAddress, gameWallet }) => {
  const [activeTab, setActiveTab] = useState('friend')
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
    chain: monadTestnet,
    transport,
  })

  useEffect(() => {
    console.log('Setting up contract event listener...')

    const unwatch = publicClient.watchContractEvent({
      address: contractAddress as `0x${string}`,
      abi: mmmAbi,
      onLogs: async (logs) => {
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

          const rawBoard = await publicClient.readContract({
            address: contractAddress as `0x${string}`,
            abi: mmmAbi,
            functionName: 'getBoard',
            args: [gameId as `0x${string}`],
          })

          const winner = rawGame[4]
          setBoard(rawBoard)

          if (winner === '0x0000000000000000000000000000000000000000') {
            toast.success('The match is a draw!')
          } else {
            toast.success(`Winner is ${winner}`)
          }
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
      setBoard([])
    }
  }

  const createGame = async (opponentAddress: string) => {
    if (!connectedAddress || !opponentAddress) return

    const walletClient = createWalletClient({
      account: gameWallet,
      chain: monadTestnet,
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

  const createGameWithAI = async () => {
    const aiAddress = process.env.NEXT_PUBLIC_AI_WALLET_ADDRESS
    if (!aiAddress) {
      toast.error('AI cannot initialize.')
      return
    }

    setIsCreating(true)

    try {
      const hash = await walletClient.writeContract({
        address: contractAddress as `0x${string}`,
        abi: mmmAbi,
        functionName: 'createGame',
        args: [aiAddress as `0x${string}`, connectedAddress as `0x${string}`], // AI as player 2
      })

      const txnReceipt = await publicClient.waitForTransactionReceipt({ hash })
      const gameId = txnReceipt.logs[0].topics[1]

      localStorage.setItem('gameId', gameId!)

      // Fetch game state after creation
      await fetchGameState(gameId as `0x${string}`)

      setIsCreating(false)
      console.log('AI game started!')
    } catch (error) {
      console.error('Error starting AI game:', error)
      setIsCreating(false)
    }
  }

  const makeMove = async (index: number) => {
    if (currentTurn !== connectedAddress.toLowerCase()) {
      toast.error("It's not your turn!")
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
      toast.error('Please enter a valid game ID.')
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

  useEffect(() => {
    if (gameId && board && currentTurn) {
      makeAIMove(gameId as `0x${string}`, board, currentTurn)
    }
  }, [gameId, board, currentTurn])

  // const makeAIMove = async (
  //   gameId: `0x${string}`,
  //   board: number[],
  //   currentTurn: string,
  // ) => {
  //   const aiPrivateKey = process.env.NEXT_PUBLIC_AI_PRIVATE_KEY
  //   const aiAddress = process.env.NEXT_PUBLIC_AI_WALLET_ADDRESS

  //   if (!aiPrivateKey || !aiAddress) {
  //     console.error('AI credentials missing.')
  //     return
  //   }

  //   // AI should only move when it's its turn
  //   if (currentTurn !== aiAddress.toLowerCase()) {
  //     console.log("Not AI's turn yet. Waiting...")
  //     return
  //   }

  //   const account = privateKeyToAccount(`0x${aiPrivateKey.replace(/^0x/, '')}`)

  //   const aiWalletClient = createWalletClient({
  //     account,
  //     chain: monadTestnet,
  //     transport,
  //   })

  //   // Get AI's best move based on board state
  //   const aiMove = getBestMove(board)
  //   if (aiMove === -1) {
  //     console.log('AI has no valid move left.')
  //     return
  //   }

  //   try {
  //     console.log(`AI making move at index ${aiMove}`)

  //     const hash = await aiWalletClient.writeContract({
  //       address: contractAddress as `0x${string}`,
  //       abi: mmmAbi,
  //       functionName: 'makeMove',
  //       args: [gameId as `0x${string}`, aiMove, aiAddress as `0x${string}`],
  //     })

  //     await publicClient.waitForTransactionReceipt({ hash })

  //     // Fetch new game state after AI move
  //     await fetchGameState(gameId as `0x${string}`)
  //   } catch (error) {
  //     console.error('Error making AI move:', error)
  //   }
  // }

  const makeAIMove = async (
    gameId: `0x${string}`,
    board: number[],
    currentTurn: string,
  ) => {
    const aiPrivateKey = process.env.NEXT_PUBLIC_AI_PRIVATE_KEY
    const aiAddress = process.env.NEXT_PUBLIC_AI_WALLET_ADDRESS

    if (!aiPrivateKey || !aiAddress) {
      console.error('AI cannot initialize.')
      return
    }

    // Fetch latest game state to check if the game is still active
    const rawGame = await publicClient.readContract({
      address: contractAddress as `0x${string}`,
      abi: mmmAbi,
      functionName: 'games',
      args: [gameId as `0x${string}`],
    })

    const winner = rawGame[4] // Assuming index 4 is the winner field
    if (winner !== '0x0000000000000000000000000000000000000000') {
      toast(`Game over. Winner: ${winner === aiAddress ? 'AI' : winner}`)
      return
    }

    if (currentTurn !== aiAddress.toLowerCase()) {
      console.log("Not AI's turn yet. Waiting...")
      return
    }

    const account = privateKeyToAccount(`0x${aiPrivateKey.replace(/^0x/, '')}`)

    const aiWalletClient = createWalletClient({
      account,
      chain: monadTestnet,
      transport,
    })

    const aiMove = getBestMove(board)
    if (aiMove === -1) {
      console.log('AI has no valid move left.')
      return
    }

    try {
      console.log(`AI making move at index ${aiMove}`)

      const hash = await aiWalletClient.writeContract({
        address: contractAddress as `0x${string}`,
        abi: mmmAbi,
        functionName: 'makeMove',
        args: [gameId as `0x${string}`, aiMove, aiAddress as `0x${string}`],
      })

      await publicClient.waitForTransactionReceipt({ hash })
      await fetchGameState(gameId as `0x${string}`)
    } catch (error) {
      console.error('Error making AI move:', error)
    }
  }

  const getBestMove = (board: number[]): number => {
    const ai = 2
    const player = 1

    // Winning combinations
    const winPatterns = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8], // Rows
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8], // Columns
      [0, 4, 8],
      [2, 4, 6], // Diagonals
    ]

    // Check if AI or Player can win in the next move
    const findWinningMove = (symbol: number) => {
      for (let pattern of winPatterns) {
        const values = pattern.map((index) => board[index])
        const emptyIndex = pattern.find((index) => board[index] === 0)

        // If two spots are taken by `symbol` and one is empty, it's a winning move
        if (
          values.filter((v) => v === symbol).length === 2 &&
          emptyIndex !== undefined
        ) {
          return emptyIndex
        }
      }
      return null
    }

    // 1. Check if AI can win this turn
    let move = findWinningMove(ai)
    if (move !== null) return move

    // 2. Block player’s winning move
    move = findWinningMove(player)
    if (move !== null) return move

    // 3. Prioritize center if available
    if (board[4] === 0) return 4

    // 4. Take a corner if available
    const corners = [0, 2, 6, 8].filter((index) => board[index] === 0)
    if (corners.length > 0)
      return corners[Math.floor(Math.random() * corners.length)]

    // 5. Take a side if available
    const sides = [1, 3, 5, 7].filter((index) => board[index] === 0)
    if (sides.length > 0) return sides[Math.floor(Math.random() * sides.length)]

    return -1 // No moves left
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

  const TabButton = ({ value, icon, label }: any) => (
    <button
      onClick={() => setActiveTab(value)}
      className={`flex flex-col items-center justify-center p-4 rounded-xl transition-colors hover:scale-105 active:scale-95 ${
        activeTab === value
          ? 'bg-[#6B46C1] text-white'
          : 'bg-[white] text-black hover:bg-white/90'
      }`}
    >
      {icon}
      <span className="mt-2 text-sm font-medium">{label}</span>
    </button>
  )

  return (
    <div className="bg-[#200052] rounded-2xl md:p-8 shadow-lg">
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
            <Button
              onClick={copyGameId}
              className="hidden md:flex mb-4 font-medium px-4 mx-auto"
            >
              <Copy />
              Game ID: {gameId.slice(0, 12) + '....' + gameId.slice(54)}
            </Button>
            <Button
              onClick={copyGameId}
              className="mb-4 font-medium px-4 md:hidden"
            >
              <Copy /> Copy GameID
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
        <div className=" text-[#E2E2E2] flex items-center justify-center">
          <div className="w-full max-w-md p-2 md:p-8 rounded-3xl ">
            <h1 className="text-4xl font-bold mb-8 text-center text-[#9F7AEA]">
              Play
            </h1>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <TabButton
                value="friend"
                icon={<Users size={24} />}
                label="Friend"
              />
              <TabButton value="ai" icon={<LogIn size={24} />} label="AI" />
              <TabButton value="join" icon={<LogIn size={24} />} label="Join" />
            </div>

            <div>
              {activeTab === 'friend' && (
                <div className="space-y-4">
                  <Input
                    placeholder="Enter Opponent Address"
                    onChange={(e) => setPlayer2Address(e.target.value)}
                    className="w-full  placeholder-gray-300 placeholder-opacity-50 border-[#9F90F9]"
                  />
                  <Button
                    onClick={() => createGame(player2Address)}
                    className="mt-4 w-full bg-[#6B46C1] text-[#E2E2E2] hover:bg-[#9F7AEA] transition-colors"
                  >
                    {isCreating ? (
                      <Bars
                        height="50"
                        color="white"
                        ariaLabel="bars-loading"
                        wrapperClass="mx-auto text-center py-1"
                        visible={true}
                      />
                    ) : (
                      'Start game'
                    )}
                  </Button>
                </div>
              )}

              {activeTab === 'ai' && (
                <div className="space-y-4">
                  <p className="text-center text-[#A0AEC0] mb-4">
                    Challenge AI and test your skills!
                  </p>
                  <Button
                    onClick={createGameWithAI}
                    className="w-full bg-[#6B46C1] text-[#E2E2E2] hover:bg-[#9F7AEA] transition-colors"
                  >
                    {isCreating ? (
                      <Bars
                        height="50"
                        color="white"
                        ariaLabel="bars-loading"
                        wrapperClass="mx-auto text-center py-1"
                        visible={true}
                      />
                    ) : (
                      'Start Game with AI'
                    )}
                  </Button>
                </div>
              )}

              {activeTab === 'join' && (
                <div className="space-y-4">
                  <Input
                    placeholder="Enter Game ID"
                    onChange={(e) => setJoinerInput(e.target.value)}
                    className="w-full  placeholder-gray-300 placeholder-opacity-50 border-[#9F90F9]"
                  />
                  <Button
                    onClick={handleJoinGame}
                    className="w-full bg-[#6B46C1] text-[#E2E2E2] hover:bg-[#9F7AEA] transition-colors"
                  >
                    {isJoining ? (
                      <Bars
                        height="50"
                        color="white"
                        ariaLabel="bars-loading"
                        wrapperClass="mx-auto text-center py-1"
                        visible={true}
                      />
                    ) : (
                      'Join Game'
                    )}
                  </Button>
                </div>
              )}
            </div>

            <div className="mt-12 flex justify-between items-center opacity-50">
              <X size={24} className="text-[#9F7AEA]" />
              <Circle size={24} className="text-[#6B46C1]" />
              <X size={24} className="text-[#9F7AEA]" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Game
