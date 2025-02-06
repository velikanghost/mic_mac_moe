import { FC, useEffect, useState } from 'react'
import GameBoard from './GameBoard'
import { Client, LocalAccount, PublicClient, WalletClient } from 'viem'
import { FiCopy } from 'react-icons/fi'
import { mmmAbi } from '../lib/MicMacMoe'

const contractAddress = process.env.NEXT_PUBLIC_MICMACMOE_CONTRACT_ADDRESS

interface GameProps {
  gameWalletClient: WalletClient
  gamePublicClient: PublicClient
  walletAddress: string
  gameWallet: LocalAccount
}

const Game: FC<GameProps> = ({
  gameWalletClient,
  gamePublicClient,
  walletAddress,
  gameWallet,
}) => {
  const [board, setBoard] = useState<any>(null)
  const [currentGame, setCurrentGame] = useState<string | null>(null)
  const [currentTurn, setCurrentTurn] = useState<string>('')
  const [joinerInput, setJoinerInput] = useState<any>()
  const [player2Address, setPlayer2Address] = useState<string>('')
  const [gameId, setGameId] = useState<string>(
    localStorage.getItem('gameId')! || '',
  )

  const fetchGameState = async (gameId: string) => {
    // try {
    //   console.log('Fetching game state for gameId:', gameId)
    //   //const contract = new ethers.Contract(contractAddress!, mmmAbi, provider);
    //   //const game = await contract.games(gameId);
    //   //const rawBoard = await contract.getBoard(gameId);
    //   // Convert Proxy/Result into a plain array
    //   const board = Array.from(rawBoard, (cell) =>
    //     typeof cell === 'bigint' ? Number(cell) : cell,
    //   )
    //   console.log('Fetched board:', board)
    //   // Compare with the current board state
    //   const boardAsString = JSON.stringify(board)
    //   const currentBoardAsString = JSON.stringify(
    //     board?.map((cell) => (typeof cell === 'bigint' ? Number(cell) : cell)),
    //   )
    //   if (boardAsString !== currentBoardAsString) {
    //     console.log('Reverting to blockchain state...')
    //     setBoard(board)
    //     setCurrentTurn(game.currentTurn.toLowerCase())
    //     //setCurrentGame(gameId)
    //   } else {
    //     console.log('UI matches blockchain state. No revert needed.')
    //   }
    // } catch (error) {
    //   console.error('Error fetching game state:', error)
    //   setBoard([])
    // }
  }

  const makeMove = async (index: number) => {
    if (!gameWalletClient) return

    if (currentTurn !== walletAddress.toLowerCase()) {
      alert("It's not your turn!")
      return
    }

    //const contract = new ethers.Contract(contractAddress!, mmmAbi, gameWalletClient);

    // Optimistic UI update for Player 1
    const updatedBoard = [...(board || [])]
    updatedBoard[index] = BigInt(walletAddress) === BigInt(currentTurn) ? 1 : 2
    setBoard(updatedBoard)
    setCurrentGame(gameId)

    try {
      //const tx = await contract.makeMove(currentGame, index, walletAddress);
      //await tx.wait();

      //socket.emit("move", { gameId: currentGame, index, player: walletAddress });

      // Fetch the blockchain state after move confirmation
      fetchGameState(currentGame!)
    } catch (error) {
      console.error('Error making move:', error)
      alert('Transaction failed! Reverting move...')
      fetchGameState(currentGame!) // Revert to the blockchain state
    }
  }

  const createGame = async (opponentAddress: string) => {
    if (!gameWalletClient || !opponentAddress || !gamePublicClient) return

    console.log(contractAddress)
    console.log(mmmAbi)

    const [account] = await gameWalletClient.getAddresses()

    const { request } = await gamePublicClient.simulateContract({
      address: contractAddress as `0x${string}`,
      abi: mmmAbi,
      functionName: 'createGame',
      args: [opponentAddress as `0x${string}`, account],
      account: account,
    })

    const hash = await gameWalletClient.writeContract(request)

    console.log({ request, hash })

    //console.log("Game Id: " + txnReceipt.logs[0].topics[1]);

    localStorage.setItem('gameId', gameId)
    setGameId(gameId)

    const game = await gamePublicClient.readContract({
      address: contractAddress as `0x${string}`,
      abi: mmmAbi,
      functionName: 'games',
      args: [gameId as `0x${string}`],
    })

    console.log({ game })

    //const game = await contract.games(gameId);
    //const rawBoard = await contract.getBoard(gameId);

    const rawBoard = await gamePublicClient.readContract({
      address: contractAddress as `0x${string}`,
      abi: mmmAbi,
      functionName: 'getBoard',
      args: [gameId as `0x${string}`],
    })

    console.log({ rawBoard })

    setBoard(board)
    //setCurrentTurn(game.currentTurn.toLowerCase());
    setCurrentGame(gameId)
    console.log('Game created with ID:', gameId)
  }

  const handleJoinGame = async () => {
    if (!joinerInput) {
      alert('Please enter a valid game ID.')
      return
    }
    // const contract = new ethers.Contract(contractAddress!, mmmAbi, gameWalletClient);
    // localStorage.setItem("gameId", joinerInput);

    // const game = await contract.games(joinerInput);
    // const board = await contract.getBoard(joinerInput);

    // setBoard(board);
    // setCurrentTurn(game.currentTurn.toLowerCase());
    // setCurrentGame(joinerInput);
    console.log('Game created with ID:', joinerInput)
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
    if (!gameWalletClient || !currentGame) return
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
              {currentTurn === walletAddress.toLowerCase()
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
            <GameBoard board={board} onCellClick={(index) => makeMove(index)} />
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

// import { ethers, Wallet } from 'ethers'
// import { FC, useEffect, useState } from 'react'
// import { FiXCircle, FiPlayCircle, FiCopy } from 'react-icons/fi'
// import GameBoard from './GameBoard'
// import { button } from './ui/button'
// import mmmAbi from '@/lib/MicMacMoe.json'
// import { Input } from './ui/input'
// import { io } from 'socket.io-client'
// const contractAddress = process.env.NEXT_PUBLIC_MICMACMOE_CONTRACT_ADDRESS

// interface GameProps {
//   gameWalletClient: Wallet
//   walletAddress: string
// }

// const Game: FC<GameProps> = ({ gameWalletClient, walletAddress }) => {
//   const [board, setBoard] = useState<number[] | null>(null)
//   const [currentGame, setCurrentGame] = useState<string | null>(null)
//   const [currentTurn, setCurrentTurn] = useState<string>('')
//   const [joinerInput, setJoinerInput] = useState<any>()
//   const [player2Address, setPlayer2Address] = useState<string>('')
//   const [gameId, setGameId] = useState<string>(
//     localStorage.getItem('gameId')! || '',
//   )

//   const socket = io('http://localhost:3001') // Replace with your server's URL

//   // Listen for moves using Socket.IO
//   useEffect(() => {
//     socket.on('move', (data) => {
//       console.log('Move received via socket:', data)
//       if (data.gameId) {
//         console.log(data.gameId)
//         fetchGameState(data.gameId) // Update the game state
//       }
//     })

//     return () => {
//       socket.off('move') // Cleanup listener on unmount
//     }
//   }, [currentGame, currentTurn])

//   const fetchGameState = async (gameId: string) => {
//     try {
//       console.log('Fetching game state for gameId:', gameId)
//       const provider = new ethers.BrowserProvider(window.ethereum)
//       provider.pollingInterval = 1000
//       const contract = new ethers.Contract(
//         contractAddress!,
//         mmmAbi,
//         provider,
//       )

//       const game = await contract.games(gameId)
//       const board = await contract.getBoard(gameId)

//       console.log(board)

//       setBoard(board)
//       setCurrentTurn(game.currentTurn.toLowerCase())
//       setCurrentGame(gameId)
//       console.log('Game state updated successfully!')
//     } catch (error) {
//       console.error('Error fetching game state:', error)
//       setBoard([])
//     }
//   }

//   const makeMove = async (index: number) => {
//     if (!gameWalletClient) return

//     if (currentTurn !== walletAddress.toLowerCase()) {
//       alert("It's not your turn!")
//       return
//     }
//     const gameId = localStorage.getItem('gameId')

//     const contract = new ethers.Contract(
//       contractAddress!,
//       mmmAbi,
//       gameWalletClient,
//     )
//     const tx = await contract.makeMove(currentGame, index, walletAddress)
//     await tx.wait()

//     socket.emit('move', { gameId: currentGame, index, player: walletAddress })
//     const game = await contract.games(gameId)
//     const board = await contract.getBoard(gameId)

//     setBoard(board)
//     setCurrentTurn(game.currentTurn.toLowerCase())
//     setCurrentGame(gameId)

//     // fetchGameState(currentGame!)
//   }

//   const createGame = async (opponentAddress: string) => {
//     if (!gameWalletClient || !opponentAddress) return
//     const contract = new ethers.Contract(
//       contractAddress!,
//       mmmAbi,
//       gameWalletClient,
//     )

//     const tx = await contract.createGame(opponentAddress, walletAddress)
//     const res = await tx.wait()
//     const gameId = res.logs[0].topics[1]
//     localStorage.setItem('gameId', gameId)
//     setGameId(gameId)

//     const game = await contract.games(gameId)
//     const board = await contract.getBoard(gameId)

//     setBoard(board)
//     setCurrentTurn(game.currentTurn.toLowerCase())
//     setCurrentGame(gameId)
//     console.log('Game created with ID:', gameId)
//   }

//   const handleJoinGame = async () => {
//     if (!joinerInput) {
//       alert('Please enter a valid game ID.')
//       return
//     }
//     localStorage.setItem('gameId', joinerInput)
//     await fetchGameState(joinerInput)
//   }

//   const closeGame = () => {
//     setCurrentGame(null)
//     setBoard(null)
//     setCurrentTurn('')
//   }

//   const copyGameId = () => {
//     if (gameId) {
//       navigator.clipboard.writeText(gameId)
//       alert('Game Id copied to clipboard!')
//     }
//   }

//   const exitGame = async () => {
//     if (!gameWalletClient || !currentGame) return
//     const contract = new ethers.Contract(
//       contractAddress!,
//       mmmAbi,
//       gameWalletClient,
//     )
//     // await contract.exitGame(currentGame)
//     // closeGame()
//   }

//   return (
//     <div>
//       {currentGame ? (
//         board ? (
//           <>
//             <p className="mb-6 text-center font-semibold text-[#9F90F9]">
//               {currentTurn === walletAddress.toLowerCase()
//                 ? "It's your turn!"
//                 : "Waiting for opponent's move..."}
//             </p>
//             <p>{gameId.slice(0, 12) + '....' + gameId.slice(54)}</p>
//             <button
//               onClick={copyGameId}
//               className="bg-[#9F90F9] text-[#200052] mb-4"
//             >
//               <FiCopy className="inline-block mr-2" /> Copy GameId
//             </button>
//             <GameBoard board={board} onCellClick={(index) => makeMove(index)} />
//             <div className="mt-6 space-y-4">
//               <button
//                 onClick={closeGame}
//                 className="w-full bg-[#9F90F9] text-[#200052]"
//               >
//                 <FiXCircle className="inline-block mr-2" /> Close Game
//               </button>
//               <button
//                 onClick={exitGame}
//                 className="w-full text-white bg-red-500 hover:bg-red-600"
//               >
//                 <FiPlayCircle className="inline-block mr-2" /> Exit Game
//               </button>
//             </div>
//           </>
//         ) : (
//           <p className="text-center text-[#9F90F9]">Loading game state...</p>
//         )
//       ) : (
//         <div className="space-y-4">
//           <Input
//             placeholder="Enter Opponent Address"
//             onChange={(e) => setPlayer2Address(e.target.value)}
//             className="w-full bg-[#200052] text-white placeholder-gray-300 placeholder-opacity-50 border-[#9F90F9]"
//           />
//           <button
//             onClick={() => createGame(player2Address)}
//             className="w-full bg-[#9F90F9] text-[#200052]"
//           >
//             Start Game
//           </button>
//           <br />
//           <Input
//             placeholder="Enter Game ID"
//             onChange={(e) => setJoinerInput(e.target.value)}
//             className="w-full bg-[#200052] text-white placeholder-gray-300 placeholder-opacity-50 border-[#9F90F9]"
//           />
//           <button
//             onClick={handleJoinGame}
//             className="w-full bg-[#9F90F9] text-[#200052]"
//           >
//             Join Game
//           </button>
//         </div>
//       )}
//     </div>
//   )
// }

// export default Game
