import * as fc from 'fast-check'
import {
  BOARD_HEIGHT,
  clearRows,
  emptyBoard,
  findFullRows,
  scoreForLines,
} from '../src'

const fillRow = (board: typeof emptyBoard, y: number) =>
  board.map((row, rowIndex) =>
    rowIndex === y ? row.map(() => 'I' as const) : row
  )

describe('findFullRows', () => {
  it('finds nothing on an empty board', () => {
    expect(findFullRows(emptyBoard)).toEqual([])
  })

  it('finds a single fully-filled row', () => {
    const board = fillRow(emptyBoard, 5)
    expect(findFullRows(board)).toEqual([5])
  })

  it('ignores a row that is missing just one cell', () => {
    const board = fillRow(emptyBoard, 5).map((row, y) =>
      y === 5 ? row.map((c, x) => (x === 0 ? null : c)) : row
    )
    expect(findFullRows(board)).toEqual([])
  })

  it('finds every full row, in order, however many there are', () => {
    fc.assert(
      fc.property(
        fc.uniqueArray(fc.integer({ min: 0, max: BOARD_HEIGHT - 1 }), {
          minLength: 0,
          maxLength: 4,
        }),
        (rows) => {
          const board = rows.reduce(fillRow, emptyBoard)
          expect(findFullRows(board)).toEqual([...rows].sort((a, b) => a - b))
        }
      )
    )
  })
})

describe('clearRows', () => {
  it('returns the board unchanged when there is nothing to clear', () => {
    expect(clearRows(emptyBoard)([])).toBe(emptyBoard)
  })

  it('removes the given rows and pads back up to BOARD_HEIGHT with empty rows on top', () => {
    const board = fillRow(emptyBoard, 5)
    const cleared = clearRows(board)([5])
    expect(cleared.length).toBe(BOARD_HEIGHT)
    expect(findFullRows(cleared)).toEqual([])
    cleared.forEach((row) => row.forEach((cell) => expect(cell).toBeNull()))
  })

  it('drops everything above a cleared row down by one', () => {
    const board = fillRow(fillRow(emptyBoard, 5), 6).map((row, y) =>
      y === 4 ? row.map((c, x) => (x === 0 ? 'T' : c)) : row
    )
    const cleared = clearRows(board)([5, 6])
    // the lone T block that was sitting at row 4 should now be at row 6
    expect(cleared[6]?.[0]).toBe('T')
    expect(findFullRows(cleared)).toEqual([])
  })
})

describe('scoreForLines', () => {
  it('scores 0 for clearing nothing', () => {
    expect(scoreForLines(1)(0)).toBe(0)
  })

  it('scores the classic single/double/triple/tetris values at level 1', () => {
    expect(scoreForLines(1)(1)).toBe(40)
    expect(scoreForLines(1)(2)).toBe(100)
    expect(scoreForLines(1)(3)).toBe(300)
    expect(scoreForLines(1)(4)).toBe(800)
  })

  it('scales linearly with level', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 20 }),
        fc.integer({ min: 0, max: 4 }),
        (level, lines) => {
          expect(scoreForLines(level)(lines)).toBe(
            scoreForLines(1)(lines) * level
          )
        }
      )
    )
  })
})
