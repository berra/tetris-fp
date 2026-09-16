/** @since 1.0.0 */

import * as fs from 'fs'
import { IO } from 'fp-ts/IO'
import { GameScreen } from './GameScreen'
import { renderScreen } from './Renderer'
import { toGameHtmlDocument, toHtmlDocument } from './Html'

/**
 * Render a game screen straight to a standalone HTML file, sized like a Game
 * Boy Tetris screen (see `renderScreen` and `toHtmlDocument`). Wrapped in
 * `IO` because writing to the filesystem is a side effect: nothing happens
 * until the returned `IO` is invoked.
 *
 * @since 1.0.0
 * @category Effects
 * @example
 *   import { emptyBoard, writeScreenToHtmlFile } from 'tetris-fp'
 *
 *   writeScreenToHtmlFile('./tetris.html')({
 *     board: emptyBoard,
 *     active: null,
 *     next: 'T',
 *     score: 0,
 *     level: 1,
 *     lines: 0,
 *     highScore: 0,
 *   })()
 */
export const writeScreenToHtmlFile =
  (path: string) =>
  (screen: GameScreen): IO<void> =>
  () =>
    fs.writeFileSync(path, toHtmlDocument(renderScreen(screen)))

/**
 * Write the playable page (see `toGameHtmlDocument`) to a standalone HTML
 * file: a title screen that starts the game, at `INITIAL_LEVEL`, on any
 * keypress. Wrapped in `IO` for the same reason as `writeScreenToHtmlFile`.
 *
 * @since 1.0.0
 * @category Effects
 * @example
 *   import { writeGameToHtmlFile } from 'tetris-fp'
 *
 *   writeGameToHtmlFile('./tetris.html')()
 */
export const writeGameToHtmlFile =
  (path: string): IO<void> =>
  () =>
    fs.writeFileSync(path, toGameHtmlDocument())
