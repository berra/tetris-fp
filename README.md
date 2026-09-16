# tetris-fp

[![Test](http:&#x2F;&#x2F;&#x2F;actions&#x2F;workflows&#x2F;build.yml&#x2F;badge.svg)](http:&#x2F;&#x2F;&#x2F;actions&#x2F;workflows&#x2F;build.yml)

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

| Key                 | Action                  |
| -------------------- | ------------------------ |
| `←` / `→`            | Move left / right        |
| `↑`                  | Rotate clockwise         |
| `Z`                  | Rotate counter-clockwise |
| `↓` / `Space`        | Hard drop                |

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
