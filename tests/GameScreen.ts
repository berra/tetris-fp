import { BOARD_HEIGHT, BOARD_WIDTH, INITIAL_LEVEL, initialScreen } from '../src'

describe('initialScreen', () => {
  it('starts with an empty, full-size board and no active or queued piece', () => {
    expect(initialScreen.board.length).toBe(BOARD_HEIGHT)
    expect(initialScreen.board.every((row) => row.length === BOARD_WIDTH)).toBe(
      true
    )
    expect(
      initialScreen.board.every((row) => row.every((cell) => cell === null))
    ).toBe(true)
    expect(initialScreen.active).toBeNull()
    expect(initialScreen.next).toBeNull()
  })

  it('starts with a clean score, lines and high score, at INITIAL_LEVEL', () => {
    expect(initialScreen.score).toBe(0)
    expect(initialScreen.lines).toBe(0)
    expect(initialScreen.highScore).toBe(0)
    expect(initialScreen.level).toBe(INITIAL_LEVEL)
  })
})
