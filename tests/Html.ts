import {
  BOARD_WIDTH,
  PIXEL_SCALE,
  PREVIEW_HEIGHT,
  PREVIEW_ROW_OFFSET,
  SCREEN_ROWS,
  TETROMINO_IDS,
  boardOnlyText,
  toColoredGridHtml,
  toGameHtmlDocument,
  toGridHtml,
  toHtmlDocument,
} from '../src'

describe('toGridHtml', () => {
  it('never colors anything, even a piece letter', () => {
    TETROMINO_IDS.forEach((id) => {
      expect(toGridHtml(id)).toBe(`<div class="cell">${id}</div>`)
    })
  })
})

describe('toColoredGridHtml', () => {
  it('gives a piece letter in the playfield its own piece-specific class', () => {
    TETROMINO_IDS.forEach((id) => {
      expect(toColoredGridHtml(id)).toContain(`class="cell piece-${id}"`)
    })
  })

  it('leaves non-piece characters uncolored', () => {
    expect(toColoredGridHtml('.')).toContain('class="cell">')
    expect(toColoredGridHtml('5')).toContain('class="cell">')
  })

  it('does not color a piece letter that only appears past the playfield, in a sidebar label', () => {
    // "SCORE" contains 'S' and 'O' — both real Tetromino letters — but
    // sitting in the sidebar (columns >= BOARD_WIDTH), where they're just
    // label text, not a brick.
    const line = '.'.repeat(BOARD_WIDTH) + 'SCORE'
    const html = toColoredGridHtml(line)
    expect(html).not.toContain('piece-S')
    expect(html).not.toContain('piece-O')
  })

  it('still colors a real piece in the playfield on a line that also has sidebar text', () => {
    const line = 'T' + '.'.repeat(BOARD_WIDTH - 1) + 'SCORE'
    const html = toColoredGridHtml(line)
    expect(html).toContain('piece-T')
    expect(html).not.toContain('piece-S')
    expect(html).not.toContain('piece-O')
  })

  it('colors a piece letter on the next-piece preview rows too', () => {
    const labelRow = '.'.repeat(BOARD_WIDTH) + 'NEXT'
    const previewRow = '.'.repeat(BOARD_WIDTH) + 'T...'
    const rows = Array.from({ length: PREVIEW_ROW_OFFSET }, () => labelRow)
    const html = toColoredGridHtml(rows.concat(previewRow).join('\n'))
    expect(html).toContain('piece-T')
  })

  it('does not color a piece letter on the NEXT label row itself, right above the preview', () => {
    // "NEXT" contains a 'T' — a real Tetromino letter — but that row is
    // the label, one row above where the preview actually starts.
    const labelRow = '.'.repeat(BOARD_WIDTH) + 'NEXT'
    const html = toColoredGridHtml(labelRow)
    expect(html).not.toContain('piece-T')
  })

  it('does not color a piece letter on the row right after the preview ends', () => {
    const blankRow = '.'.repeat(BOARD_WIDTH) + '....'
    const afterPreviewRow = '.'.repeat(BOARD_WIDTH) + 'SCORE'
    const rows = Array.from(
      { length: PREVIEW_ROW_OFFSET + PREVIEW_HEIGHT },
      () => blankRow
    )
    const html = toColoredGridHtml(rows.concat(afterPreviewRow).join('\n'))
    expect(html).not.toContain('piece-S')
    expect(html).not.toContain('piece-O')
  })
})

describe('boardOnlyText', () => {
  it('keeps only the first BOARD_WIDTH characters of every line', () => {
    const line = 'T'.repeat(BOARD_WIDTH) + 'SCORE0123'
    expect(boardOnlyText(line)).toBe('T'.repeat(BOARD_WIDTH))
  })

  it('preserves the number of lines', () => {
    const lines = Array.from({ length: SCREEN_ROWS }, (_, y) => `row${y}`)
    expect(boardOnlyText(lines.join('\n')).split('\n').length).toBe(SCREEN_ROWS)
  })
})

describe('toHtmlDocument', () => {
  const ruleFor = (html: string, id: string): string | undefined =>
    html.match(new RegExp(`\\.piece-${id} \\{[^}]*\\}`))?.[0]

  const propertyFor =
    (property: string) =>
    (html: string, id: string): string | undefined =>
      ruleFor(html, id)?.match(new RegExp(`${property}: ([^;]+);`))?.[1]

  const colorFor = propertyFor('color')
  const backgroundFor = propertyFor('background')
  const borderFor = propertyFor('border')

  it('defines a color, a background and a border for every piece', () => {
    const html = toHtmlDocument('.')
    TETROMINO_IDS.forEach((id) => {
      expect(colorFor(html, id)).toBeDefined()
      expect(backgroundFor(html, id)).toBeDefined()
      expect(borderFor(html, id)).toBeDefined()
    })
  })

  it('gives every piece a distinct color', () => {
    const html = toHtmlDocument('.')
    const colors = TETROMINO_IDS.map((id) => colorFor(html, id))
    expect(new Set(colors).size).toBe(TETROMINO_IDS.length)
  })

  it('borders a block in its own (unlightened) color', () => {
    const html = toHtmlDocument('.')
    TETROMINO_IDS.forEach((id) => {
      const color = colorFor(html, id)
      expect(borderFor(html, id)).toBe(`${PIXEL_SCALE / 2}px solid ${color}`)
    })
  })

  it('fills a block with a lighter mix of its own color, not the color itself', () => {
    const html = toHtmlDocument('.')
    TETROMINO_IDS.forEach((id) => {
      const color = colorFor(html, id)
      const background = backgroundFor(html, id)
      expect(background).toBeDefined()
      expect(background).not.toBe(color)
    })
  })

  it('includes the small-screen board and stats overlay alongside the desktop screen', () => {
    const html = toHtmlDocument('T')
    expect(html).toContain('id="mobile-board"')
    expect(html).toContain('id="mobile-stats"')
    // the mobile board is the playfield-only slice, same coloring rules
    expect(html).toContain('piece-T')
  })

  it('shows the board (not the plain-text message) for real screen content', () => {
    const html = toHtmlDocument('T')
    expect(html).toMatch(/class="mobile-board active"/)
    expect(html).toMatch(/class="mobile-stats active"/)
    expect(html).not.toMatch(/class="mobile-message active"/)
  })
})

describe('toGameHtmlDocument', () => {
  it('includes small-screen pause and hard drop buttons', () => {
    const html = toGameHtmlDocument()
    expect(html).toContain('data-key="Escape"')
    expect(html).toContain('data-key=" "')
  })

  it('includes the small-screen control buttons, one per arrow key', () => {
    const html = toGameHtmlDocument()
    ;['ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight'].forEach((key) => {
      expect(html).toContain(`data-key="${key}"`)
    })
  })

  it('includes the small-screen board and stats overlay too', () => {
    const html = toGameHtmlDocument()
    expect(html).toContain('id="mobile-board"')
    expect(html).toContain('id="mobile-stats"')
  })

  it('server-renders the title screen as plain centered text, not a character grid, on the small-screen layout', () => {
    const html = toGameHtmlDocument()
    expect(html).toMatch(/class="mobile-message active"/)
    expect(html).not.toMatch(/class="mobile-board active"/)
    expect(html).not.toMatch(/class="mobile-stats active"/)
    expect(html).toContain('id="mobile-message"')
    expect(html).toMatch(/id="mobile-message"[^<]*TETRIS/)
  })
})
