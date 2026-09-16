import * as fc from 'fast-check'
import {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  collides,
  emptyBoard,
  isWithinBounds,
} from '../src'

const inBoundsPosition = fc.tuple(
  fc.integer({ min: 0, max: BOARD_WIDTH - 1 }),
  fc.integer({ min: 0, max: BOARD_HEIGHT - 1 })
)

describe('isWithinBounds', () => {
  it('accepts every position inside the playfield', () => {
    fc.assert(
      fc.property(inBoundsPosition, (p) => expect(isWithinBounds(p)).toBe(true))
    )
  })

  it('rejects negative columns, negative rows, and anything past the edges', () => {
    expect(isWithinBounds([-1, 0])).toBe(false)
    expect(isWithinBounds([0, -1])).toBe(false)
    expect(isWithinBounds([BOARD_WIDTH, 0])).toBe(false)
    expect(isWithinBounds([0, BOARD_HEIGHT])).toBe(false)
  })
})

describe('collides', () => {
  it('never collides on an empty board, for any in-bounds positions', () => {
    fc.assert(
      fc.property(fc.array(inBoundsPosition), (positions) =>
        expect(collides(emptyBoard)(positions)).toBe(false)
      )
    )
  })

  it('collides as soon as one position is out of bounds', () => {
    expect(
      collides(emptyBoard)([
        [0, 0],
        [-1, 0],
      ])
    ).toBe(true)
  })

  it('collides with a settled block', () => {
    const board = emptyBoard.map((row, y) =>
      y === 0 ? row.map((c, x) => (x === 0 ? 'T' : c)) : row
    )
    expect(collides(board)([[0, 0]])).toBe(true)
    expect(collides(board)([[1, 0]])).toBe(false)
  })
})
