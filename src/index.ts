/** @since 1.0.0 */

import { pipe } from 'fp-ts/function'

export * from './Board'
export * from './Piece'
export * from './Collision'
export * from './Lines'
export * from './Tetromino'
export * from './Gravity'
export * from './Level'
export * from './GameScreen'
export * from './GameFrame'
export * from './Renderer'
export * from './Html'
export * from './Output'

// -----------------------------------------------------------------------------
// greetings
// -----------------------------------------------------------------------------

/**
 * It's a greeting
 *
 * @since 1.0.0
 * @category Greetings
 * @example
 *   import { greet } from 'tetris-fp'
 *   assert.deepStrictEqual(greet('World'), 'Hello, World!')
 */
export const greet = (name: string): string =>
  pipe(`Hello`, (x) => `${x}, ${name}!`)
