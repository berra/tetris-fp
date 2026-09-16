/** @since 1.0.0 */

import { pipe } from 'fp-ts/function'
import * as RA from 'fp-ts/ReadonlyArray'
import { Board, BOARD_WIDTH, Cell, TetrominoId } from './Board'
import { GameFrame } from './GameFrame'
import { GameScreen } from './GameScreen'
import { isPieceCell } from './Piece'
import { TETROMINO_SHAPES } from './Tetromino'
import {
  centerPad,
  centerText,
  concatTuple,
  fitToLength,
  fitToWidth,
  join,
} from './internal'

// -----------------------------------------------------------------------------
// constants
// -----------------------------------------------------------------------------

/**
 * Screen width, in 8x8 tiles. The Game Boy LCD is 160x144 pixels, laid out
 * as a 20x18 grid of 8x8 tiles — using that same grid as the character grid
 * is what ties the ASCII output to the size of a real Game Boy screen.
 *
 * @since 1.0.0
 * @category Constants
 */
export const SCREEN_COLUMNS = 20

/**
 * Screen height, in 8x8 tiles.
 *
 * @since 1.0.0
 * @category Constants
 */
export const SCREEN_ROWS = 18

const SIDEBAR_COLUMNS = SCREEN_COLUMNS - BOARD_WIDTH

// -----------------------------------------------------------------------------
// internal
// -----------------------------------------------------------------------------

const renderCell = (cell: Cell): string => cell ?? '.'

const overlayActive = (screen: GameScreen): Board => {
  const { board, active } = screen
  if (active === null) return board
  return board.map((row, y) =>
    row.map((cell, x) => (isPieceCell(active)(x, y) ? active.id : cell))
  )
}

const padToSidebarWidth = fitToWidth(SIDEBAR_COLUMNS)

const fitToSidebarHeight = fitToLength<string>(SCREEN_ROWS)(
  padToSidebarWidth('')
)

const renderBoardRow = (row: ReadonlyArray<Cell>): string =>
  pipe(row, RA.map(renderCell), join(''))

/**
 * How many tiles wide the "next piece" preview is — every Tetromino's
 * spawn shape (see `TETROMINO_SHAPES`) fits within this 4-wide, 2-tall
 * box.
 *
 * @since 1.0.0
 * @category Constants
 */
export const PREVIEW_WIDTH = 4

/**
 * How many tiles tall the "next piece" preview is.
 *
 * @since 1.0.0
 * @category Constants
 */
export const PREVIEW_HEIGHT = 2

/**
 * The row (0-indexed, on the full `SCREEN_ROWS` grid) the preview starts
 * on — right below the NEXT label, per `renderSidebar`'s layout. Lets the
 * HTML renderer know which sidebar cells are a real brick (and safe to
 * color) rather than label text.
 *
 * @since 1.0.0
 * @category Constants
 */
export const PREVIEW_ROW_OFFSET = 1

const PREVIEW_ROWS: ReadonlyArray<number> = [0, 1]
const PREVIEW_COLUMNS: ReadonlyArray<number> = [0, 1, 2, 3]

const renderPreviewCell =
  (id: TetrominoId) =>
  (y: number) =>
  (x: number): Cell =>
    isPieceCell({ id, cells: TETROMINO_SHAPES[id] })(x, y) ? id : null

const renderPreviewRow =
  (id: TetrominoId) =>
  (y: number): string =>
    pipe(PREVIEW_COLUMNS, RA.map(renderPreviewCell(id)(y)), renderBoardRow)

/**
 * Draw the shape of the upcoming piece, as a small `PREVIEW_WIDTH`-wide
 * fixed-size grid — a blank one if there's nothing queued yet.
 */
const renderNextPiece = (id: TetrominoId | null): ReadonlyArray<string> =>
  id === null
    ? PREVIEW_ROWS.map(() => '.'.repeat(PREVIEW_WIDTH))
    : PREVIEW_ROWS.map(renderPreviewRow(id))

