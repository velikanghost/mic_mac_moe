import { ethers, Wallet } from 'ethers'
import { FC, useEffect, useState } from 'react'
import { FiXCircle, FiPlayCircle, FiCopy } from 'react-icons/fi'
import GameBoard from './GameBoard'
import { Button } from './ui/button'
import contractABI from '@/lib/MicMacMoe.json'
import { Input } from './ui/input'
const contractAddress = process.env.NEXT_PUBLIC_MICMACMOE_CONTRACT_ADDRESS

interface GameProps {
  gameWalletSigner: Wallet
  walletAddress: string
}

const Game: FC<GameProps> = ({ gameWalletSigner, walletAddress }) => {
  const [board, setBoard] = useState<number[] | null>(null)
  const [currentGame, setCurrentGame] = useState<number | null>(null)
  const [currentTurn, setCurrentTurn] = useState<string>('')
  const [joinerInput, setJoinerInput] = useState<any>()
  const [player2Address, setPlayer2Address] = useState<string>('')
  const [gameId, setGameId] = useState<string>('')

  useEffect(() => {
    if (currentGame) {
      console.log('Listening for events on game:', currentGame)

      const provider = new ethers.BrowserProvider(window.ethereum)
      provider.pollingInterval = 1000

      const contract = new ethers.Contract(
        contractAddress!,
        contractABI,
        provider,
      )

      const moveListener = (gameId: any, player: string, position: number) => {
        console.log('MoveMade event detected:', {
          gameId,
          player,
          position,
        })
        if (gameId === currentGame) {
          fetchGameState(gameId)
        }
      }

      const gameEndListener = async (
        gameId: any,
        state: number,
        winner: string,
      ) => {
        console.log('GameEnded event detected:', { gameId, state, winner })
        if (gameId === currentGame) {
          await fetchGameState(gameId)
          alert(
            winner !== '0x0000000000000000000000000000000000000000'
              ? `Game Over! Winner: ${winner}`
              : "Game Over! It's a draw!",
          )
        }
      }

      contract.on('MoveMade', moveListener)
      contract.on('GameEnded', gameEndListener)

      return () => {
        contract.off('MoveMade', moveListener)
        contract.off('GameEnded', gameEndListener)
        console.log('Cleaned up event listeners')
      }
    }
  }, [currentGame, currentTurn])

  const fetchGameState = async (gameId: number) => {
    try {
      console.log('Fetching game state for gameId:', gameId)
      const provider = new ethers.BrowserProvider(window.ethereum)
      provider.pollingInterval = 1000
      const contract = new ethers.Contract(
        contractAddress!,
        contractABI,
        provider,
      )

      const game = await contract.games(gameId)
      const board = await contract.getBoard(gameId)

      setBoard(board) // Update board state
      setCurrentTurn(game.currentTurn.toLowerCase()) // Update current turn
      setCurrentGame(gameId) // Update current game
      console.log('Game state updated successfully!')
    } catch (error) {
      console.error('Error fetching game state:', error)
      setBoard([]) // Fallback to an empty board on error
    }
  }

  const makeMove = async (index: number) => {
    if (!gameWalletSigner) return

    if (currentTurn !== walletAddress.toLowerCase()) {
      alert("It's not your turn!")
      return
    }

    const contract = new ethers.Contract(
      contractAddress!,
      contractABI,
      gameWalletSigner,
    )
    const tx = await contract.makeMove(currentGame, index, walletAddress)

    fetchGameState(currentGame!)
  }

  //   const makeMove = async (index: number) => {
  //     if (!gameWalletSigner) return

  //     if (currentTurn !== walletAddress.toLowerCase()) {
  //       alert("It's not your turn!")
  //       return
  //     }

  //     // Optimistic UI update
  //     const updatedBoard = [...board!] // Clone the current board
  //     updatedBoard[index] =
  //       walletAddress.toLowerCase() ===
  //       '0x0dc3defe8075593c96be542ffd2b0b193380d937'.toLowerCase()
  //         ? 2
  //         : 1
  //     setBoard(updatedBoard) // Update the UI immediately
  //     setCurrentTurn(
  //       currentTurn === gameWalletSigner.address.toLowerCase()
  //         ? gameWalletSigner.address.toLowerCase() // Set to opponent's turn optimistically
  //         : walletAddress.toLowerCase(),
  //     )

  //     try {
  //       // Send the transaction to the contract
  //       const contract = new ethers.Contract(
  //         contractAddress!,
  //         contractABI,
  //         gameWalletSigner,
  //       )
  //       const tx = await contract.makeMove(currentGame, index, walletAddress)
  //       await tx.wait()

  //       // Re-fetch the game state to validate the optimistic update
  //       await fetchGameState(currentGame!)
  //     } catch (error) {
  //       console.error('Error making move:', error)
  //       // Revert the optimistic update if the transaction fails
  //       await fetchGameState(currentGame!)
  //     }
  //   }

  const createGame = async (opponentAddress: string) => {
    if (!gameWalletSigner || !opponentAddress) return
    const contract = new ethers.Contract(
      contractAddress!,
      contractABI,
      gameWalletSigner,
    )

    const tx = await contract.createGame(opponentAddress, walletAddress)
    const res = await tx.wait()
    const gameId = res.logs[0].topics[1]
    setGameId(gameId)

    const game = await contract.games(gameId)
    const board = await contract.getBoard(gameId)

    setBoard(board) // Update board state
    setCurrentTurn(game.currentTurn.toLowerCase()) // Update current turn
    setCurrentGame(gameId) // Update current game
    //await fetchGameState(gameId)
    console.log('Game created with ID:', gameId)
  }

  const handleJoinGame = async () => {
    if (!joinerInput) {
      alert('Please enter a valid game ID.')
      return
    }
    await fetchGameState(joinerInput)
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
    if (!gameWalletSigner || !currentGame) return
    const contract = new ethers.Contract(
      contractAddress!,
      contractABI,
      gameWalletSigner,
    )
    // await contract.exitGame(currentGame) // Call the exit game method
    // closeGame()
  }

  return (
    <div>
      {currentGame ? (
        board ? (
          <>
            <p className="mb-6 text-center font-semibold text-[#9F90F9]">
              {currentTurn === walletAddress.toLowerCase()
                ? "It's your turn!"
                : "Waiting for opponent's move..."}
            </p>
            <p>{gameId.slice(0, 12) + '....' + gameId.slice(54)}</p>
            <Button
              onClick={copyGameId}
              className="bg-[#9F90F9] text-[#200052] mb-4"
            >
              <FiCopy className="inline-block mr-2" /> Copy GameId
            </Button>
            <GameBoard board={board} onCellClick={(index) => makeMove(index)} />
            <div className="mt-6 space-y-4">
              <Button
                onClick={closeGame}
                className="w-full bg-[#9F90F9] text-[#200052] hover:bg-opacity-80"
              >
                <FiXCircle className="inline-block mr-2" /> Close Game
              </Button>
              <Button
                onClick={exitGame}
                className="w-full bg-red-500 text-white hover:bg-red-600"
              >
                <FiPlayCircle className="inline-block mr-2" /> Exit Game
              </Button>
            </div>
          </>
        ) : (
          <p className="text-center text-[#9F90F9]">Loading game state...</p>
        )
      ) : (
        <div className="space-y-4">
          <Input
            placeholder="Enter Opponent Address"
            onChange={(e) => setPlayer2Address(e.target.value)}
            className="w-full bg-[#200052] text-white placeholder-gray-300 placeholder-opacity-50 border-[#9F90F9]"
          />
          <Button
            onClick={() => createGame(player2Address)}
            className="w-full bg-[#9F90F9] text-[#200052] hover:bg-opacity-80"
          >
            Start Game
          </Button>
          <br />
          <Input
            placeholder="Enter Game ID"
            onChange={(e) => setJoinerInput(e.target.value)}
            className="w-full bg-[#200052] text-white placeholder-gray-300 placeholder-opacity-50 border-[#9F90F9]"
          />
          <Button
            onClick={handleJoinGame}
            className="w-full bg-[#9F90F9] text-[#200052] hover:bg-opacity-80"
          >
            Join Game
          </Button>
        </div>
      )}
    </div>

    // <div>
    //   {currentGame ? (
    //     board ? (
    //       <>
    //         <p className="mb-6 text-center font-semibold">
    //           {currentTurn === walletAddress.toLowerCase()
    //             ? "It's your turn!"
    //             : "Waiting for opponent's move..."}
    //         </p>
    //         <GameBoard board={board} onCellClick={(index) => makeMove(index)} />
    //         <div className="mt-6 space-y-4">
    //           <Button
    //             onClick={closeGame}
    //             className="w-full bg-yellow-500 text-[#111827] hover:bg-yellow-600"
    //           >
    //             <FiXCircle className="inline-block mr-2" /> Close Game
    //           </Button>
    //           <Button
    //             onClick={exitGame}
    //             className="w-full bg-red-500 text-white hover:bg-red-600"
    //           >
    //             <FiPlayCircle className="inline-block mr-2" /> Exit Game
    //           </Button>
    //         </div>
    //       </>
    //     ) : (
    //       <p className="text-center">Loading game state...</p>
    //     )
    //   ) : (
    //     <div className="space-y-4">
    //       <Button
    //         onClick={() =>
    //           createGame('0x0DC3defe8075593c96Be542fFD2b0B193380D937')
    //         }
    //         className="w-full bg-[#5FEDDF] text-[#111827] hover:bg-opacity-80"
    //       >
    //         Start Game
    //       </Button>
    //       <Input
    //         placeholder="Enter Game ID"
    //         onChange={(e) => setJoinerInput(e.target.value)}
    //         className="w-full bg-[#4F46E5] text-white placeholder-gray-300 placeholder-opacity-50 border-[#5FEDDF]"
    //       />
    //       <Button
    //         onClick={handleJoinGame}
    //         className="w-full bg-[#5FEDDF] text-[#111827] hover:bg-opacity-80"
    //       >
    //         Join Game
    //       </Button>
    //     </div>
    //   )}
    // </div>
  )
}

export default Game
