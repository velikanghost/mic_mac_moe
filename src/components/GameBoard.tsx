import { Loader } from '@mantine/core'
import {} from '@radix-ui/react-slot'
import { useState } from 'react'

type GameBoardProps = {
  board: number[]
  isMoving: boolean
  onCellClick: (index: number) => void
}

const GameBoard: React.FC<GameBoardProps> = ({
  board,
  isMoving,
  onCellClick,
}) => {
  const [selected, setSelected] = useState<number>()
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-[#200052] rounded-3xl p-4 shadow-lg">
        <div className="grid grid-cols-3 gap-4">
          {board?.map((cell, index) => {
            return (
              <button
                key={index}
                className="bg-[#836EF9] h-[96px] w-[106px] rounded-2xl p-6 text-5xl font-bold transition-all duration-200 ease-in-out hover:bg-opacity-80 focus:outline-none focus:ring-2 focus:ring-[#5FEDDF] focus:ring-opacity-50 shadow-md"
                onClick={() => {
                  setSelected(index)
                  onCellClick(index)
                }}
              >
                {isMoving && index === selected ? (
                  <Loader
                    color="white"
                    type="bars"
                    size="sm"
                    className="mx-auto text-center"
                  />
                ) : (
                  <span
                    className={`
                  ${BigInt(cell) === BigInt(1) ? 'text-[#5FEDDF]' : ''}
                  ${BigInt(cell) === BigInt(2) ? 'text-white' : ''}
                `}
                  >
                    {BigInt(cell) === BigInt(1)
                      ? 'X'
                      : BigInt(cell) === BigInt(2)
                      ? 'O'
                      : ''}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default GameBoard
