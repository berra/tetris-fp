/** @since 1.0.0 */

import { pipe } from 'fp-ts/function'
import * as RA from 'fp-ts/ReadonlyArray'
import { BOARD_WIDTH, TetrominoId } from './Board'
import { initialFrame } from './GameFrame'
import { join, lookupOrSelf } from './internal'
import {
  PREVIEW_HEIGHT,
  PREVIEW_ROW_OFFSET,
  PREVIEW_WIDTH,
  SCREEN_COLUMNS,
  SCREEN_ROWS,
  renderFrame,
} from './Renderer'
import { TETROMINO_IDS } from './Tetromino'

// -----------------------------------------------------------------------------
// constants
// -----------------------------------------------------------------------------

/**
 * How many CSS pixels each Game Boy screen pixel is drawn as. The GB LCD is
 * 160x144 real pixels; scaling every one of those up by the same integer
 * factor keeps the rendered page a Game Boy Tetris screen, just legible on
 * a modern display.
 *
 * @since 1.0.0
 * @category Constants
 */
export const PIXEL_SCALE = 4

const TILE_SIZE_PX = 8 * PIXEL_SCALE
const SCREEN_WIDTH_PX = SCREEN_COLUMNS * TILE_SIZE_PX
const SCREEN_HEIGHT_PX = SCREEN_ROWS * TILE_SIZE_PX

// A neutral gray screen, so the colored bricks (see PIECE_COLORS) don't
// clash the way they did against the original Game Boy green.
const SCREEN_BACKGROUND = '#c4c4c4'
const SCREEN_TEXT = '#2b2b2b'

// the classic Tetris guideline color for each piece, so bricks are
// distinguishable by color as well as by letter
const PIECE_COLORS: Readonly<Record<TetrominoId, string>> = {
  I: '#31c7ef',
  O: '#f7d308',
  T: '#ad4d9c',
  S: '#42b642',
  Z: '#ef2029',
  J: '#5a65ad',
  L: '#f09022',
}

// how far, toward white, a piece's own color is mixed to get its block's
// background fill
const BLOCK_FILL_LIGHTEN = 0.75
const BLOCK_BORDER_PX = PIXEL_SCALE / 2

// -----------------------------------------------------------------------------
// internal
// -----------------------------------------------------------------------------

const escapeHtml = lookupOrSelf({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  ' ': '&nbsp;',
})

const hexToRgb = (hex: string): readonly [number, number, number] => {
  const value = parseInt(hex.slice(1), 16)
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255]
}

const rgbToHex = ([r, g, b]: readonly [number, number, number]): string =>
  '#' +
  [r, g, b]
    .map((channel) => Math.round(channel).toString(16).padStart(2, '0'))
    .join('')

// Mix a hex color toward white by `amount` (0 = unchanged, 1 = white) —
// used to turn a piece's own color into its block's lighter fill.
const lighten =
  (amount: number) =>
  (hex: string): string => {
    const mixChannel = (channel: number): number =>
      channel + (255 - channel) * amount
    const [r, g, b] = hexToRgb(hex)
    return rgbToHex([mixChannel(r), mixChannel(g), mixChannel(b)])
  }

const isPieceChar = (char: string): boolean =>
  (TETROMINO_IDS as ReadonlyArray<string>).includes(char)

const renderCellDiv = (char: string): string =>
  `<div class="cell">${escapeHtml(char)}</div>`

const isInPreview = (row: number, columnIndex: number): boolean =>
  row >= PREVIEW_ROW_OFFSET &&
  row < PREVIEW_ROW_OFFSET + PREVIEW_HEIGHT &&
  columnIndex >= BOARD_WIDTH &&
  columnIndex < BOARD_WIDTH + PREVIEW_WIDTH

// The playfield columns are unambiguously "a piece letter, or not" on any
// row, and the next-piece preview is exactly the same, but only on its
// own fixed few rows — past that, in the sidebar, the very same letters
// turn up inside labels like SCORE/LEVEL/LINES, and centered titles like
// TETRIS/GAME OVER span the full width. Coloring only within these two
// regions avoids ever mistaking label text for a brick.
const renderColoredCellDiv =
  (row: number) =>
  (char: string, columnIndex: number): string => {
    const isBrick = columnIndex < BOARD_WIDTH || isInPreview(row, columnIndex)
    const pieceClass = isBrick && isPieceChar(char) ? ` piece-${char}` : ''
    return `<div class="cell${pieceClass}">${escapeHtml(char)}</div>`
  }

// Each piece's own color borders its block and tints its letter; a much
// lighter mix of that same color fills the block, so a piece reads as a
// row of bordered blocks rather than a row of colored letters.
const pieceColorRule = (id: TetrominoId): string => {
  const color = PIECE_COLORS[id]
  const fill = lighten(BLOCK_FILL_LIGHTEN)(color)
  return `.piece-${id} { color: ${color}; background: ${fill}; border: ${BLOCK_BORDER_PX}px solid ${color}; }`
}

