import crypto from 'crypto'

// Function to derive encryption key using SHA-256
export const deriveEncryptionKey = (input: string): Buffer => {
  return crypto.createHash('sha256').update(input).digest()
}

// Function to encrypt data using AES-256-CBC
export const encryptData = (data: string, key: Buffer): string => {
  const iv = crypto.randomBytes(16) // Generate a random IV
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv)
  const encrypted = Buffer.concat([cipher.update(data), cipher.final()])
  return `${iv.toString('hex')}:${encrypted.toString('hex')}` // Store IV along with the encrypted data
}

// Function to decrypt data using AES-256-CBC
export const decryptData = (encryptedData: string, key: Buffer): string => {
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

export const getPlayLetter = (game: any, address: string) => {
  if (game && game[0] === address) {
    return 'X'
  } else {
    return 'O'
  }
}

//return false when no winning moves left
export function canStillWin(board: readonly number[]) {
  // Winning positions (row, column, and diagonals)
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

  // Check if the board is full (no 0 left)
  if (!board.includes(0)) return false

  // Check if there is at least one possible winning line
  for (let pattern of winPatterns) {
    const values = pattern.map((index) => board[index])
    const uniqueValues = new Set(values)

    // A line is winnable if it contains only 0s and at most one player (1 or 2)
    uniqueValues.delete(0)
    if (uniqueValues.size <= 1) return true
  }

  return false // No winning move left
}
