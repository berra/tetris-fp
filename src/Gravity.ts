/** @since 1.0.0 */

import { pipe } from 'fp-ts/function'
import { Board, TetrominoId } from './Board'
import { collides } from './Collision'
import { GameFrame } from './GameFrame'
import { GameScreen } from './GameScreen'
import { clearRows, findFullRows, scoreForLines } from './Lines'
import { assoc } from './internal'
import {
  Piece,
  isPieceCell,
  rotate,
  shiftDown,
  shiftLeft,
  shiftRight,
} from './Piece'
import { spawnPiece } from './Tetromino'

// -----------------------------------------------------------------------------
// internal
// -----------------------------------------------------------------------------

const setBoard = assoc<GameScreen>()('board')
const setActive = assoc<GameScreen>()('active')
const setScore = assoc<GameScreen>()('score')
const setLines = assoc<GameScreen>()('lines')
const setNext = assoc<GameScreen>()('next')

const lockPiece =
  (board: Board) =>
  (piece: Piece): Board =>
    board.map((row, y) =>
      row.map((cell, x) => (isPieceCell(piece)(x, y) ? piece.id : cell))
    )

// Lock `piece` into `screen.board`, clear any lines it completed, and
// award the score for them — the one place a piece stops being active.
const settle =
  (screen: GameScreen) =>
  (piece: Piece): GameScreen => {
    const locked = lockPiece(screen.board)(piece)
    const fullRows = findFullRows(locked)

    return pipe(
      screen,
      setBoard(clearRows(locked)(fullRows)),
      setActive(null),
      setScore(screen.score + scoreForLines(screen.level)(fullRows.length)),
      setLines(screen.lines + fullRows.length)
    )
  }

const tryTransform =
  (transform: (piece: Piece) => Piece) =>
  (screen: GameScreen): GameScreen => {
    if (screen.active === null) return screen

    const moved = transform(screen.active)
    return collides(screen.board)(moved.cells)
      ? screen
      : setActive(moved)(screen)
  }

const dropToFloor =
  (board: Board) =>
  (piece: Piece): Piece => {
    const dropped = shiftDown(piece)
    return collides(board)(dropped.cells) ? piece : dropToFloor(board)(dropped)
  }

// -----------------------------------------------------------------------------
// destructors
// -----------------------------------------------------------------------------

/**
 * Advance gravity by one row: drop the active piece if it can fall
 * further, or settle it — locking it into the board, clearing any lines
 * it completed, and scoring them (see `settle`) — if it can't. A
 * `screen` with no active piece is returned unchanged — see `spawn`.
 *
 * @since 1.0.0
 * @category Destructors
 */
export const step = (screen: GameScreen): GameScreen => {
  if (screen.active === null) return screen

  const dropped = shiftDown(screen.active)
  return collides(screen.board)(dropped.cells)
    ? settle(screen)(screen.active)
    : setActive(dropped)(screen)
}

/**
 * Drop the active piece straight down until it collides, then settle it
 * immediately — a hard drop. Does nothing if there's no active piece.
 *
 * @since 1.0.0
 * @category Destructors
 */
export const hardDrop = (screen: GameScreen): GameScreen => {
  if (screen.active === null) return screen

  const landed = dropToFloor(screen.board)(screen.active)
  return settle(screen)(landed)
}

/**
 * Move the active piece one column to the left, unless a wall or a
 * settled block is in the way — in which case `screen` is returned
 * unchanged. Does nothing if there's no active piece.
 *
 * @since 1.0.0
 * @category Destructors
 */
export const moveLeft: (screen: GameScreen) => GameScreen =
  tryTransform(shiftLeft)

/**
 * Move the active piece one column to the right, unless a wall or a
 * settled block is in the way — in which case `screen` is returned
 * unchanged. Does nothing if there's no active piece.
 *
 * @since 1.0.0
 * @category Destructors
 */
export const moveRight: (screen: GameScreen) => GameScreen =
  tryTransform(shiftRight)

/**
 * Rotate the active piece 90° clockwise, unless doing so would collide
 * with a wall or a settled block — in which case `screen` is returned
 * unchanged. Does nothing if there's no active piece.
 *
 * @since 1.0.0
 * @category Destructors
 */
export const rotateClockwise: (screen: GameScreen) => GameScreen = tryTransform(
  rotate('cw')
)

/**
 * Rotate the active piece 90° counter-clockwise, unless doing so would
 * collide with a wall or a settled block — in which case `screen` is
 * returned unchanged. Does nothing if there's no active piece.
 *
 * @since 1.0.0
 * @category Destructors
 */
export const rotateCounterClockwise: (screen: GameScreen) => GameScreen =
  tryTransform(rotate('ccw'))

/**
 * Spawn `id` as the active piece — but only if there isn't one already,
 * and the spawn position is clear. A spawn that would immediately collide
 * (the stack has reached the top) is silently skipped, leaving `active`
 * `null`.
 *
 * @since 1.0.0
 * @category Destructors
 */
export const spawn =
  (id: TetrominoId) =>
  (screen: GameScreen): GameScreen => {
    if (screen.active !== null) return screen

    const piece = spawnPiece(id)
    return collides(screen.board)(piece.cells)
      ? screen
      : setActive(piece)(screen)
  }

/**
 * One full game step: gravity (`step`), then — if that drop just locked
 * the active piece — spawn whatever was queued in `screen.next` and
 * queue `drawnId` behind it, so the "next piece" preview always shows
 * what's really coming up rather than the id a caller happens to have on
 * hand. Pass a fresh id — e.g. from `randomTetrominoId` — on every call;
 * it's only consumed when a piece is actually spawned.
 *
 * `screen.next` should be seeded before the very first call (there's
 * nothing to queue behind yet); until then, a spawn falls back to using
 * `drawnId` directly, same as `spawn` would.
 *
 * @since 1.0.0
 * @category Destructors
 */
export const tick =
  (drawnId: TetrominoId) =>
  (screen: GameScreen): GameScreen => {
    const stepped = step(screen)
    if (stepped.active !== null) return stepped

    const spawned = spawn(stepped.next ?? drawnId)(stepped)
    return spawned.active === null ? spawned : setNext(drawnId)(spawned)
  }

/**
 * `tick`, at the whole-frame level: does nothing while `mode` isn't
 * `'playing'`, and switches to `'gameOver'` the moment `tick` needs to
 * spawn `nextId` but can't — the stack has reached the top, and there's
 * nowhere left for a new piece to appear.
 *
 * @since 1.0.0
 * @category Destructors
 */
export const tickFrame =
  (nextId: TetrominoId) =>
  (frame: GameFrame): GameFrame => {
    if (frame.mode !== 'playing') return frame

    const screen = tick(nextId)(frame.screen)
    return { mode: screen.active === null ? 'gameOver' : 'playing', screen }
  }
