import * as fc from 'fast-check'
import {
  INITIAL_LEVEL,
  LINES_PER_LEVEL,
  dropIntervalMs,
  levelForLines,
} from '../src'

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

  it('drops noticeably faster (20%) at each of the next few levels', () => {
    expect(dropIntervalMs(INITIAL_LEVEL + 1)).toBe(640)
    expect(dropIntervalMs(INITIAL_LEVEL + 2)).toBe(512)
    expect(dropIntervalMs(INITIAL_LEVEL + 3)).toBe(410)
  })

  it('bottoms out at the fastest speed instead of continuing to shrink forever', () => {
    fc.assert(
      fc.property(fc.integer({ min: 20, max: 1000 }), (level) => {
        expect(dropIntervalMs(level)).toBe(dropIntervalMs(20))
      })
    )
  })
})

describe('levelForLines', () => {
  it('starts at INITIAL_LEVEL with no lines cleared', () => {
    expect(levelForLines(0)).toBe(INITIAL_LEVEL)
  })

  it('stays at INITIAL_LEVEL right up until LINES_PER_LEVEL', () => {
    expect(levelForLines(LINES_PER_LEVEL - 1)).toBe(INITIAL_LEVEL)
  })

  it('goes up by exactly one at each LINES_PER_LEVEL threshold', () => {
    expect(levelForLines(LINES_PER_LEVEL)).toBe(INITIAL_LEVEL + 1)
    expect(levelForLines(LINES_PER_LEVEL * 2)).toBe(INITIAL_LEVEL + 2)
  })

  it('never goes down as the line count goes up', () => {
    fc.assert(
      fc.property(fc.nat(1000), (totalLines) => {
        expect(levelForLines(totalLines + 1)).toBeGreaterThanOrEqual(
          levelForLines(totalLines)
        )
      })
    )
  })
})
