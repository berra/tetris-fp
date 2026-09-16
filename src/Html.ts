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
  START_SCREEN_LINES,
  renderFrame,
  renderMobileFrame,
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
 * Cut rendered screen text (see `renderScreen`, `renderFrame`) down to
 * just its playfield columns, dropping the sidebar entirely. The
 * small-screen layout shows the playfield full width, with the sidebar
 * replaced by a condensed overlay instead (see `main.ts`'s
 * `#mobile-stats`) — this is the text that overlay's board half needs.
 *
 * @since 1.0.0
 * @category Destructors
 */
export const boardOnlyText = (screenText: string): string =>
  join('\n')(screenText.split('\n').map((line) => line.slice(0, BOARD_WIDTH)))

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

// A title/game-over message reads as prose, not bricks — laying it out
// on the same one-character-per-grid-cell `.mobile-board` (built for
// showing bordered blocks) looks stilted. `.mobile-message` shows it as
// plain, normally-wrapped, CSS-centered text instead; exactly one of the
// two is ever `.active` (see the `@media` block in `pageShell`).
const activeClass = (isActive: boolean): string => (isActive ? ' active' : '')

// The condensed score/level/high-score readout the small-screen layout
// overlays on the board — text only, no coloring needed. Starts empty;
// the live client (`main.ts`) fills it in from `GameScreen`'s numbers
// directly, since by the time we're just looking at rendered text here
// there's no clean way back to those numbers. Only relevant alongside
// the board itself — like `.mobile-board`, hidden during a title/
// game-over message, where it'd otherwise float redundantly over prose.
const mobileStatsHtml = (isActive: boolean): string =>
  `<div class="mobile-stats${activeClass(isActive)}" id="mobile-stats"></div>`

const escapeMessageLine = (line: string): string =>
  join('')(line.split('').map(escapeHtml))

const mobileMessageHtml =
  (isActive: boolean) =>
  (lines: ReadonlyArray<string>): string =>
    `<div class="mobile-message${activeClass(
      isActive
    )}" id="mobile-message">${join('\n')(lines.map(escapeMessageLine))}</div>`

// Lays out the desktop layout's `#screen` (the full playfield-plus-
// sidebar grid) alongside the small-screen layout's alternatives: the
// playfield-only `#mobile-board` (shown full width, sidebar dropped for
// `#mobile-stats` instead) for real gameplay, or the plain-text
// `#mobile-message` for a title/game-over message — `messageLines` is
// `null` exactly when there's gameplay to show instead of a message.
const frameHtml =
  (toHtml: (text: string) => string) =>
  (screenText: string) =>
  (mobileBoardText: string) =>
  (messageLines: ReadonlyArray<string> | null): string =>
    `<div class="frame">
      <div class="screen" id="screen">${toHtml(screenText)}</div>
      <div class="mobile-board${activeClass(
        messageLines === null
      )}" id="mobile-board">${toHtml(mobileBoardText)}</div>
      ${mobileMessageHtml(messageLines !== null)(messageLines ?? [])}
      ${mobileStatsHtml(messageLines === null)}
      ${pauseOverlayHtml}
    </div>`

// Below this viewport width, the desktop's board-plus-sidebar grid no
// longer fits comfortably — switch to the full-width, playfield-only
// small-screen layout instead (see the `@media` block below).
const MOBILE_BREAKPOINT_PX = SCREEN_WIDTH_PX

const pageShell =
  (title: string) =>
  (bodyHtml: string): string =>
    `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
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
  .mobile-board {
    display: none;
    position: relative;
    width: 100%;
    aspect-ratio: ${BOARD_WIDTH} / ${SCREEN_ROWS};
    grid-template-columns: repeat(${BOARD_WIDTH}, 1fr);
    grid-template-rows: repeat(${SCREEN_ROWS}, 1fr);
    background: ${SCREEN_BACKGROUND};
  }
  .mobile-board .cell {
    font-size: 11px;
  }
  .mobile-message {
    display: none;
    width: 100%;
    aspect-ratio: ${BOARD_WIDTH} / ${SCREEN_ROWS};
    box-sizing: border-box;
    padding: 24px 16px;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: ${SCREEN_BACKGROUND};
    color: ${SCREEN_TEXT};
    font-family: 'Courier New', monospace;
    font-weight: bold;
    font-size: 20px;
    line-height: 1.6;
    text-align: center;
    white-space: pre-line;
  }
  .mobile-stats {
    display: none;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    padding: 2px 4px;
    font-family: 'Courier New', monospace;
    font-weight: bold;
    font-size: 11px;
    color: ${SCREEN_TEXT};
    background: rgba(255, 255, 255, 0.6);
    white-space: nowrap;
    overflow: hidden;
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
  .controls {
    display: none;
    grid-template-columns: repeat(3, 1fr);
    grid-template-areas: ". up ." "left down right";
    gap: 12px;
    width: 100%;
    max-width: 320px;
    margin: 16px auto 0;
    padding: 0 16px;
    box-sizing: border-box;
  }
  .control-up { grid-area: up; }
  .control-left { grid-area: left; }
  .control-down { grid-area: down; }
  .control-right { grid-area: right; }
  .control-btn {
    aspect-ratio: 1;
    border: none;
    border-radius: 12px;
    background: #2b2b1f;
    color: #ffffff;
    font-size: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    touch-action: manipulation;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
  }
  .control-btn:active {
    background: #45453a;
  }
  ${pieceColorRules()}
  @media (max-width: ${MOBILE_BREAKPOINT_PX}px) {
    html, body {
      height: auto;
      min-height: 100%;
      flex-direction: column;
    }
    .frame {
      width: 100%;
      padding: 0;
      border-radius: 0;
    }
    .screen {
      display: none;
    }
    .mobile-board.active {
      display: grid;
    }
    .mobile-message.active {
      display: flex;
    }
    .mobile-stats.active {
      display: block;
    }
    .pause-overlay {
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      font-size: 24px;
    }
    .controls {
      display: grid;
    }
  }
</style>
</head>
<body>
${bodyHtml}
</body>
</html>
`

// The small-screen control pad: a classic inverted-T arrow cluster below
// the board. Each button just fires the same key its label matches —
// `main.ts`'s one keydown handler (keyboard or synthetic) does the rest,
// so there's no separate control-handling logic to keep in sync.
const controlButton = (arrow: string, key: string, area: string): string =>
  `<button type="button" class="control-btn control-${area}" data-key="${key}" aria-label="${key}">${arrow}</button>`

const controlsHtml = `<div class="controls" id="controls">
  ${controlButton('▲', 'ArrowUp', 'up')}
  ${controlButton('◀', 'ArrowLeft', 'left')}
  ${controlButton('▼', 'ArrowDown', 'down')}
  ${controlButton('▶', 'ArrowRight', 'right')}
</div>`

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
  pipe(
    frameHtml(toColoredGridHtml)(screenText)(boardOnlyText(screenText))(null),
    pageShell(title)
  )

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
    frameHtml(toGridHtml)(renderFrame(initialFrame))(
      renderMobileFrame(initialFrame)
    )(START_SCREEN_LINES) +
      controlsHtml +
      gameScript,
    pageShell(title)
  )
