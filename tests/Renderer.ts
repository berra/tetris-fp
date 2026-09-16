import * as fc from 'fast-check'
import {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  Board,
  Cell,
  TETROMINO_IDS,
  TETROMINO_SHAPES,
  TetrominoId,
  emptyBoard,
  initialFrame,
  initialScreen,
  playingFrame,
  renderFrame,
  renderGameOverScreen,
  renderMobileFrame,
  renderScreen,
  renderStartScreen,
  SCREEN_COLUMNS,
  SCREEN_ROWS,
} from '../src'

const tetrominoId: fc.Arbitrary<TetrominoId> = fc.constantFrom(
  'I',
  'O',
  'T',
  'S',
  'Z',
  'J',
  'L'
)
const cell: fc.Arbitrary<Cell> = fc.option(tetrominoId, { nil: null })
const board: fc.Arbitrary<Board> = fc.array(
  fc.array(cell, { minLength: BOARD_WIDTH, maxLength: BOARD_WIDTH }),
  {
    minLength: BOARD_HEIGHT,
    maxLength: BOARD_HEIGHT,
  }
)

const gameScreen = fc.record({
  board,
  active: fc.constant(null),
  next: fc.option(tetrominoId, { nil: null }),
  score: fc.nat(),
  level: fc.nat(),
  lines: fc.nat(),
  highScore: fc.nat(),
})

describe('renderScreen', () => {
  it('always renders exactly SCREEN_ROWS lines of SCREEN_COLUMNS characters, matching a Game Boy screen', () => {
    fc.assert(
      fc.property(gameScreen, (screen) => {
        const lines = renderScreen(screen).split('\n')
        expect(lines.length).toBe(SCREEN_ROWS)
        lines.forEach((line) => expect(line.length).toBe(SCREEN_COLUMNS))
      })
    )
  })

  it('renders an empty board as all dots in the playfield columns', () => {
    const lines = renderScreen({
      board: emptyBoard,
      active: null,
      next: null,
      score: 0,
      level: 1,
      lines: 0,
      highScore: 0,
    }).split('\n')
    lines.forEach((line) =>
      expect(line.slice(0, BOARD_WIDTH)).toBe('.'.repeat(BOARD_WIDTH))
    )
  })

  it('renders a settled block using its Tetromino letter', () => {
    const board = emptyBoard.map((row, y) =>
      y === 0 ? row.map((c, x) => (x === 0 ? 'T' : c)) : row
    )
    const lines = renderScreen({
      board,
      active: null,
      next: null,
      score: 0,
      level: 1,
      lines: 0,
      highScore: 0,
    }).split('\n')
    expect(lines[0]?.[0]).toBe('T')
  })

  it('overlays the active piece over the board using its Tetromino letter', () => {
    const lines = renderScreen({
      board: emptyBoard,
      active: {
        id: 'O',
        cells: [
          [0, 0],
          [1, 0],
          [0, 1],
          [1, 1],
        ],
      },
      next: null,
      score: 0,
      level: 1,
      lines: 0,
      highScore: 0,
    }).split('\n')
    expect(lines[0]?.slice(0, 2)).toBe('OO')
    expect(lines[1]?.slice(0, 2)).toBe('OO')
  })
})

describe('renderScreen next-piece preview', () => {
  const previewRowFor = (id: TetrominoId, y: number): string =>
    Array.from({ length: 4 }, (_, x) =>
      TETROMINO_SHAPES[id].some(([sx, sy]) => sx === x && sy === y) ? id : '.'
    ).join('')

  it('draws the shape of the next piece in the sidebar, for every piece', () => {
    TETROMINO_IDS.forEach((id) => {
      const lines = renderScreen({ ...initialScreen, next: id }).split('\n')
      expect(lines[1]?.slice(BOARD_WIDTH, BOARD_WIDTH + 4)).toBe(
        previewRowFor(id, 0)
      )
      expect(lines[2]?.slice(BOARD_WIDTH, BOARD_WIDTH + 4)).toBe(
        previewRowFor(id, 1)
      )
    })
  })

  it('draws a blank preview when there is no next piece queued yet', () => {
    const lines = renderScreen({ ...initialScreen, next: null }).split('\n')
    expect(lines[1]?.slice(BOARD_WIDTH, BOARD_WIDTH + 4)).toBe('....')
    expect(lines[2]?.slice(BOARD_WIDTH, BOARD_WIDTH + 4)).toBe('....')
  })

  it('pushes score/level/lines down to make room for the preview', () => {
    const lines = renderScreen({
      ...initialScreen,
      next: 'T',
      score: 5,
      level: 2,
      lines: 3,
      highScore: 99,
    }).split('\n')
    const sidebarLine = (i: number) => lines[i]?.slice(BOARD_WIDTH).trim()
    expect(sidebarLine(0)).toBe('NEXT')
    expect(sidebarLine(5)).toBe('SCORE')
    expect(sidebarLine(6)).toBe('5')
    expect(sidebarLine(8)).toBe('LEVEL')
    expect(sidebarLine(9)).toBe('2')
    expect(sidebarLine(11)).toBe('LINES')
    expect(sidebarLine(12)).toBe('3')
    expect(sidebarLine(14)).toBe('HIGH SCORE')
    expect(sidebarLine(15)).toBe('99')
  })
})