const pieceColorRules = (): string =>
  pipe(TETROMINO_IDS, RA.map(pieceColorRule), join('\n  '))

const renderLine = (line: string): string =>
  pipe(line.split(''), RA.map(renderCellDiv), join(''))

const renderColoredLine = (line: string, row: number): string =>
  join('')(line.split('').map(renderColoredCellDiv(row)))

/**
 * Turn rendered screen text (see `renderScreen`, `renderFrame`) into the
 * `.cell`-per-character markup `.screen`'s CSS grid expects, with no
 * coloring — safe for any text, including the title and game-over
 * screens' full-width messages.
 *
 * @since 1.0.0
 * @category Destructors
 */
export const toGridHtml = (screenText: string): string =>
  pipe(screenText.split('\n'), RA.map(renderLine), join(''))

/**
 * `toGridHtml`, but with each brick colored by its Tetromino type — in
 * the playfield, and in the "next piece" preview. Only safe for text
 * rendered by `renderScreen` (i.e. a `GameFrame` in `'playing'` mode) —
 * the title and game-over screens can span those same columns with plain
 * text that happens to contain a piece letter, and this doesn't try to
 * tell those apart.
 *
 * @since 1.0.0
 * @category Destructors
 */
export const toColoredGridHtml = (screenText: string): string =>
  join('')(screenText.split('\n').map(renderColoredLine))

// Hidden by default (see .pause-overlay's CSS); the live client toggles
// it directly by id when `frame.mode` is `'paused'`. Always included, even
// in the static single-screen/title-screen documents, since it's inert
// unless something switches it on.
const pauseOverlayHtml =
  '<div class="pause-overlay" id="pause-overlay">PAUSED</div>'

const frameHtml = (screenHtml: string): string =>
  `<div class="frame"><div class="screen" id="screen">${screenHtml}</div>${pauseOverlayHtml}</div>`

const pageShell =
  (title: string) =>
  (bodyHtml: string): string =>
    `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${title}</title>
<style>
  html, body {
    margin: 0;
    height: 100%;
    background: #545454;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .frame {
    position: relative;
    padding: ${2 * PIXEL_SCALE}px;
    background: #2b2b1f;
    border-radius: ${3 * PIXEL_SCALE}px;
  }
  .screen {
    width: ${SCREEN_WIDTH_PX}px;
    height: ${SCREEN_HEIGHT_PX}px;
    display: grid;
    grid-template-columns: repeat(${SCREEN_COLUMNS}, ${TILE_SIZE_PX}px);
    grid-template-rows: repeat(${SCREEN_ROWS}, ${TILE_SIZE_PX}px);
    background: ${SCREEN_BACKGROUND};
  }
  .cell {
    display: flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    font-family: 'Courier New', monospace;
    font-weight: bold;
    font-size: ${TILE_SIZE_PX * 0.75}px;
    color: ${SCREEN_TEXT};
  }
  .pause-overlay {
    display: none;
    position: absolute;
    top: ${2 * PIXEL_SCALE}px;
    left: ${2 * PIXEL_SCALE}px;
    width: ${SCREEN_WIDTH_PX}px;
    height: ${SCREEN_HEIGHT_PX}px;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.6);
    color: #ffffff;
    font-family: 'Courier New', monospace;
    font-weight: bold;
    font-size: ${TILE_SIZE_PX * 1.25}px;
    letter-spacing: ${PIXEL_SCALE}px;
  }
  ${pieceColorRules()}
</style>
</head>
<body>
${bodyHtml}
</body>
</html>
`

const gameScript = '<script src="game.js"></script>'

// -----------------------------------------------------------------------------
// destructors
// -----------------------------------------------------------------------------

/**
 * Wrap a rendered screen (see `renderScreen` — this expects its output
 * specifically, not `renderStartScreen`/`renderGameOverScreen`'s) in a
 * standalone HTML document: a neutral gray screen (so the bricks, each
 * colored by Tetromino type — see `toColoredGridHtml` — stay readable
 * rather than clashing with a tinted background), sized to exactly
 * `SCREEN_COLUMNS` x `SCREEN_ROWS` tiles at `PIXEL_SCALE`x — a scaled-up
 * 160x144 Game Boy screen — and laid out as a CSS grid so every tile is
 * a fixed-size square regardless of font metrics.
 *
 * @since 1.0.0
 * @category Destructors
 */
export const toHtmlDocument = (screenText: string, title = 'Tetris'): string =>
  pipe(screenText, toColoredGridHtml, frameHtml, pageShell(title))

/**
 * The playable page: server-renders the title screen for a flicker-free
 * first paint, then loads `game.js` — the bundled client (see
 * `src/browser/main.ts`, built by `npm run build:browser`) that starts
 * the game on any keypress and handles gravity, movement and rotation
 * from there. Same viewport as `toHtmlDocument`.
 *
 * @since 1.0.0
 * @category Destructors
 */
export const toGameHtmlDocument = (title = 'Tetris'): string =>
  pipe(
    frameHtml(toGridHtml(renderFrame(initialFrame))) + gameScript,
    pageShell(title)
  )
