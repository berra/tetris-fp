import { Position } from '../src'

// Order-independent comparison for a piece/candidate's cells — sorting
// turns "same cells, different array order" into a straightforward
// array-equality check.
export const cellSet = (cells: ReadonlyArray<Position>): ReadonlyArray<string> =>
  cells.map(([x, y]) => `${x},${y}`).sort()
