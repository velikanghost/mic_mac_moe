import { useState } from 'react'
import { Bars } from 'react-loader-spinner'

type GameBoardProps = {
  board: number[]
  isMoving: boolean
  isAIMoving: boolean
  onCellClick: (index: number) => void
}

const GameBoard: React.FC<GameBoardProps> = ({
  board,
  isMoving,
  isAIMoving,
  onCellClick,
}) => {
  const [selected, setSelected] = useState<number>()
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-[#200052] rounded-2xl mt-3 md:mt-1 p-1 md:p-4 relative">
        <div className="grid grid-cols-3 gap-4 relative">
          {isAIMoving && (
            <div className="absolute inset-0 bg-white/30 z-10 rounded-3xl border border-white/30 flex items-center justify-center">
              <Bars
                height="30"
                color="purple"
                ariaLabel="bars-loading"
                wrapperClass="mx-auto text-center"
                visible={true}
              />
            </div>
          )}
          {board?.map((cell, index) => {
            return (
              <button
                key={index}
                className="bg-[#836EF9] h-[84px] md:h-[96px] rounded-2xl p-4 md:p-6 text-5xl font-bold transition-all duration-200 ease-in-out hover:bg-opacity-80 focus:outline-none focus:ring-2 focus:ring-[#5FEDDF] focus:ring-opacity-50 shadow-md"
                onClick={() => {
                  setSelected(index)
                  onCellClick(index)
                }}
              >
                {isMoving && index === selected ? (
                  <Bars
                    height="30"
                    color="white"
                    ariaLabel="bars-loading"
                    wrapperClass="mx-auto text-center"
                    visible={true}
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
