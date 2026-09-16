/** @since 1.0.0 */

import { IO } from 'fp-ts/IO'
import { BOARD_WIDTH, Position, TetrominoId } from './Board'
import { Piece } from './Piece'

// -----------------------------------------------------------------------------
// constants
// -----------------------------------------------------------------------------

/**
 * All seven Tetromino ids.
 *
 * @since 1.0.0
 * @category Constants
 */
export const TETROMINO_IDS: ReadonlyArray<TetrominoId> = [
  'I',
  'O',
  'T',
  'S',
  'Z',
  'J',
  'L',
]

/**
 * Each Tetromino's shape, as `[column, row]` offsets within its 4-wide,
 * 2-tall spawn bounding box (the classic guideline spawn orientations).
 * `spawnPiece` positions this at the top of the board; `renderNextPiece`
 * (see `Renderer`) draws it as-is, unplaced, for the "next piece" preview.
 *
 * @since 1.0.0
 * @category Constants
 */
export const TETROMINO_SHAPES: Record<TetrominoId, ReadonlyArray<Position>> = {
  I: [
    [0, 1],
    [1, 1],
    [2, 1],
    [3, 1],
  ],
  O: [
    [1, 0],
    [2, 0],
    [1, 1],
    [2, 1],
  ],
  T: [
    [1, 0],
    [0, 1],
    [1, 1],
    [2, 1],
  ],
  S: [
    [1, 0],
    [2, 0],
    [0, 1],
    [1, 1],
  ],
  Z: [
    [0, 0],
    [1, 0],
    [1, 1],
    [2, 1],
  ],
  J: [
    [0, 0],
    [0, 1],
    [1, 1],
    [2, 1],
  ],
  L: [
    [2, 0],
    [0, 1],
    [1, 1],
    [2, 1],
  ],
}

const SPAWN_COLUMN = Math.floor((BOARD_WIDTH - 4) / 2)

// -----------------------------------------------------------------------------
// constructors
// -----------------------------------------------------------------------------

/**
 * A freshly spawned piece: its shape, horizontally centered at the top of
 * the board.
 *
 * @since 1.0.0
 * @category Constructors
 */
export const spawnPiece = (id: TetrominoId): Piece => ({
  id,
  cells: TETROMINO_SHAPES[id].map(([x, y]): Position => [x + SPAWN_COLUMN, y]),
})

/**
 * Draw a uniformly random Tetromino id. Wrapped in `IO` because it isn't
 * pure — call it at the edge of the program (e.g. once per `tick`), then
 * pass the result into `spawnPiece` or `spawn`.
 *
 * @since 1.0.0
 * @category Constructors
 */
export const randomTetrominoId: IO<TetrominoId> = () => {
  const index = Math.floor(Math.random() * TETROMINO_IDS.length)
  return TETROMINO_IDS[index] ?? 'I'
}
