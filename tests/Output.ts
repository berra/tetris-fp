import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import {
  GameScreen,
  emptyBoard,
  writeGameToHtmlFile,
  writeScreenToHtmlFile,
} from '../src'

const tempHtmlFilePath = (): string =>
  path.join(os.tmpdir(), `tetris-fp-output-test-${Date.now()}-${Math.random()}.html`)

const sampleScreen: GameScreen = {
  board: emptyBoard,
  active: null,
  next: 'T',
  score: 0,
  level: 1,
  lines: 0,
  highScore: 0,
}

describe('writeScreenToHtmlFile', () => {
  it('writes a standalone HTML document for the given screen', () => {
    const filePath = tempHtmlFilePath()
    writeScreenToHtmlFile(filePath)(sampleScreen)()

    const contents = fs.readFileSync(filePath, 'utf8')
    expect(contents).toContain('<!DOCTYPE html>')
    expect(contents).toContain('id="screen"')
    // a static snapshot page, not the playable one — no game bundle
    expect(contents).not.toContain('game.js')

    fs.unlinkSync(filePath)
  })
})

describe('writeGameToHtmlFile', () => {
  it('writes the playable page, wired up to the game bundle', () => {
    const filePath = tempHtmlFilePath()
    writeGameToHtmlFile(filePath)()

    const contents = fs.readFileSync(filePath, 'utf8')
    expect(contents).toContain('<!DOCTYPE html>')
    expect(contents).toContain('id="screen"')
    expect(contents).toContain('<script src="game.js"></script>')

    fs.unlinkSync(filePath)
  })
})
