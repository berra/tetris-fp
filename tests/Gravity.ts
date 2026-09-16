import {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  INITIAL_LEVEL,
  LINES_PER_LEVEL,
  emptyBoard,
  hardDrop,
  initialScreen,
  moveLeft,
  moveRight,
  playingFrame,
  rotateClockwise,
  rotateCounterClockwise,
  spawn,
  spawnPiece,
  step,
  tick,
  tickFrame,
} from '../src'

describe('spawn', () => {
  it('sets the active piece when there is none', () => {
    const screen = spawn('T')(initialScreen)
    expect(screen.active).toEqual(spawnPiece('T'))
  })

  it('leaves an existing active piece alone', () => {
    const withActive = spawn('T')(initialScreen)
    const screen = spawn('O')(withActive)
    expect(screen.active).toEqual(spawnPiece('T'))
  })

  it('refuses to spawn on top of a full stack, leaving active null', () => {
    const fullBoard = emptyBoard.map((row) => row.map(() => 'I' as const))
    const screen = spawn('T')({ ...initialScreen, board: fullBoard })
    expect(screen.active).toBeNull()
  })
})

describe('step', () => {
  it('does nothing when there is no active piece', () => {
    expect(step(initialScreen)).toEqual(initialScreen)
  })

  it('drops the active piece by one row when the way is clear', () => {
    const screen = spawn('O')(initialScreen)
    const stepped = step(screen)
    expect(stepped.active?.cells).toEqual(
      screen.active?.cells.map(([x, y]) => [x, y + 1])
    )
    expect(stepped.board).toEqual(initialScreen.board)
  })

  it('locks the piece into the board and clears active once it hits the floor', () => {
    const piece = {
      id: 'O' as const,
      cells: [
        [4, BOARD_HEIGHT - 2],
        [5, BOARD_HEIGHT - 2],
        [4, BOARD_HEIGHT - 1],
        [5, BOARD_HEIGHT - 1],
      ] as const,
    }
    const screen = { ...initialScreen, active: piece }
    const stepped = step(screen)
    expect(stepped.active).toBeNull()
    expect(stepped.board[BOARD_HEIGHT - 1]?.[4]).toBe('O')
    expect(stepped.board[BOARD_HEIGHT - 1]?.[5]).toBe('O')
    expect(stepped.board[BOARD_HEIGHT - 2]?.[4]).toBe('O')
  })

  it('locks the piece when it would land on an already-settled block', () => {
    const board = emptyBoard.map((row, y) =>
      y === 5 ? row.map((c, x) => (x === 4 ? 'I' : c)) : row
    )
    const piece = {
      id: 'O' as const,
      cells: [
        [4, 3],
        [5, 3],
        [4, 4],
        [5, 4],
      ] as const,
    }
    const stepped = step({ ...initialScreen, board, active: piece })
    expect(stepped.active).toBeNull()
    expect(stepped.board[4]?.[4]).toBe('O')
  })

  it('awards no score or lines when locking completes no full row', () => {
    const piece = {
      id: 'O' as const,
      cells: [
        [4, BOARD_HEIGHT - 2],
        [5, BOARD_HEIGHT - 2],
        [4, BOARD_HEIGHT - 1],
        [5, BOARD_HEIGHT - 1],
      ] as const,
    }
    const stepped = step({ ...initialScreen, active: piece })
    expect(stepped.score).toBe(0)
    expect(stepped.lines).toBe(0)
  })

  it('clears a completed line, scores it, and drops the rest of the stack down', () => {
    const almostFullRow = emptyBoard[0]?.map((_, x) =>
      x === 4 || x === 5 ? null : 'I'
    )
    const board = emptyBoard.map((row, y) =>
      y === BOARD_HEIGHT - 1 ? almostFullRow ?? row : row
    )
    const piece = {
      id: 'O' as const,
      cells: [
        [4, BOARD_HEIGHT - 2],
        [5, BOARD_HEIGHT - 2],
        [4, BOARD_HEIGHT - 1],
        [5, BOARD_HEIGHT - 1],
      ] as const,
    }
    const stepped = step({ ...initialScreen, board, active: piece })
    expect(stepped.score).toBe(40) // single, at level 1
    expect(stepped.lines).toBe(1)
    // the row that used to sit just above the cleared one (with the O's
    // top half) has dropped down to become the new bottom row
    expect(stepped.board[BOARD_HEIGHT - 1]?.[4]).toBe('O')
    expect(stepped.board[BOARD_HEIGHT - 1]?.[5]).toBe('O')
    expect(stepped.board[BOARD_HEIGHT - 1]?.[0]).toBeNull()
    expect(stepped.board[0]).toEqual(emptyBoard[0])
  })

  it('clears multiple completed lines at once and scores them together', () => {
    const almostFullRow = emptyBoard[0]?.map((_, x) =>
      x === 4 || x === 5 ? null : 'I'
    )
    const board = emptyBoard.map((row, y) =>
      y === BOARD_HEIGHT - 1 || y === BOARD_HEIGHT - 2
        ? almostFullRow ?? row
        : row
    )
    const piece = {
      id: 'O' as const,
      cells: [
        [4, BOARD_HEIGHT - 2],
        [5, BOARD_HEIGHT - 2],
        [4, BOARD_HEIGHT - 1],
        [5, BOARD_HEIGHT - 1],
      ] as const,
    }
    const stepped = step({ ...initialScreen, board, active: piece })
    expect(stepped.score).toBe(100) // double, at level 1
    expect(stepped.lines).toBe(2)
    expect(stepped.board).toEqual(emptyBoard)
  })

  it('levels up once the running total crosses a LINES_PER_LEVEL threshold', () => {
    const almostFullRow = emptyBoard[0]?.map((_, x) =>
      x === 4 || x === 5 ? null : 'I'
    )
    const board = emptyBoard.map((row, y) =>
      y === BOARD_HEIGHT - 1 ? almostFullRow ?? row : row
    )
    const piece = {
      id: 'O' as const,
      cells: [
        [4, BOARD_HEIGHT - 2],
        [5, BOARD_HEIGHT - 2],
        [4, BOARD_HEIGHT - 1],
        [5, BOARD_HEIGHT - 1],
      ] as const,
    }
    const screen = {
      ...initialScreen,
      board,
      active: piece,
      lines: LINES_PER_LEVEL - 1,
    }
    const stepped = step(screen)
    expect(stepped.lines).toBe(LINES_PER_LEVEL)
    expect(stepped.level).toBe(INITIAL_LEVEL + 1)
    // scored at the level this clear happened at, not the level it leveled up to
    expect(stepped.score).toBe(40 * INITIAL_LEVEL)
  })
})

