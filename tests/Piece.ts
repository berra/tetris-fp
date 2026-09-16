import * as fc from 'fast-check'
import {
  Position,
  TETROMINO_IDS,
  isPieceCell,
  rotate,
  shiftDown,
  shiftLeft,
  shiftRight,
  spawnPiece,
} from '../src'

const cellSet = (cells: ReadonlyArray<Position>): ReadonlyArray<string> =>
  cells.map(([x, y]) => `${x},${y}`).sort()

describe('shiftDown', () => {
  it('moves every cell down by one row, keeping the same id and columns', () => {
    const piece = {
      id: 'O' as const,
      cells: [
        [3, 0],
        [4, 0],
        [3, 1],
        [4, 1],
      ] as const,
    }
    const dropped = shiftDown(piece)
    expect(dropped.id).toBe('O')
    expect(dropped.cells).toEqual([
      [3, 1],
      [4, 1],
      [3, 2],
      [4, 2],
    ])
  })
})

describe('shiftLeft', () => {
  it('moves every cell one column left, keeping rows unchanged', () => {
    const piece = {
      id: 'O' as const,
      cells: [
        [3, 0],
        [4, 0],
        [3, 1],
        [4, 1],
      ] as const,
    }
    expect(shiftLeft(piece).cells).toEqual([
      [2, 0],
      [3, 0],
      [2, 1],
      [3, 1],
    ])
  })
})

describe('shiftRight', () => {
  it('moves every cell one column right, keeping rows unchanged', () => {
    const piece = {
      id: 'O' as const,
      cells: [
        [3, 0],
        [4, 0],
        [3, 1],
        [4, 1],
      ] as const,
    }
    expect(shiftRight(piece).cells).toEqual([
      [4, 0],
      [5, 0],
      [4, 1],
      [5, 1],
    ])
  })
})

describe('rotate', () => {
  it('leaves O unchanged in either direction', () => {
    const piece = spawnPiece('O')
    expect(rotate('cw')(piece)).toEqual(piece)
    expect(rotate('ccw')(piece)).toEqual(piece)
  })

  it('returns every piece to its original shape after 4 clockwise turns', () => {
    fc.assert(
      fc.property(fc.constantFrom(...TETROMINO_IDS), (id) => {
        const original = spawnPiece(id)
        let piece = original
        for (let i = 0; i < 4; i++) piece = rotate('cw')(piece)
        expect(cellSet(piece.cells)).toEqual(cellSet(original.cells))
      })
    )
  })

  it('undoes a clockwise turn with a counter-clockwise one', () => {
    fc.assert(
      fc.property(fc.constantFrom(...TETROMINO_IDS), (id) => {
        const original = spawnPiece(id)
        const roundTrip = rotate('ccw')(rotate('cw')(original))
        expect(cellSet(roundTrip.cells)).toEqual(cellSet(original.cells))
      })
    )
  })

  it('always produces 4 connected cells, never collapsing the shape', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...TETROMINO_IDS),
        fc.constantFrom('cw' as const, 'ccw' as const),
        (id, direction) => {
          const rotated = rotate(direction)(spawnPiece(id))
          expect(cellSet(rotated.cells).length).toBe(4)
        }
      )
    )
  })
})

describe('isPieceCell', () => {
  const piece = {
    id: 'O' as const,
    cells: [
      [3, 0],
      [4, 0],
      [3, 1],
      [4, 1],
    ] as const,
  }

  it("is true for each of the piece's own cells", () => {
    piece.cells.forEach(([x, y]) => expect(isPieceCell(piece)(x, y)).toBe(true))
  })

  it('is false everywhere else', () => {
    expect(isPieceCell(piece)(0, 0)).toBe(false)
    expect(isPieceCell(piece)(5, 1)).toBe(false)
  })
})