const renderSidebar = (screen: GameScreen): ReadonlyArray<string> =>
  pipe(
    [
      'NEXT',
      ...renderNextPiece(screen.next),
      '',
      '',
      'SCORE',
      String(screen.score),
      '',
      'LEVEL',
      String(screen.level),
      '',
      'LINES',
      String(screen.lines),
      '',
      'HIGH SCORE',
      String(screen.highScore),
    ],
    RA.map(padToSidebarWidth),
    fitToSidebarHeight
  )

const centerOnScreen = centerText(SCREEN_COLUMNS)

const fitToScreenHeight = centerPad<string>(SCREEN_ROWS)(centerOnScreen(''))

const START_SCREEN_LINES: ReadonlyArray<string> = [
  'TETRIS',
  '',
  'PRESS ANY KEY',
  'TO START',
]

const gameOverLines = (score: number): ReadonlyArray<string> => [
  'GAME OVER',
  '',
  `SCORE: ${score}`,
  '',
  'PRESS ANY KEY',
  'TO TRY AGAIN',
]

// -----------------------------------------------------------------------------
// destructors
// -----------------------------------------------------------------------------

/**
 * Render one frame as plain ASCII text: `SCREEN_ROWS` lines of
 * `SCREEN_COLUMNS` characters each, matching the 20x18 tile grid of a real
 * Game Boy screen. The playfield fills the left `BOARD_WIDTH` columns; next
 * piece, score, level, lines and high score fill the rest, mirroring the
 * Game Boy release's layout.
 *
 * @since 1.0.0
 * @category Destructors
 * @example
 *   import { emptyBoard } from 'tetris-fp'
 *   import { renderScreen, SCREEN_COLUMNS, SCREEN_ROWS } from 'tetris-fp'
 *
 *   const text = renderScreen({
 *     board: emptyBoard,
 *     active: null,
 *     next: 'T',
 *     score: 0,
 *     level: 1,
 *     lines: 0,
 *     highScore: 0,
 *   })
 *   const lines = text.split('\n')
 *   assert.deepStrictEqual(lines.length, SCREEN_ROWS)
 *   assert.deepStrictEqual(lines.every((line) => line.length === SCREEN_COLUMNS), true)
 */
export const renderScreen = (screen: GameScreen): string =>
  pipe(
    overlayActive(screen),
    RA.map(renderBoardRow),
    RA.zip(renderSidebar(screen)),
    RA.map(concatTuple),
    join('\n')
  )

/**
 * Render the title screen: "press any key to start", vertically and
 * horizontally centered on the same `SCREEN_ROWS` x `SCREEN_COLUMNS` grid
 * `renderScreen` uses.
 *
 * @since 1.0.0
 * @category Destructors
 */
export const renderStartScreen = (): string =>
  pipe(
    START_SCREEN_LINES,
    RA.map(centerOnScreen),
    fitToScreenHeight,
    join('\n')
  )

/**
 * Render the game-over screen: "game over", the final score, and a
 * prompt to try again, on the same `SCREEN_ROWS` x `SCREEN_COLUMNS` grid
 * `renderScreen` uses.
 *
 * @since 1.0.0
 * @category Destructors
 */
export const renderGameOverScreen = (score: number): string =>
  pipe(
    gameOverLines(score),
    RA.map(centerOnScreen),
    fitToScreenHeight,
    join('\n')
  )

/**
 * Render a whole frame: the title screen while `mode` is `'start'`, the
 * game screen while it's `'playing'`, or the game-over screen once it's
 * `'gameOver'`.
 *
 * @since 1.0.0
 * @category Destructors
 */
export const renderFrame = (frame: GameFrame): string =>
  frame.mode === 'start'
    ? renderStartScreen()
    : frame.mode === 'gameOver'
    ? renderGameOverScreen(frame.screen.score)
    : renderScreen(frame.screen)