describe('hardDrop', () => {
  it('does nothing when there is no active piece', () => {
    expect(hardDrop(initialScreen)).toEqual(initialScreen)
  })

  it('drops the piece straight to the floor and locks it in one go', () => {
    const screen = spawn('O')(initialScreen)
    const dropped = hardDrop(screen)
    expect(dropped.active).toBeNull()
    expect(dropped.board[BOARD_HEIGHT - 1]?.[4]).toBe('O')
    expect(dropped.board[BOARD_HEIGHT - 1]?.[5]).toBe('O')
    expect(dropped.board[BOARD_HEIGHT - 2]?.[4]).toBe('O')
    expect(dropped.board[BOARD_HEIGHT - 2]?.[5]).toBe('O')
  })

  it('stops on top of a settled block instead of passing through it', () => {
    const board = emptyBoard.map((row, y) =>
      y === 10 ? row.map((c, x) => (x === 4 || x === 5 ? 'I' : c)) : row
    )
    const piece = {
      id: 'O' as const,
      cells: [
        [4, 0],
        [5, 0],
        [4, 1],
        [5, 1],
      ] as const,
    }
    const dropped = hardDrop({ ...initialScreen, board, active: piece })
    expect(dropped.active).toBeNull()
    expect(dropped.board[9]?.[4]).toBe('O')
    expect(dropped.board[9]?.[5]).toBe('O')
    expect(dropped.board[10]?.[4]).toBe('I')
  })

  it('locks in place immediately when already resting on the floor', () => {
    const piece = {
      id: 'O' as const,
      cells: [
        [4, BOARD_HEIGHT - 2],
        [5, BOARD_HEIGHT - 2],
        [4, BOARD_HEIGHT - 1],
        [5, BOARD_HEIGHT - 1],
      ] as const,
    }
    const dropped = hardDrop({ ...initialScreen, active: piece })
    expect(dropped.active).toBeNull()
    expect(dropped.board[BOARD_HEIGHT - 1]?.[4]).toBe('O')
  })

  it('clears and scores completed lines the same way step does', () => {
    const almostFullRow = emptyBoard[0]?.map((_, x) =>
      x === 4 || x === 5 ? null : 'I'
    )
    const board = emptyBoard.map((row, y) =>
      y === BOARD_HEIGHT - 1 ? almostFullRow ?? row : row
    )
    const piece = {
      id: 'O' as const,
      cells: [
        [4, 0],
        [5, 0],
        [4, 1],
        [5, 1],
      ] as const,
    }
    const dropped = hardDrop({ ...initialScreen, board, active: piece })
    expect(dropped.score).toBe(40)
    expect(dropped.lines).toBe(1)
  })
})

