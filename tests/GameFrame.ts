import { INITIAL_LEVEL, initialFrame, playingFrame } from '../src'

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
