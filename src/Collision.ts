/** @since 1.0.0 */

import { Board, BOARD_HEIGHT, BOARD_WIDTH, Position } from './Board'

// -----------------------------------------------------------------------------
// destructors
// -----------------------------------------------------------------------------

/**
 * Whether a position is inside the playfield.
 *
 * @since 1.0.0
 * @category Destructors
 */
export const isWithinBounds = ([x, y]: Position): boolean =>
  x >= 0 && x < BOARD_WIDTH && y >= 0 && y < BOARD_HEIGHT

/**
 * Whether a position is already occupied by a settled block. Positions
 * outside the board are never considered occupied — check `isWithinBounds`
 * separately.
 *
 * @since 1.0.0
 * @category Destructors
 */
export const isSettled =
  (board: Board) =>
  ([x, y]: Position): boolean =>
    board[y]?.[x] != null

/**
 * Whether any of the given positions lands outside the playfield or on an
 * already-settled block — the two ways a piece can fail to occupy a set of
 * cells.
 *
 * @since 1.0.0
 * @category Destructors
 * @example
 *   import { emptyBoard } from 'tetris-fp'
 *   import { collides } from 'tetris-fp'
 *   assert.deepStrictEqual(collides(emptyBoard)([[0, 0]]), false)
 *   assert.deepStrictEqual(collides(emptyBoard)([[-1, 0]]), true)
 */
export const collides =
  (board: Board) =>
  (positions: ReadonlyArray<Position>): boolean =>
    positions.some(
      (position) => !isWithinBounds(position) || isSettled(board)(position)
    )
