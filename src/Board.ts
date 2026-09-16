/** @since 1.0.0 */

import * as RA from 'fp-ts/ReadonlyArray'

// -----------------------------------------------------------------------------
// model
// -----------------------------------------------------------------------------

/**
 * The seven Tetromino shapes, identified by their conventional letter.
 *
 * @since 1.0.0
 * @category Model
 */
export type TetrominoId = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L'

/**
 * A single position on the board: either empty, or occupied by a settled
 * Tetromino block.
 *
 * @since 1.0.0
 * @category Model
 */
export type Cell = TetrominoId | null

/**
 * @since 1.0.0
 * @category Model
 */
export type Row = ReadonlyArray<Cell>

/**
 * @since 1.0.0
 * @category Model
 */
export type Board = ReadonlyArray<Row>

/**
 * A single cell position on the board, as `[column, row]`, both 0-indexed.
 *
 * @since 1.0.0
 * @category Model
 */
export type Position = readonly [number, number]

// -----------------------------------------------------------------------------
// constants
// -----------------------------------------------------------------------------

/**
 * Playfield width, in blocks.
 *
 * @since 1.0.0
 * @category Constants
 */
export const BOARD_WIDTH = 10

/**
 * Playfield height, in blocks. The Game Boy release shows 18 visible rows
 * (rather than the 20 used by e.g. the NES release) — that's what leaves
 * room for a sidebar next to the playfield on the 160x144 Game Boy screen.
 *
 * @since 1.0.0
 * @category Constants
 */
export const BOARD_HEIGHT = 18

// -----------------------------------------------------------------------------
// constructors
// -----------------------------------------------------------------------------

/**
 * A row with every cell empty.
 *
 * @since 1.0.0
 * @category Constructors
 */
export const emptyRow: Row = RA.replicate(BOARD_WIDTH, null as Cell)

/**
 * A board with every cell empty.
 *
 * @since 1.0.0
 * @category Constructors
 * @example
 *   import { emptyBoard, BOARD_WIDTH, BOARD_HEIGHT } from 'tetris-fp'
 *   assert.deepStrictEqual(emptyBoard.length, BOARD_HEIGHT)
 *   assert.deepStrictEqual(emptyBoard[0]?.length, BOARD_WIDTH)
 */
export const emptyBoard: Board = RA.replicate(BOARD_HEIGHT, emptyRow)
