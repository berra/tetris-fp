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
 * How many lines you need to clear, in total, to go up one level.
 *
 * @since 1.0.0
 * @category Constants
 */
export const LINES_PER_LEVEL = 10

/**
 * The drop speed at `INITIAL_LEVEL`, in milliseconds per row.
 */
const BASE_DROP_INTERVAL_MS = 800

/**
 * How much of the previous level's drop interval each level keeps — 0.8
 * means every level drops 20% faster than the one before it. A gentler
 * (closer-to-1) curve is more authentic to the classic NES/Game Boy speed
 * table this used to be, but 20% per level is what actually makes
 * leveling up *feel* like something happened.
 */
const DROP_INTERVAL_DECAY = 0.8

/**
 * The fastest a piece can ever drop, in milliseconds per row, no matter
 * how high the level climbs.
 */
const FASTEST_DROP_INTERVAL_MS = 80

// -----------------------------------------------------------------------------
// destructors
// -----------------------------------------------------------------------------

/**
 * The drop speed for a given level, in milliseconds per row: 20% faster
 * for every level past `INITIAL_LEVEL`, down to `FASTEST_DROP_INTERVAL_MS`.
 * Clamps to `INITIAL_LEVEL`'s speed at the low end.
 *
 * @since 1.0.0
 * @category Destructors
 * @example
 *   import { INITIAL_LEVEL, dropIntervalMs } from 'tetris-fp'
 *   assert.deepStrictEqual(dropIntervalMs(INITIAL_LEVEL), 800)
 *   assert.deepStrictEqual(dropIntervalMs(INITIAL_LEVEL + 1), 640)
 */
export const dropIntervalMs = (level: number): number => {
  const levelsPast = Math.max(level, INITIAL_LEVEL) - INITIAL_LEVEL
  const interval =
    BASE_DROP_INTERVAL_MS * Math.pow(DROP_INTERVAL_DECAY, levelsPast)
  return Math.max(Math.round(interval), FASTEST_DROP_INTERVAL_MS)
}

/**
 * The level for a given running total of cleared lines — one level up
 * for every `LINES_PER_LEVEL` lines. Since the total only ever grows,
 * so does the level; there's no leveling back down.
 *
 * @since 1.0.0
 * @category Destructors
 * @example
 *   import { INITIAL_LEVEL, levelForLines, LINES_PER_LEVEL } from 'tetris-fp'
 *   assert.deepStrictEqual(levelForLines(0), INITIAL_LEVEL)
 *   assert.deepStrictEqual(levelForLines(LINES_PER_LEVEL), INITIAL_LEVEL + 1)
 */
export const levelForLines = (totalLines: number): number =>
  INITIAL_LEVEL + Math.floor(totalLines / LINES_PER_LEVEL)
