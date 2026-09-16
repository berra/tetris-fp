/** @since 1.0.0 */

import * as RA from 'fp-ts/ReadonlyArray'
import { Board, Row, emptyRow } from './Board'

// -----------------------------------------------------------------------------
// constants
// -----------------------------------------------------------------------------

// Points per line cleared in a single lock, indexed by how many lines that
// was (index 0 unused). The classic single/double/triple/tetris scoring,
// before multiplying by the level it happened at.
const LINE_CLEAR_SCORES: ReadonlyArray<number> = [0, 40, 100, 300, 800]

// -----------------------------------------------------------------------------
// internal
// -----------------------------------------------------------------------------

const isRowFull = (row: Row): boolean => row.every((cell) => cell !== null)

// -----------------------------------------------------------------------------
// destructors
// -----------------------------------------------------------------------------

/**
 * The (0-indexed) rows of `board` that are completely filled and ready to
 * clear.
 *
 * @since 1.0.0
 * @category Destructors
 */
export const findFullRows = (board: Board): ReadonlyArray<number> =>
  board.reduce<ReadonlyArray<number>>(
    (fullRows, row, y) => (isRowFull(row) ? fullRows.concat(y) : fullRows),
    []
  )

/**
 * Remove `rows` from `board`, then pad back up to its original height by
 * adding empty rows at the top — the settled stack drops down to fill the
 * gap, same as the rest of `board` shifting down by one on every clear.
 *
 * @since 1.0.0
 * @category Destructors
 */
export const clearRows =
  (board: Board) =>
  (rows: ReadonlyArray<number>): Board => {
    if (rows.length === 0) return board

    const remaining = board.filter((_, y) => !rows.includes(y))
    return RA.replicate(rows.length, emptyRow).concat(remaining)
  }

/**
 * Points awarded for clearing `lineCount` lines in one go at `level` — the
 * classic single/double/triple/tetris scoring (40/100/300/800), scaled by
 * level. Clearing 0 lines scores 0.
 *
 * @since 1.0.0
 * @category Destructors
 * @example
 *   import { scoreForLines } from 'tetris-fp'
 *   assert.deepStrictEqual(scoreForLines(1)(1), 40)
 *   assert.deepStrictEqual(scoreForLines(1)(4), 800)
 *   assert.deepStrictEqual(scoreForLines(2)(1), 80)
 */
export const scoreForLines =
  (level: number) =>
  (lineCount: number): number =>
    (LINE_CLEAR_SCORES[lineCount] ?? 0) * level
