import * as fc from 'fast-check'
import {
  BOARD_WIDTH,
  Position,
  TETROMINO_IDS,
  TETROMINO_ROTATIONS,
  TETROMINO_SHAPES,
  spawnPiece,
  randomTetrominoId,
} from '../src'

const cellSet = (cells: ReadonlyArray<Position>): ReadonlyArray<string> =>
  cells.map(([x, y]) => `${x},${y}`).sort()

describe('spawnPiece', () => {
  it('always spawns exactly 4 cells, all within the board width and near the top', () => {
    fc.assert(
      fc.property(fc.constantFrom(...TETROMINO_IDS), (id) => {
        const piece = spawnPiece(id)
        expect(piece.id).toBe(id)
        expect(piece.cells.length).toBe(4)
        piece.cells.forEach(([x, y]) => {
          expect(x).toBeGreaterThanOrEqual(0)
          expect(x).toBeLessThan(BOARD_WIDTH)
          expect(y).toBeGreaterThanOrEqual(0)
          expect(y).toBeLessThan(2)
        })
      })
    )
  })
})

describe('TETROMINO_ROTATIONS', () => {
  it("starts every piece's state 0 at its spawn shape", () => {
    TETROMINO_IDS.forEach((id) => {
      expect(cellSet(TETROMINO_ROTATIONS[id][0])).toEqual(
        cellSet(TETROMINO_SHAPES[id])
      )
    })
  })

  it('gives every state exactly 4 cells, for every piece', () => {
    TETROMINO_IDS.forEach((id) => {
      TETROMINO_ROTATIONS[id].forEach((shape) => {
        expect(shape.length).toBe(4)
      })
    })
  })

  it('keeps O identical in every state, since a square looks the same rotated', () => {
    const [state0, ...rest] = TETROMINO_ROTATIONS.O
    rest.forEach((shape) => expect(cellSet(shape)).toEqual(cellSet(state0)))
  })

  it("matches the Super Rotation System's T shapes", () => {
    const [state0, stateR, state2, stateL] = TETROMINO_ROTATIONS.T
    expect(cellSet(state0 ?? [])).toEqual(
      cellSet([
        [1, 0],
        [0, 1],
        [1, 1],
        [2, 1],
      ])
    )
    expect(cellSet(stateR ?? [])).toEqual(
      cellSet([
        [1, 0],
        [1, 1],
        [1, 2],
        [2, 1],
      ])
    )
    expect(cellSet(state2 ?? [])).toEqual(
      cellSet([
        [0, 1],
        [1, 1],
        [1, 2],
        [2, 1],
      ])
    )
    expect(cellSet(stateL ?? [])).toEqual(
      cellSet([
        [0, 1],
        [1, 0],
        [1, 1],
        [1, 2],
      ])
    )
  })

  it("matches the Super Rotation System's I shapes, including the row shift between state 0 and 2", () => {
    const [state0, stateR, state2, stateL] = TETROMINO_ROTATIONS.I
    expect(cellSet(state0 ?? [])).toEqual(
      cellSet([
        [0, 1],
        [1, 1],
        [2, 1],
        [3, 1],
      ])
    )
    expect(cellSet(stateR ?? [])).toEqual(
      cellSet([
        [2, 0],
        [2, 1],
        [2, 2],
        [2, 3],
      ])
    )
    // I is the one piece whose 180° state doesn't share a row with its
    // spawn state — row 2 here, not row 1.
    expect(cellSet(state2 ?? [])).toEqual(
      cellSet([
        [0, 2],
        [1, 2],
        [2, 2],
        [3, 2],
      ])
    )
    expect(cellSet(stateL ?? [])).toEqual(
      cellSet([
        [1, 0],
        [1, 1],
        [1, 2],
        [1, 3],
      ])
    )
  })
})

describe('randomTetrominoId', () => {
  it('always draws one of the seven Tetromino ids', () => {
    for (let i = 0; i < 50; i++) {
      expect(TETROMINO_IDS).toContain(randomTetrominoId())
    }
  })
})
