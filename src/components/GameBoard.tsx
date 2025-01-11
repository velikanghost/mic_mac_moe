type GameBoardProps = {
  board: number[]
  onCellClick: (index: number) => void
}

const GameBoard: React.FC<GameBoardProps> = ({ board, onCellClick }) => {
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-[#200052] rounded-3xl p-4 shadow-lg">
        <div className="grid grid-cols-3 gap-4">
          {board?.map((cell, index) => {
            return (
              <button
                key={index}
                className="bg-[#836EF9] rounded-2xl p-6 text-5xl font-bold transition-all duration-200 ease-in-out hover:bg-opacity-80 focus:outline-none focus:ring-2 focus:ring-[#5FEDDF] focus:ring-opacity-50 shadow-md"
                onClick={() => onCellClick(index)}
              >
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
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default GameBoard