describe('moveLeft', () => {
  it('does nothing when there is no active piece', () => {
    expect(moveLeft(initialScreen)).toEqual(initialScreen)
  })

  it('shifts the active piece one column left when the way is clear', () => {
    const screen = spawn('O')(initialScreen)
    const moved = moveLeft(screen)
    expect(moved.active?.cells).toEqual(
      screen.active?.cells.map(([x, y]) => [x - 1, y])
    )
  })

  it('refuses to move past the left wall', () => {
    const piece = {
      id: 'O' as const,
      cells: [
        [0, 0],
        [1, 0],
        [0, 1],
        [1, 1],
      ] as const,
    }
    const screen = { ...initialScreen, active: piece }
    expect(moveLeft(screen)).toEqual(screen)
  })

  it('refuses to move onto a settled block', () => {
    const board = emptyBoard.map((row, y) =>
      y === 0 ? row.map((c, x) => (x === 2 ? 'I' : c)) : row
    )
    const piece = {
      id: 'O' as const,
      cells: [
        [3, 0],
        [4, 0],
        [3, 1],
        [4, 1],
      ] as const,
    }
    const screen = { ...initialScreen, board, active: piece }
    expect(moveLeft(screen)).toEqual(screen)
  })
})

describe('moveRight', () => {
  it('shifts the active piece one column right when the way is clear', () => {
    const screen = spawn('O')(initialScreen)
    const moved = moveRight(screen)
    expect(moved.active?.cells).toEqual(
      screen.active?.cells.map(([x, y]) => [x + 1, y])
    )
  })

  it('refuses to move past the right wall', () => {
    const piece = {
      id: 'O' as const,
      cells: [
        [BOARD_WIDTH - 2, 0],
        [BOARD_WIDTH - 1, 0],
        [BOARD_WIDTH - 2, 1],
        [BOARD_WIDTH - 1, 1],
      ] as const,
    }
    const screen = { ...initialScreen, active: piece }
    expect(moveRight(screen)).toEqual(screen)
  })
})

describe('rotateClockwise / rotateCounterClockwise', () => {
  it('does nothing when there is no active piece', () => {
    expect(rotateClockwise(initialScreen)).toEqual(initialScreen)
    expect(rotateCounterClockwise(initialScreen)).toEqual(initialScreen)
  })

  it('rotates the active piece when the way is clear', () => {
    const screen = spawn('T')(initialScreen)
    const rotated = rotateClockwise(screen)
    expect(rotated.active?.id).toBe('T')
    expect(rotated.active?.cells).not.toEqual(screen.active?.cells)
  })

  it('refuses to rotate past the top of the board', () => {
    const piece = {
      id: 'I' as const,
      cells: [
        [0, 0],
        [1, 0],
        [2, 0],
        [3, 0],
      ] as const,
    }
    const screen = { ...initialScreen, active: piece }
    // Rotating this horizontal I 90° would swing a cell above row 0.
    expect(rotateClockwise(screen)).toEqual(screen)
  })
})

