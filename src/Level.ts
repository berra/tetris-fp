/** @since 1.0.0 */

// -----------------------------------------------------------------------------
// constants
// -----------------------------------------------------------------------------

/**
 * The level a new game starts at.
 *
 * @since 1.0.0
 * @category Constants
 */
export const INITIAL_LEVEL = 1

/**
 * How long a piece takes to drop one row, in milliseconds, indexed by level
 * (level 1 first). Loosely modelled on the classic NES/Game Boy speed
 * curve. Levels beyond the end of this table all fall at the fastest
 * defined speed.
 */
const DROP_INTERVALS_MS: ReadonlyArray<number> = [
  800, 720, 630, 550, 470, 380, 300, 220, 130, 100, 80, 80, 80, 70, 70, 70, 50,
  50, 50, 30,
]

const FASTEST_DROP_INTERVAL_MS =
  DROP_INTERVALS_MS[DROP_INTERVALS_MS.length - 1] ?? 30

// -----------------------------------------------------------------------------
// destructors
// -----------------------------------------------------------------------------

/**
 * The drop speed for a given level, in milliseconds per row. Clamps to
 * `INITIAL_LEVEL` at the low end and to the fastest defined speed at the
 * high end.
 *
 * @since 1.0.0
 * @category Destructors
 * @example
 *   import { INITIAL_LEVEL, dropIntervalMs } from 'tetris-fp'
 *   assert.deepStrictEqual(dropIntervalMs(INITIAL_LEVEL), 800)
 */
export const dropIntervalMs = (level: number): number =>
  DROP_INTERVALS_MS[
    Math.min(Math.max(level, INITIAL_LEVEL), DROP_INTERVALS_MS.length) - 1
  ] ?? FASTEST_DROP_INTERVAL_MS
