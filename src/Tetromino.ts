/** @since 1.0.0 */

import { IO } from 'fp-ts/IO'
import { BOARD_WIDTH, Position, TetrominoId } from './Board'
import type { Orientation, Piece, RotationDirection } from './Piece'

// -----------------------------------------------------------------------------
// constants
// -----------------------------------------------------------------------------

/**
 * All seven Tetromino ids.
 *
 * @since 1.0.0
 * @category Constants
 */
export const TETROMINO_IDS: ReadonlyArray<TetrominoId> = [
  'I',
  'O',
  'T',
  'S',
  'Z',
  'J',
  'L',
]

/**
 * Each Tetromino's shape, as `[column, row]` offsets within its 4-wide,
 * 2-tall spawn bounding box (the classic guideline spawn orientations).
 * `spawnPiece` positions this at the top of the board; `renderNextPiece`
 * (see `Renderer`) draws it as-is, unplaced, for the "next piece" preview.
 *
 * @since 1.0.0
 * @category Constants
 */
export const TETROMINO_SHAPES: Record<TetrominoId, ReadonlyArray<Position>> = {
  I: [
    [0, 1],
    [1, 1],
    [2, 1],
    [3, 1],
  ],
  O: [
    [1, 0],
    [2, 0],
    [1, 1],
    [2, 1],
  ],
  T: [
    [1, 0],
    [0, 1],
    [1, 1],
    [2, 1],
  ],
  S: [
    [1, 0],
    [2, 0],
    [0, 1],
    [1, 1],
  ],
  Z: [
    [0, 0],
    [1, 0],
    [1, 1],
    [2, 1],
  ],
  J: [
    [0, 0],
    [0, 1],
    [1, 1],
    [2, 1],
  ],
  L: [
    [2, 0],
    [0, 1],
    [1, 1],
    [2, 1],
  ],
}

const SPAWN_COLUMN = Math.floor((BOARD_WIDTH - 4) / 2)

type Shape = ReadonlyArray<Position>

// I's bounding box is 4x4 (center between its two middle rows/columns);
// every other piece that actually rotates (J, L, S, T, Z) uses a 3x3 box
// centered on its middle cell — see `TETROMINO_ROTATIONS`. O never
// rotates, so it has no box at all.
const rotationCenter = (id: TetrominoId): number => (id === 'I' ? 1.5 : 1)

// Turns a shape 90° clockwise within its own box: reflecting `[x, y]`
// through the box's `center` on both axes, the same way `Piece.rotate`
// used to turn a whole piece around one of its cells, but now around a
// fixed point so every one of a piece's four states lines up in the
// same box regardless of which state you start from.
const turnedClockwise =
  (center: number) =>
  (shape: Shape): Shape =>
    shape.map(([x, y]): Position => [2 * center - y, x])

const rotationStatesFor = (
  id: TetrominoId
): readonly [Shape, Shape, Shape, Shape] => {
  const spawn = TETROMINO_SHAPES[id]
  if (id === 'O') return [spawn, spawn, spawn, spawn]

  const turn = turnedClockwise(rotationCenter(id))
  const clockwiseOnce = turn(spawn)
  const clockwiseTwice = turn(clockwiseOnce)
  const clockwiseThrice = turn(clockwiseTwice)
  return [spawn, clockwiseOnce, clockwiseTwice, clockwiseThrice]
}

/**
 * Every Tetromino's four Super Rotation System states — spawn ("0"),
 * clockwise once ("R"), twice ("2"), and counter-clockwise once ("L"),
 * indexed 0-3 in that order — as `[column, row]` offsets within its own
 * fixed bounding box. Each one beyond "0" is just `TETROMINO_SHAPES[id]`
 * turned again around the box's center (see `turnedClockwise`), which is
 * exactly what keeps every state lined up in the same box for
 * `Piece.rotationCandidates` to place at a single shared origin — the
 * whole reason wall kicks (`wallKickOffsets`) only ever need to nudge a
 * piece a cell or two, not re-derive its position from scratch.
 *
 * @since 1.0.0
 * @category Constants
 */
export const TETROMINO_ROTATIONS: Record<
  TetrominoId,
  readonly [Shape, Shape, Shape, Shape]
> = Object.fromEntries(
  TETROMINO_IDS.map((id) => [id, rotationStatesFor(id)])
) as Record<TetrominoId, readonly [Shape, Shape, Shape, Shape]>

type WallKickOffset = readonly [number, number]

const kickKey = (from: Orientation, direction: RotationDirection): string =>
  `${from}${direction}`

