/** @since 1.0.0 */

import { pipe } from 'fp-ts/function'
import { Board, TetrominoId } from './Board'
import { collides } from './Collision'
import { GameFrame } from './GameFrame'
import { GameScreen } from './GameScreen'
import { levelForLines } from './Level'
import { clearRows, findFullRows, scoreForLines } from './Lines'
import { assoc } from './internal'
import {
  Piece,
  RotationDirection,
  rotationCandidates,
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
const setLevel = assoc<GameScreen>()('level')
const setNext = assoc<GameScreen>()('next')

// A piece only ever occupies 4 cells, so locking it only needs to touch
// the rows those cells land in — group them by row first, then rebuild
// just those rows, rather than scanning every one of the board's cells
// against the piece's shape.
const lockPiece =
  (board: Board) =>
  (piece: Piece): Board => {
    const columnsByRow = new Map<number, ReadonlyArray<number>>()
    piece.cells.forEach(([x, y]) => {
      columnsByRow.set(y, [...(columnsByRow.get(y) ?? []), x])
    })

    return board.map((row, y) => {
      const columns = columnsByRow.get(y)
      return columns === undefined
        ? row
        : row.map((cell, x) => (columns.includes(x) ? piece.id : cell))
    })
  }

// Lock `piece` into `screen.board`, clear any lines it completed, award
// the score for them (at the level they were cleared at), and level up
// if that crossed a LINES_PER_LEVEL threshold — the one place a piece
// stops being active.
const settle =
  (screen: GameScreen) =>
  (piece: Piece): GameScreen => {
    const locked = lockPiece(screen.board)(piece)
    const fullRows = findFullRows(locked)
    const lines = screen.lines + fullRows.length

    return pipe(
      screen,
      setBoard(clearRows(locked)(fullRows)),
      setActive(null),
      setScore(screen.score + scoreForLines(screen.level)(fullRows.length)),
      setLines(lines),
      setLevel(levelForLines(lines))
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

// Tries `rotationCandidates` in order — the plain in-place rotation,
// then each wall-kick offset — and keeps the first one that doesn't
// collide, exactly as the Super Rotation System defines a rotation:
// not a single transform to accept or reject, but a short list of
// positions to try until one fits.
const tryRotate =
  (direction: RotationDirection) =>
  (screen: GameScreen): GameScreen => {
    if (screen.active === null) return screen

    const fit = rotationCandidates(direction)(screen.active).find(
      (candidate) => !collides(screen.board)(candidate.cells)
    )
    return fit === undefined ? screen : setActive(fit)(screen)
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
 * Rotate the active piece 90° clockwise, per the Super Rotation
 * System: the plain in-place rotation if it fits, otherwise the first
 * of its wall kicks that does (see `rotationCandidates`), or `screen`
 * unchanged if none of them do. Does nothing if there's no active
 * piece.
 *
 * @since 1.0.0
 * @category Destructors
 */
export const rotateClockwise: (screen: GameScreen) => GameScreen =
  tryRotate('cw')

/**
 * Rotate the active piece 90° counter-clockwise — `rotateClockwise`,
 * the other way around.
 *
 * @since 1.0.0
 * @category Destructors
 */
export const rotateCounterClockwise: (screen: GameScreen) => GameScreen =
  tryRotate('ccw')

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