describe('tick', () => {
  it('spawns a piece when there is none yet', () => {
    const screen = tick('L')(initialScreen)
    expect(screen.active).toEqual(spawnPiece('L'))
  })

  it('drops an existing piece instead of spawning another', () => {
    const withActive = spawn('L')(initialScreen)
    const screen = tick('O')(withActive)
    expect(screen.active?.id).toBe('L')
    expect(screen.active?.cells).toEqual(
      withActive.active?.cells.map(([x, y]) => [x, y + 1])
    )
  })

  it('spawns the next piece the same tick a piece locks', () => {
    const piece = {
      id: 'O' as const,
      cells: [
        [4, BOARD_HEIGHT - 2],
        [5, BOARD_HEIGHT - 2],
        [4, BOARD_HEIGHT - 1],
        [5, BOARD_HEIGHT - 1],
      ] as const,
    }
    const screen = tick('L')({ ...initialScreen, active: piece })
    expect(screen.board[BOARD_HEIGHT - 1]?.[4]).toBe('O')
    expect(screen.active).toEqual(spawnPiece('L'))
  })

  it('spawns whatever was already queued in `next`, not the freshly drawn id', () => {
    const screen = tick('O')({ ...initialScreen, next: 'L' })
    expect(screen.active).toEqual(spawnPiece('L'))
  })

  it('queues the freshly drawn id as the new `next` once a piece spawns', () => {
    const screen = tick('O')({ ...initialScreen, next: 'L' })
    expect(screen.next).toBe('O')
  })

  it('leaves `next` alone while a piece is still falling', () => {
    const withActive = spawn('L')({ ...initialScreen, next: 'S' })
    const screen = tick('O')(withActive)
    expect(screen.next).toBe('S')
  })

  it('falls back to the drawn id when `next` was never seeded (bootstrap)', () => {
    const screen = tick('L')(initialScreen)
    expect(screen.active).toEqual(spawnPiece('L'))
    expect(screen.next).toBe('L')
  })

  it('rotates the queue correctly across a full lock-and-respawn cycle', () => {
    // starting state: an 'O' resting right on the floor, 'S' queued as next
    const piece = {
      id: 'O' as const,
      cells: [
        [4, BOARD_HEIGHT - 2],
        [5, BOARD_HEIGHT - 2],
        [4, BOARD_HEIGHT - 1],
        [5, BOARD_HEIGHT - 1],
      ] as const,
    }
    const beforeLock = { ...initialScreen, active: piece, next: 'S' as const }

    // the 'O' locks; 'S' (the old `next`) becomes active, and the freshly
    // drawn 'Z' takes its place as the new `next`
    const afterLock = tick('Z')(beforeLock)
    expect(afterLock.active).toEqual(spawnPiece('S'))
    expect(afterLock.next).toBe('Z')
  })
})

describe('tickFrame', () => {
  it('does nothing while not playing', () => {
    const startFrame = { mode: 'start' as const, screen: initialScreen }
    expect(tickFrame('T')(startFrame)).toEqual(startFrame)

    const gameOverFrame = { mode: 'gameOver' as const, screen: initialScreen }
    expect(tickFrame('T')(gameOverFrame)).toEqual(gameOverFrame)
  })

  it('stays playing and spawns a piece when there is room', () => {
    const frame = tickFrame('T')(playingFrame)
    expect(frame.mode).toBe('playing')
    expect(frame.screen.active).toEqual(spawnPiece('T'))
  })

  it('switches to gameOver the moment a spawn is refused', () => {
    const fullBoard = emptyBoard.map((row) => row.map(() => 'I' as const))
    const frame = tickFrame('T')({
      mode: 'playing',
      screen: { ...initialScreen, board: fullBoard },
    })
    expect(frame.mode).toBe('gameOver')
    expect(frame.screen.active).toBeNull()
  })

  it('keeps the final score and board once the game is over', () => {
    const fullBoard = emptyBoard.map((row) => row.map(() => 'I' as const))
    const overScreen = { ...initialScreen, board: fullBoard, score: 42 }
    const frame = tickFrame('T')({ mode: 'playing', screen: overScreen })
    expect(frame.mode).toBe('gameOver')
    expect(frame.screen.score).toBe(42)
    expect(frame.screen.board).toEqual(fullBoard)
  })
})
