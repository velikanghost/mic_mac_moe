export const mmmAbi = [
  {
    type: 'function',
    name: 'createGame',
    inputs: [
      {
        name: 'player2',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'player1',
        type: 'address',
        internalType: 'address',
      },
    ],
    outputs: [
      {
        name: 'gameId',
        type: 'bytes32',
        internalType: 'bytes32',
      },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'games',
    inputs: [
      {
        name: '',
        type: 'bytes32',
        internalType: 'bytes32',
      },
    ],
    outputs: [
      {
        name: 'player1',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'player2',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'currentTurn',
        type: 'address',
        internalType: 'address',
      },
      {
        name: 'state',
        type: 'uint8',
        internalType: 'enum MicMacMoe.GameState',
      },
      {
        name: 'winner',
        type: 'address',
        internalType: 'address',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getBoard',
    inputs: [
      {
        name: 'gameId',
        type: 'bytes32',
        internalType: 'bytes32',
      },
    ],
    outputs: [
      {
        name: '',
        type: 'uint8[9]',
        internalType: 'uint8[9]',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getPlayerGames',
    inputs: [
      {
        name: 'player',
        type: 'address',
        internalType: 'address',
      },
    ],
    outputs: [
      {
        name: '',
        type: 'bytes32[]',
        internalType: 'bytes32[]',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'makeMove',
    inputs: [
      {
        name: 'gameId',
        type: 'bytes32',
        internalType: 'bytes32',
      },
      {
        name: 'position',
        type: 'uint8',
        internalType: 'uint8',
      },
      {
        name: 'player',
        type: 'address',
        internalType: 'address',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'playerGames',
    inputs: [
      {
        name: '',
        type: 'address',
        internalType: 'address',
      },
      {
        name: '',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [
      {
        name: '',
        type: 'bytes32',
        internalType: 'bytes32',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'event',
    name: 'GameCreated',
    inputs: [
      {
        name: 'gameId',
        type: 'bytes32',
        indexed: true,
        internalType: 'bytes32',
      },
      {
        name: 'player1',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
      {
        name: 'player2',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'GameEnded',
    inputs: [
      {
        name: 'gameId',
        type: 'bytes32',
        indexed: true,
        internalType: 'bytes32',
      },
      {
        name: 'state',
        type: 'uint8',
        indexed: false,
        internalType: 'enum MicMacMoe.GameState',
      },
      {
        name: 'winner',
        type: 'address',
        indexed: false,
        internalType: 'address',
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'MoveMade',
    inputs: [
      {
        name: 'gameId',
        type: 'bytes32',
        indexed: true,
        internalType: 'bytes32',
      },
      {
        name: 'player',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
      {
        name: 'position',
        type: 'uint8',
        indexed: false,
        internalType: 'uint8',
      },
    ],
    anonymous: false,
  },
] as const
