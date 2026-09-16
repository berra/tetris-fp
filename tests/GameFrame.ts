import { INITIAL_LEVEL, initialFrame, playingFrame, togglePause } from '../src'

describe('initialFrame', () => {
  it('starts on the title screen', () => {
    expect(initialFrame.mode).toBe('start')
  })
})

describe('playingFrame', () => {
  it('starts playing at INITIAL_LEVEL', () => {
    expect(playingFrame.mode).toBe('playing')
    expect(playingFrame.screen.level).toBe(INITIAL_LEVEL)
  })
})

describe('togglePause', () => {
  it('pauses a playing game, leaving the screen untouched', () => {
    const paused = togglePause(playingFrame)
    expect(paused.mode).toBe('paused')
    expect(paused.screen).toBe(playingFrame.screen)
  })

  it('resumes a paused game back to playing, leaving the screen untouched', () => {
    const paused = togglePause(playingFrame)
    const resumed = togglePause(paused)
    expect(resumed.mode).toBe('playing')
    expect(resumed.screen).toBe(paused.screen)
  })

  it('does nothing on the title screen', () => {
    expect(togglePause(initialFrame)).toEqual(initialFrame)
  })

  it('does nothing on the game-over screen', () => {
    const gameOverFrame = {
      mode: 'gameOver' as const,
      screen: playingFrame.screen,
    }
    expect(togglePause(gameOverFrame)).toEqual(gameOverFrame)
  })
})