describe('renderStartScreen', () => {
  it('renders exactly SCREEN_ROWS lines of SCREEN_COLUMNS characters, matching a Game Boy screen', () => {
    const lines = renderStartScreen().split('\n')
    expect(lines.length).toBe(SCREEN_ROWS)
    lines.forEach((line) => expect(line.length).toBe(SCREEN_COLUMNS))
  })

  it('tells the player to press any key to start', () => {
    const text = renderStartScreen()
    expect(text).toContain('PRESS ANY KEY')
    expect(text).toContain('TO START')
  })
})

describe('renderGameOverScreen', () => {
  it('renders exactly SCREEN_ROWS lines of SCREEN_COLUMNS characters, matching a Game Boy screen', () => {
    const lines = renderGameOverScreen(0).split('\n')
    expect(lines.length).toBe(SCREEN_ROWS)
    lines.forEach((line) => expect(line.length).toBe(SCREEN_COLUMNS))
  })

  it('announces game over, the score, and how to try again', () => {
    const text = renderGameOverScreen(1234)
    expect(text).toContain('GAME OVER')
    expect(text).toContain('SCORE: 1234')
    expect(text).toContain('PRESS ANY KEY')
    expect(text).toContain('TO TRY AGAIN')
  })
})

describe('renderFrame', () => {
  it('renders the start screen while mode is "start"', () => {
    expect(renderFrame(initialFrame)).toBe(renderStartScreen())
  })

  it('renders the game screen while mode is "playing"', () => {
    expect(renderFrame(playingFrame)).toBe(renderScreen(playingFrame.screen))
  })

  it('renders the game-over screen while mode is "gameOver"', () => {
    const screen = { ...initialScreen, score: 99 }
    expect(renderFrame({ mode: 'gameOver', screen })).toBe(
      renderGameOverScreen(99)
    )
  })

  it('renders the same game screen, unchanged, while mode is "paused"', () => {
    const pausedFrame = { mode: 'paused' as const, screen: playingFrame.screen }
    expect(renderFrame(pausedFrame)).toBe(renderScreen(playingFrame.screen))
  })
})

describe('renderMobileFrame', () => {
  it('always renders exactly SCREEN_ROWS lines of BOARD_WIDTH characters', () => {
    ;[
      initialFrame,
      playingFrame,
      { mode: 'paused' as const, screen: initialScreen },
      { mode: 'gameOver' as const, screen: initialScreen },
    ].forEach((frame) => {
      const lines = renderMobileFrame(frame).split('\n')
      expect(lines.length).toBe(SCREEN_ROWS)
      lines.forEach((line) => expect(line.length).toBe(BOARD_WIDTH))
    })
  })

  it('re-centers the title message for BOARD_WIDTH, rather than clipping renderStartScreen', () => {
    const naiveSlice = renderStartScreen()
      .split('\n')
      .map((line) => line.slice(0, BOARD_WIDTH))
      .join('\n')
    const mobileText = renderMobileFrame(initialFrame)
    // clipping "TETRIS" out of the middle of a wider centering would
    // have garbled it (e.g. down to just "TET") — this must not match.
    expect(mobileText).not.toBe(naiveSlice)
    expect(mobileText).toContain('TETRIS')
  })

  it('re-centers the game-over message for BOARD_WIDTH too', () => {
    const gameOverFrame = {
      mode: 'gameOver' as const,
      screen: { ...initialScreen, score: 42 },
    }
    expect(renderMobileFrame(gameOverFrame)).toContain('GAME OVER')
  })

  it('matches the playfield columns of renderScreen while playing', () => {
    const lines = renderMobileFrame(playingFrame).split('\n')
    const fullLines = renderScreen(playingFrame.screen).split('\n')
    lines.forEach((line, y) => {
      expect(line).toBe(fullLines[y]?.slice(0, BOARD_WIDTH))
    })
  })
})
