// Persists the high score across sessions via localStorage. Not part of
// the published library — localStorage only exists in a browser, so this
// lives alongside the rest of the DOM-touching client code.

const HIGH_SCORE_KEY = 'tetris-fp:high-score'

const readHighScore = (): number => {
  try {
    const stored = window.localStorage.getItem(HIGH_SCORE_KEY)
    const parsed = stored === null ? 0 : Number(stored)
    return Number.isFinite(parsed) ? parsed : 0
  } catch {
    // localStorage unavailable (private browsing, disabled storage, ...)
    // — just play without a persisted high score this session.
    return 0
  }
}

const writeHighScore = (score: number): void => {
  try {
    window.localStorage.setItem(HIGH_SCORE_KEY, String(score))
  } catch {
    // as above — nothing to fall back to, so nothing to do here.
  }
}

/**
 * The persisted high score, raised to `score` (and saved) if `score`
 * beats it. Safe to call every frame — it's a no-op read-and-compare
 * whenever `score` doesn't beat the stored value.
 */
export const updateHighScore = (score: number): number => {
  const current = readHighScore()
  if (score <= current) return current

  writeHighScore(score)
  return score
}
