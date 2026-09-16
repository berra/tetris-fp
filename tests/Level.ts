import * as fc from 'fast-check'
import { INITIAL_LEVEL, dropIntervalMs } from '../src'

describe('dropIntervalMs', () => {
  it('starts at 800ms per row at INITIAL_LEVEL', () => {
    expect(dropIntervalMs(INITIAL_LEVEL)).toBe(800)
  })

  it('clamps levels below INITIAL_LEVEL to INITIAL_LEVEL speed', () => {
    fc.assert(
      fc.property(fc.integer({ min: -100, max: INITIAL_LEVEL }), (level) => {
        expect(dropIntervalMs(level)).toBe(dropIntervalMs(INITIAL_LEVEL))
      })
    )
  })

  it('never speeds up as the level goes up', () => {
    fc.assert(
      fc.property(fc.integer({ min: INITIAL_LEVEL, max: 100 }), (level) => {
        expect(dropIntervalMs(level + 1)).toBeLessThanOrEqual(
          dropIntervalMs(level)
        )
      })
    )
  })
})
