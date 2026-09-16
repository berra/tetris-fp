/** @since 1.0.0 */

import { GameScreen, initialScreen } from './GameScreen'

// -----------------------------------------------------------------------------
// model
// -----------------------------------------------------------------------------

/**
 * Which screen is currently shown: the title screen, the game itself, or
 * the game-over screen once the stack has reached the top.
 *
 * @since 1.0.0
 * @category Model
 */
export type GameMode = 'start' | 'playing' | 'gameOver'

/**
 * Everything the renderer needs to draw the whole application, title
 * screen included: the current mode, plus the game screen to fall back on
 * while playing.
 *
 * @since 1.0.0
 * @category Model
 */
export interface GameFrame {
  readonly mode: GameMode
  readonly screen: GameScreen
}

// -----------------------------------------------------------------------------
// constructors
// -----------------------------------------------------------------------------

/**
 * The title screen: "press any key to start".
 *
 * @since 1.0.0
 * @category Constructors
 */
export const initialFrame: GameFrame = { mode: 'start', screen: initialScreen }

/**
 * The frame a game is in the moment it starts, at `INITIAL_LEVEL`.
 *
 * @since 1.0.0
 * @category Constructors
 */
export const playingFrame: GameFrame = {
  mode: 'playing',
  screen: initialScreen,
}
