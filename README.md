# tetris-fp

[![Test](http:///actions/workflows/build.yml/badge.svg)](http:///actions/workflows/build.yml)

[API Docs](http://)

---

<!-- AUTO-GENERATED-CONTENT:START (TOC) -->

- [Install](#install)
- [Example](#example)

<!-- AUTO-GENERATED-CONTENT:END -->

## Install

Uses `fp-ts` as a peer dependency.

```bash
yarn add fp-ts tetris-fp
```

or

```bash
npm install fp-ts tetris-fp
```

## Example

Render a game screen as ASCII text, sized like a real Game Boy Tetris
screen (a 20x18 tile grid — the playfield fills the left 10 columns, with
next piece / score / level / lines in the sidebar), and write it to a
standalone HTML file:

```ts
import { emptyBoard, writeScreenToHtmlFile } from 'tetris-fp'

writeScreenToHtmlFile('./tetris.html')({
  board: emptyBoard,
  active: null,
  next: 'T',
  score: 0,
  level: 1,
  lines: 0,
  highScore: 0,
})()
```

`renderScreen` and `toHtmlDocument` are exposed separately too, if you just
want the ASCII text or the HTML string without touching the filesystem.

## Game mode

`writeGameToHtmlFile` writes a standalone, playable HTML page: it opens on
a title screen ("press any key to start") and switches to the game, at
`INITIAL_LEVEL`, on the first keypress.

```ts
import { writeGameToHtmlFile } from 'tetris-fp'

writeGameToHtmlFile('./tetris.html')()
```

The page it writes (`tetris.html`) loads `game.js` next to it — a bundle
of [`src/browser/main.ts`](src/browser/main.ts), built by
`npm run build:browser` (esbuild; `npm run build` runs it automatically),
that wires the library's pure game functions up to the keyboard:

| Key           | Action                   |
| ------------- | ------------------------ |
| `←` / `→`     | Move left / right        |
| `↑`           | Rotate clockwise         |
| `↓`           | Rotate counter-clockwise |
| `Space`       | Hard drop                |
| `Esc`         | Pause / resume           |

Pausing (`togglePause`) freezes the game screen exactly as it was — the
gravity loop stops — and darkens it under a centered "PAUSED" overlay
(`.pause-overlay` in [`Html.ts`](src/Html.ts)); every other key is
ignored until `Esc` resumes it.

Rotation follows the [Super Rotation
System](https://tetris.wiki/Super_Rotation_System): every piece tracks
which of its four states (spawn, clockwise once, twice, or
counter-clockwise once) it's currently in (`Piece.orientation`), and
each state is a fixed shape in the piece's own bounding box
(`TETROMINO_ROTATIONS` in [`Tetromino.ts`](src/Tetromino.ts) — 3x3 for
J/L/S/T/Z, 4x4 for I, derived by turning the spawn shape around the
box's center; O only ever has the one). Turning a piece tries a short
list of candidate positions in order (`Piece.rotationCandidates`): the
plain in-place rotation first, then that piece's wall kicks
(`wallKickOffsets` — I gets its own wider table, the other five share
one), nudging it a cell or two at a time until one doesn't collide with
a wall or a settled block — which is what lets a piece rotate flush
against a wall, or hop up out of a shallow well, instead of just
refusing. `rotateClockwise`/`rotateCounterClockwise` in
[`Gravity.ts`](src/Gravity.ts) keep the first candidate that fits, or
leave the piece untouched if none do.

On a narrow screen (below `MOBILE_BREAKPOINT_PX`, a `@media` query in
[`Html.ts`](src/Html.ts)), the layout switches: the sidebar is dropped
for a condensed one-row overlay (`#mobile-stats`, 11px, "SCORE X LEVEL Y
HIGH Z") on top of the playfield, which now fills the full screen width
(`#mobile-board`, via `renderMobileFrame`). Below it, large arrow buttons
(`.controls`, an ↑ over ◀▼▶) cover the same keys as the arrow keys —
each just dispatches its key as a real `keydown`, so there's no separate
button-handling logic from the keyboard's.

The title and game-over screens are prose, not bricks, so on this same
narrow layout they swap the character grid for plain, normally-wrapped,
CSS-centered text instead (`#mobile-message`, from `START_SCREEN_LINES`
/ `gameOverLines` in [`Renderer.ts`](src/Renderer.ts) directly — not
`renderMobileFrame`'s re-centered ASCII grid, which stays reserved for
the playfield). `#mobile-board` and `#mobile-message` each carry an
`.active` class the client toggles based on `frame.mode`, so exactly
one shows at a time; `#mobile-stats` is hidden along with the board,
since it has nothing to overlay during a message.

Running `npm run build` followed by `npm start` serves `dist/` (including
`tetris.html` and `game.js`) at `http://localhost:7878`.

In the HTML output, every brick in the playfield is colored by its
Tetromino type (the classic guideline colors — see `PIECE_COLORS` in
[`Html.ts`](src/Html.ts)), on a neutral gray screen (`SCREEN_BACKGROUND`)
chosen so those colors don't clash with a tinted background. Coloring
only ever applies to the playfield: the same seven letters turn up in
sidebar labels (`SCORE`, `LEVEL`, ...) and in the title/game-over
screens' text, and those stay plain.

Each brick is drawn as an actual block, not just a colored letter: its
own color borders it, and a much lighter mix of that same color (see
`lighten`) fills it — so a piece reads as a row of bordered blocks, the
letter just labeling which one. The `NEXT` preview gets the same
treatment, on its own fixed few rows (`PREVIEW_ROW_OFFSET`,
`PREVIEW_HEIGHT`, `PREVIEW_WIDTH`) — everywhere else in the sidebar stays
plain, since the same seven letters also turn up in label text there.

Clearing lines scores the classic single/double/triple/tetris values —
40/100/300/800 — scaled by `level` (see `scoreForLines`), and locking a
piece that doesn't complete a line scores nothing. Every clear counts
toward `level` too: it goes up by one for every `LINES_PER_LEVEL` (10)
lines cleared in total (see `levelForLines`) — a level-up is scored at
the level it happened at, not the one it just reached. Each level drops
pieces 20% faster than the last (`dropIntervalMs`, down to a floor of
80ms/row) — a deliberately steep curve so leveling up is actually felt,
rather than the classic NES/Game Boy table's much subtler early levels.
The stack topping out ends the game: the screen switches to "game over"
with the final score, and any key starts
a fresh game.

The `NEXT` piece shown in the sidebar is a real one-piece lookahead: it's
drawn before it's ever shown, and it's exactly what spawns once the
current piece locks — `tick` manages this queue (`GameScreen.next`)
itself, so `spawn` only ever needs the id to activate right now.

`HIGH SCORE` in the sidebar is backed by `localStorage` (see
[`src/browser/highScore.ts`](src/browser/highScore.ts)) and persists
across reloads. It's re-checked against the current score on every
repaint, so it always reflects the highest score ever reached in this
browser, even mid-run — `GameScreen.highScore` itself is just a plain
display field the pure library never touches; only the browser client
updates it, from `localStorage`.
