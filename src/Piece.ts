/** @since 1.0.0 */

import { Position, TetrominoId } from './Board'
import { TETROMINO_ROTATIONS, wallKickOffsets } from './Tetromino'
import { assoc } from './internal'

// -----------------------------------------------------------------------------
// model
// -----------------------------------------------------------------------------

/**
 * Which of a Tetromino's four Super Rotation System states a piece is
 * currently in — spawn ("0"), clockwise once ("R"), twice ("2"), or
 * counter-clockwise once ("L") — encoded 0-3 in that same clockwise
 * order, since turning a piece only ever needs to step this forward or
 * back by one (see `rotationCandidates`) to know which of
 * `TETROMINO_ROTATIONS`' shapes, and which of `wallKickOffsets`' kicks,
 * apply next.
 *
 * @since 1.0.0
 * @category Model
 */
export type Orientation = 0 | 1 | 2 | 3

/**
 * The Tetromino currently falling: its shape, the absolute board
 * position of each of its four blocks, and which of its four rotation
 * states it's currently in.
 *
 * @since 1.0.0
 * @category Model
 */
export interface Piece {
  readonly id: TetrominoId
  readonly cells: ReadonlyArray<Position>
  readonly orientation: Orientation
}

/**
 * Which way to turn a piece — see `rotationCandidates`.
 *
 * @since 1.0.0
 * @category Model
 */
export type RotationDirection = 'cw' | 'ccw'

// -----------------------------------------------------------------------------
// internal
// -----------------------------------------------------------------------------

const setCells = assoc<Piece>()('cells')

const nextOrientation =
  (direction: RotationDirection) =>
  (orientation: Orientation): Orientation =>
    ((orientation + (direction === 'cw' ? 1 : 3)) % 4) as Orientation

const firstCell = (cells: ReadonlyArray<Position>): Position =>
  cells[0] ?? [0, 0]

// -----------------------------------------------------------------------------
// destructors
// -----------------------------------------------------------------------------

/**
 * Move every cell of a piece down by one row. Doesn't check for
 * collisions — see `collides`.
 *
 * @since 1.0.0
 * @category Destructors
 */
export const shiftDown = (piece: Piece): Piece =>
  setCells(piece.cells.map(([x, y]): Position => [x, y + 1]))(piece)

/**
 * Move every cell of a piece one column to the left. Doesn't check for
 * collisions — see `collides`.
 *
 * @since 1.0.0
 * @category Destructors
 */
export const shiftLeft = (piece: Piece): Piece =>
  setCells(piece.cells.map(([x, y]): Position => [x - 1, y]))(piece)

/**
 * Move every cell of a piece one column to the right. Doesn't check for
 * collisions — see `collides`.
 *
 * @since 1.0.0
 * @category Destructors
 */
export const shiftRight = (piece: Piece): Piece =>
  setCells(piece.cells.map(([x, y]): Position => [x + 1, y]))(piece)

/**
 * Every way `piece` might land after turning `direction` 90°, in the
 * order the Super Rotation System's wall kicks say to try them: the
 * plain in-place rotation first (`wallKickOffsets`' own first entry is
 * always `[0, 0]`), then each of that piece's kick offsets, nudging
 * that same rotation a cell or two at a time until one finally clears a
 * wall or a settled block. Purely geometric — it doesn't know about the
 * board, so trying each candidate against it and keeping the first that
 * fits (see `Gravity.ts`'s `rotateClockwise`) is what actually resolves
 * a rotation; if none of them fit, the piece doesn't turn at all. `O`
 * looks the same in every orientation, so its only "candidate" is
 * itself, unchanged.
 *
 * @since 1.0.0
 * @category Destructors
 */
export const rotationCandidates =
  (direction: RotationDirection) =>
  (piece: Piece): ReadonlyArray<Piece> => {
    if (piece.id === 'O') return [piece]

    const orientation = nextOrientation(direction)(piece.orientation)
    const fromShape = TETROMINO_ROTATIONS[piece.id][piece.orientation]
    const toShape = TETROMINO_ROTATIONS[piece.id][orientation]
    const [originX, originY] = firstCell(piece.cells)
    const [localX, localY] = firstCell(fromShape)
    const origin: Position = [originX - localX, originY - localY]

    return wallKickOffsets(piece.id)(piece.orientation)(direction).map(
      ([dx, dy]): Piece => ({
        id: piece.id,
        orientation,
        cells: toShape.map(
          ([x, y]): Position => [origin[0] + x + dx, origin[1] + y + dy]
        ),
      })
    )
  }

/**
 * Whether a piece occupies board position `(x, y)`.
 *
 * @since 1.0.0
 * @category Destructors
 */
export const isPieceCell =
  (piece: Pick<Piece, 'cells'>) =>
  (x: number, y: number): boolean =>
    piece.cells.some(([px, py]) => px === x && py === y)
