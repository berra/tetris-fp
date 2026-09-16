/** @since 1.0.0 */

import { Board, TetrominoId, emptyBoard } from './Board'
import { INITIAL_LEVEL } from './Level'
import { Piece } from './Piece'

/**
 * Everything the renderer needs to draw one frame: the settled playfield,
 * the piece currently falling (if any), plus the sidebar information the
 * Game Boy release shows next to it (next piece, score, level, lines
 * cleared). `highScore` is display-only — no pure function in this
 * library ever changes it; it's set by whatever's persisting it (e.g.
 * `src/browser`'s localStorage-backed high score) so the renderer can
 * show it alongside the current score.
 *
 * @since 1.0.0
 * @category Model
 */
export interface GameScreen {
  readonly board: Board
  readonly active: Piece | null
  readonly next: TetrominoId | null
  readonly score: number
  readonly level: number
  readonly lines: number
  readonly highScore: number
}

/**
 * The screen a brand-new game starts from: an empty board, no piece
 * falling yet, no next piece queued, no score or cleared lines, and
 * `INITIAL_LEVEL`.
 *
 * @since 1.0.0
 * @category Constructors
 */
export const initialScreen: GameScreen = {
  board: emptyBoard,
  active: null,
  next: null,
  score: 0,
  level: INITIAL_LEVEL,
  lines: 0,
  highScore: 0,
}
