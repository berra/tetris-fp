import * as fc from 'fast-check'
import {
  Position,
  TETROMINO_IDS,
  isPieceCell,
  rotationCandidates,
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
      orientation: 0 as const,
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
      orientation: 0 as const,
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
      orientation: 0 as const,
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

describe('rotationCandidates', () => {
  // The plain in-place rotation is always the first candidate tried —
  // these properties are about the rotation geometry itself, not which
  // wall kick (if any) a real board would need, so it's the only one
  // that matters here.
  const naiveRotate =
    (direction: 'cw' | 'ccw') =>
    (piece: ReturnType<typeof spawnPiece>): ReturnType<typeof spawnPiece> => {
      const [naive] = rotationCandidates(direction)(piece)
      if (naive === undefined)
        throw new Error('rotationCandidates returned none')
      return naive
    }

  it('gives O only itself, in either direction', () => {
    const piece = spawnPiece('O')
    expect(rotationCandidates('cw')(piece)).toEqual([piece])
    expect(rotationCandidates('ccw')(piece)).toEqual([piece])
  })

  it('returns every piece to its original shape and orientation after 4 clockwise turns', () => {
    fc.assert(
      fc.property(fc.constantFrom(...TETROMINO_IDS), (id) => {
        const original = spawnPiece(id)
        let piece = original
        for (let i = 0; i < 4; i++) piece = naiveRotate('cw')(piece)
        expect(cellSet(piece.cells)).toEqual(cellSet(original.cells))
        expect(piece.orientation).toBe(original.orientation)
      })
    )
  })

  it('undoes a clockwise turn with a counter-clockwise one', () => {
    fc.assert(
      fc.property(fc.constantFrom(...TETROMINO_IDS), (id) => {
        const original = spawnPiece(id)
        const roundTrip = naiveRotate('ccw')(naiveRotate('cw')(original))
        expect(cellSet(roundTrip.cells)).toEqual(cellSet(original.cells))
        expect(roundTrip.orientation).toBe(original.orientation)
      })
    )
  })

  it('always offers 4 connected cells for every candidate, never collapsing the shape', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...TETROMINO_IDS),
        fc.constantFrom('cw' as const, 'ccw' as const),
        (id, direction) => {
          rotationCandidates(direction)(spawnPiece(id)).forEach((candidate) => {
            expect(cellSet(candidate.cells).length).toBe(4)
          })
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
