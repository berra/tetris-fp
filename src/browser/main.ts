// The bundled client for the playable page (see `toGameHtmlDocument` in
// ../Html.ts). Not part of the published library — this is the one place
// the game's pure functions get wired up to the DOM and a keyboard.

import { toColoredGridHtml, toGridHtml } from '../Html'
import {
  GameFrame,
  initialFrame,
  playingFrame,
  togglePause,
} from '../GameFrame'
import { GameScreen } from '../GameScreen'
import {
  gameOverLines,
  renderFrame,
  renderMobileFrame,
  START_SCREEN_LINES,
} from '../Renderer'
import { dropIntervalMs } from '../Level'
import { randomTetrominoId } from '../Tetromino'
import { assoc } from '../internal'
import { updateHighScore } from './highScore'
import {
  hardDrop,
  moveLeft,
  moveRight,
  rotateClockwise,
  rotateCounterClockwise,
  tickFrame,
} from '../Gravity'

const setScreen = assoc<GameFrame>()('screen')
const setNext = assoc<GameScreen>()('next')
const setHighScore = assoc<GameScreen>()('highScore')

const requireElement = (id: string): HTMLElement => {
  const element = document.getElementById(id)
  if (element === null) {
    throw new Error(`missing #${id} element`)
  }
  return element
}

const screen = requireElement('screen')
const mobileBoard = requireElement('mobile-board')
const mobileMessage = requireElement('mobile-message')
const mobileStats = requireElement('mobile-stats')
const pauseOverlay = requireElement('pause-overlay')
const controls = requireElement('controls')

let frame: GameFrame = initialFrame
let gravityTimeoutId: number | undefined

// The score last checked against localStorage — lets syncHighScore skip its
// localStorage read on paints where the score can't have changed (e.g. a
// plain move or rotation), rather than hitting storage on every keydown.
let lastSyncedScore = -1

// Keeps `screen.highScore` in sync with the persisted high score before
// every paint, so it's always showing the true max — this run's score
// included, the moment it beats the previous record.
const syncHighScore = (): void => {
  if (frame.screen.score === lastSyncedScore) return
  lastSyncedScore = frame.screen.score
  const highScore = updateHighScore(frame.screen.score)
  frame = setScreen(setHighScore(highScore)(frame.screen))(frame)
}

const paint = (): void => {
  syncHighScore()
  // Only the playing (or paused — same screen, just frozen) playfield is
  // safe to color by piece letter — the title and game-over screens'
  // text can contain the same letters.
  const toHtml =
    frame.mode === 'playing' || frame.mode === 'paused'
      ? toColoredGridHtml
      : toGridHtml
  screen.innerHTML = toHtml(renderFrame(frame))

  // On the small-screen layout, a title/game-over message is prose, not
  // bricks — show it as plain centered text (`#mobile-message`) instead
  // of the board's one-character-per-grid-cell treatment, and hide the
  // board (and its score overlay) while it's up.
  const isMessage = frame.mode === 'start' || frame.mode === 'gameOver'
  mobileBoard.classList.toggle('active', !isMessage)
  mobileStats.classList.toggle('active', !isMessage)
  mobileMessage.classList.toggle('active', isMessage)
  if (isMessage) {
    mobileMessage.textContent = (
      frame.mode === 'start'
        ? START_SCREEN_LINES
        : gameOverLines(frame.screen.score)
    ).join('\n')
  } else {
    mobileBoard.innerHTML = toHtml(renderMobileFrame(frame))
    mobileStats.textContent = `SCORE ${frame.screen.score}  LEVEL ${frame.screen.level}  HIGH ${frame.screen.highScore}`
  }
  pauseOverlay.style.display = frame.mode === 'paused' ? 'flex' : 'none'
}

const stopGravity = (): void => {
  if (gravityTimeoutId !== undefined) window.clearTimeout(gravityTimeoutId)
  gravityTimeoutId = undefined
}

// A self-rescheduling timeout rather than a plain `setInterval`: the
// level (and so the drop speed) can change on any tick, and re-reading
// `frame.screen.level` right before scheduling the next one is what
// makes the game actually speed up as the level rises, instead of
// ticking forever at whatever speed it started at.
const scheduleGravity = (): void => {
  stopGravity()
  gravityTimeoutId = window.setTimeout(() => {
    frame = tickFrame(randomTetrominoId())(frame)
    paint()
    if (frame.mode === 'gameOver') {
      stopGravity()
    } else {
      scheduleGravity()
    }
  }, dropIntervalMs(frame.screen.level))
}

const startGame = (): void => {
  // Seed the queue with the piece that's about to spawn, so the very
  // first `tick` below already has a real "next piece" to queue behind
  // it instead of a one-frame placeholder.
  const seededScreen = setNext(randomTetrominoId())(playingFrame.screen)
  const seeded = setScreen(seededScreen)(playingFrame)
  frame = tickFrame(randomTetrominoId())(seeded)
  paint()
  scheduleGravity()
}

window.addEventListener('keydown', (event) => {
  if (frame.mode === 'start' || frame.mode === 'gameOver') {
    startGame()
    return
  }

  // Frozen while paused — the only way out is unpausing.
  if (frame.mode === 'paused' && event.key !== 'Escape') {
    return
  }

  switch (event.key) {
    case 'Escape':
      frame = togglePause(frame)
      if (frame.mode === 'paused') {
        stopGravity()
      } else {
        scheduleGravity()
      }
      break
    case 'ArrowLeft':
      frame = setScreen(moveLeft(frame.screen))(frame)
      break
    case 'ArrowRight':
      frame = setScreen(moveRight(frame.screen))(frame)
      break
    case 'ArrowUp':
      frame = setScreen(rotateClockwise(frame.screen))(frame)
      break
    case 'ArrowDown':
      frame = setScreen(rotateCounterClockwise(frame.screen))(frame)
      break
    case ' ':
      // Lock the dropped piece and spawn its replacement immediately,
      // rather than leaving the board piece-less until the next tick.
      frame = tickFrame(randomTetrominoId())(
        setScreen(hardDrop(frame.screen))(frame)
      )
      // A hard drop can level the game up too — reschedule so the next
      // natural tick uses the (possibly now faster) current speed,
      // rather than the stale delay from before this drop.
      if (frame.mode === 'gameOver') {
        stopGravity()
      } else {
        scheduleGravity()
      }
      break
    default:
      return
  }

  event.preventDefault()
  paint()
})

// The small-screen control buttons (see `.controls` in ../Html.ts) each
// just carry the key they stand for — firing that as a real keydown
// means the listener above handles a tap exactly like it would a
// keypress, with no separate button-handling logic to keep in sync.
controls.addEventListener('click', (event) => {
  const button =
    event.target instanceof HTMLElement
      ? event.target.closest('.control-btn')
      : null
  const key = button instanceof HTMLElement ? button.dataset.key : undefined
  if (key !== undefined) {
    window.dispatchEvent(new KeyboardEvent('keydown', { key }))
  }
})

paint()
