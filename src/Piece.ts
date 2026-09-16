/** @since 1.0.0 */

import { Position, TetrominoId } from './Board'
import { assoc } from './internal'

// -----------------------------------------------------------------------------
// model
// -----------------------------------------------------------------------------

/**
 * The Tetromino currently falling: its shape, and the absolute board
 * position of each of its four blocks.
 *
 * @since 1.0.0
 * @category Model
 */
export interface Piece {
  readonly id: TetrominoId
  readonly cells: ReadonlyArray<Position>
}

/**
 * Which way to turn a piece — see `rotate`.
 *
 * @since 1.0.0
 * @category Model
 */
export type RotationDirection = 'cw' | 'ccw'

// -----------------------------------------------------------------------------
// internal
// -----------------------------------------------------------------------------

const setCells = assoc<Piece>()('cells')

// -----------------------------------------------------------------------------
// destructors
// -----------------------------------------------------------------------------

/**
 * Move every cell of a piece down by one row. Doesn't check for
 * collisions — see `collides`.
 *
 * @since 1.0.0
 * @category Destructors
 */
export const shiftDown = (piece: Piece): Piece =>
  setCells(piece.cells.map(([x, y]): Position => [x, y + 1]))(piece)

/**
 * Move every cell of a piece one column to the left. Doesn't check for
 * collisions — see `collides`.
 *
 * @since 1.0.0
 * @category Destructors
 */
export const shiftLeft = (piece: Piece): Piece =>
  setCells(piece.cells.map(([x, y]): Position => [x - 1, y]))(piece)

/**
 * Move every cell of a piece one column to the right. Doesn't check for
 * collisions — see `collides`.
 *
 * @since 1.0.0
 * @category Destructors
 */
export const shiftRight = (piece: Piece): Piece =>
  setCells(piece.cells.map(([x, y]): Position => [x + 1, y]))(piece)

/**
 * Turn a piece 90° around one of its own cells (its second cell, chosen
 * so the rotation stays connected and roughly in place). `O` is rotated
 * in place — a square looks the same in every orientation, so it's
 * returned unchanged. Doesn't check for collisions — see `collides`.
 *
 * @since 1.0.0
 * @category Destructors
 */
export const rotate =
  (direction: RotationDirection) =>
  (piece: Piece): Piece => {
    if (piece.id === 'O') return piece

    const [pivotX, pivotY] = piece.cells[1] ?? piece.cells[0] ?? [0, 0]
    const turn: (offset: Position) => Position =
      direction === 'cw' ? ([dx, dy]) => [-dy, dx] : ([dx, dy]) => [dy, -dx]

    const cells = piece.cells.map(([x, y]): Position => {
      const [dx, dy] = turn([x - pivotX, y - pivotY])
      return [pivotX + dx, pivotY + dy]
    })
    return setCells(cells)(piece)
  }

/**
 * Whether a piece occupies board position `(x, y)`.
 *
 * @since 1.0.0
 * @category Destructors
 */
export const isPieceCell =
  (piece: Piece) =>
  (x: number, y: number): boolean =>
    piece.cells.some(([px, py]) => px === x && py === y)
