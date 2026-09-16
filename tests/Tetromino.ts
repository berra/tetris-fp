import * as fc from 'fast-check'
import {
  BOARD_WIDTH,
  TETROMINO_IDS,
  spawnPiece,
  randomTetrominoId,
} from '../src'

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

describe('randomTetrominoId', () => {
  it('always draws one of the seven Tetromino ids', () => {
    for (let i = 0; i < 50; i++) {
      expect(TETROMINO_IDS).toContain(randomTetrominoId())
    }
  })
})