// The Super Rotation System's wall-kick offsets for J, L, S, T and Z,
// keyed by the state rotated *from* and the direction turned — e.g.
// `kickKey(0, 'cw')` is "0->R". Each list is tried in order against the
// plain in-place rotation (always its own first, `[0, 0]`, entry) until
// one doesn't collide. Source: https://tetris.wiki/Super_Rotation_System
const JLSTZ_KICKS: Readonly<Record<string, ReadonlyArray<WallKickOffset>>> = {
  [kickKey(0, 'cw')]: [
    [0, 0],
    [-1, 0],
    [-1, 1],
    [0, -2],
    [-1, -2],
  ],
  [kickKey(1, 'ccw')]: [
    [0, 0],
    [1, 0],
    [1, -1],
    [0, 2],
    [1, 2],
  ],
  [kickKey(1, 'cw')]: [
    [0, 0],
    [1, 0],
    [1, -1],
    [0, 2],
    [1, 2],
  ],
  [kickKey(2, 'ccw')]: [
    [0, 0],
    [-1, 0],
    [-1, 1],
    [0, -2],
    [-1, -2],
  ],
  [kickKey(2, 'cw')]: [
    [0, 0],
    [1, 0],
    [1, 1],
    [0, -2],
    [1, -2],
  ],
  [kickKey(3, 'ccw')]: [
    [0, 0],
    [-1, 0],
    [-1, -1],
    [0, 2],
    [-1, 2],
  ],
  [kickKey(3, 'cw')]: [
    [0, 0],
    [-1, 0],
    [-1, -1],
    [0, 2],
    [-1, 2],
  ],
  [kickKey(0, 'ccw')]: [
    [0, 0],
    [1, 0],
    [1, 1],
    [0, -2],
    [1, -2],
  ],
}

// I gets its own, wider table under the Super Rotation System — its 4x4
// box means it can't reuse JLSTZ's offsets (built for a 3x3 one).
const I_KICKS: Readonly<Record<string, ReadonlyArray<WallKickOffset>>> = {
  [kickKey(0, 'cw')]: [
    [0, 0],
    [-2, 0],
    [1, 0],
    [-2, -1],
    [1, 2],
  ],
  [kickKey(1, 'ccw')]: [
    [0, 0],
    [2, 0],
    [-1, 0],
    [2, 1],
    [-1, -2],
  ],
  [kickKey(1, 'cw')]: [
    [0, 0],
    [-1, 0],
    [2, 0],
    [-1, 2],
    [2, -1],
  ],
  [kickKey(2, 'ccw')]: [
    [0, 0],
    [1, 0],
    [-2, 0],
    [1, -2],
    [-2, 1],
  ],
  [kickKey(2, 'cw')]: [
    [0, 0],
    [2, 0],
    [-1, 0],
    [2, 1],
    [-1, -2],
  ],
  [kickKey(3, 'ccw')]: [
    [0, 0],
    [-2, 0],
    [1, 0],
    [-2, -1],
    [1, 2],
  ],
  [kickKey(3, 'cw')]: [
    [0, 0],
    [1, 0],
    [-2, 0],
    [1, -2],
    [-2, 1],
  ],
  [kickKey(0, 'ccw')]: [
    [0, 0],
    [-1, 0],
    [2, 0],
    [-1, 2],
    [2, -1],
  ],
}

/**
 * The Super Rotation System's wall-kick candidates for turning `id`
 * `direction` starting from state `from` — the offsets
 * `Piece.rotationCandidates` tries, in order, against the plain in-place
 * rotation until one lands somewhere that doesn't collide. `O` never
 * calls this (it doesn't visually rotate at all); every other piece
 * uses either `I`'s own wider table or the shared one for J, L, S, T
 * and Z.
 *
 * @since 1.0.0
 * @category Constants
 */
export const wallKickOffsets =
  (id: TetrominoId) =>
  (from: Orientation) =>
  (direction: RotationDirection): ReadonlyArray<WallKickOffset> =>
    (id === 'I' ? I_KICKS : JLSTZ_KICKS)[kickKey(from, direction)] ?? [[0, 0]]

// -----------------------------------------------------------------------------
// constructors
// -----------------------------------------------------------------------------

/**
 * A freshly spawned piece: its shape, horizontally centered at the top of
 * the board, in its spawn ("0") orientation.
 *
 * @since 1.0.0
 * @category Constructors
 */
export const spawnPiece = (id: TetrominoId): Piece => ({
  id,
  orientation: 0,
  cells: TETROMINO_SHAPES[id].map(([x, y]): Position => [x + SPAWN_COLUMN, y]),
})

/**
 * Draw a uniformly random Tetromino id. Wrapped in `IO` because it isn't
 * pure — call it at the edge of the program (e.g. once per `tick`), then
 * pass the result into `spawnPiece` or `spawn`.
 *
 * @since 1.0.0
 * @category Constructors
 */
export const randomTetrominoId: IO<TetrominoId> = () => {
  const index = Math.floor(Math.random() * TETROMINO_IDS.length)
  return TETROMINO_IDS[index] ?? 'I'
}
