/** @since 1.0.0 */

import * as RA from 'fp-ts/ReadonlyArray'

// -----------------------------------------------------------------------------
// internal
// -----------------------------------------------------------------------------
//
// Small curried, pipe-friendly string/array/object helpers shared across
// the library. Not part of the public API.

/**
 * Join an array of strings with a separator.
 */
export const join =
  (separator: string) =>
  (xs: ReadonlyArray<string>): string =>
    xs.join(separator)

/**
 * Pad a string with trailing spaces (or truncate it) so it is exactly
 * `width` characters long.
 */
export const fitToWidth =
  (width: number) =>
  (line: string): string =>
    line.length >= width
      ? line.slice(0, width)
      : line + ' '.repeat(width - line.length)

/**
 * Pad an array with copies of `fill` (or truncate it) so it has exactly
 * `length` elements.
 */
export const fitToLength =
  <A>(length: number) =>
  (fill: A) =>
  (xs: ReadonlyArray<A>): ReadonlyArray<A> =>
    xs.length >= length
      ? xs.slice(0, length)
      : xs.concat(RA.replicate(length - xs.length, fill))

/**
 * Concatenate a pair of strings, as produced by `RA.zip`.
 */
export const concatTuple = ([a, b]: readonly [string, string]): string => a + b

/**
 * Look up a replacement for `key` in `table`, falling back to `key` itself.
 */
export const lookupOrSelf =
  (table: Readonly<Record<string, string>>) =>
  (key: string): string =>
    table[key] ?? key

/**
 * Center a string within `width` characters, padding with spaces (and
 * truncating if it's already too long). Always returns exactly `width`
 * characters.
 */
export const centerText =
  (width: number) =>
  (text: string): string => {
    const clamped = text.length > width ? text.slice(0, width) : text
    const totalPadding = width - clamped.length
    const left = Math.ceil(totalPadding / 2)
    return ' '.repeat(left) + clamped + ' '.repeat(totalPadding - left)
  }

/**
 * Center an array within `length` elements, padding with copies of `fill`
 * on both sides (and truncating if it's already too long).
 */
export const centerPad =
  <A>(length: number) =>
  (fill: A) =>
  (xs: ReadonlyArray<A>): ReadonlyArray<A> => {
    const totalPadding = Math.max(length - xs.length, 0)
    const top = Math.floor(totalPadding / 2)
    const bottom = totalPadding - top
    return RA.replicate(top, fill)
      .concat(xs, RA.replicate(bottom, fill))
      .slice(0, length)
  }

/**
 * Set one key of an object to a new value, returning a new object — a
 * curried, pipe-friendly alternative to `{ ...obj, [key]: value }`.
 *
 * TypeScript can't infer a curried function's own object type from its
 * key alone, so `T` has to be given explicitly: `assoc<Foo>()('key')`.
 * Partially applying that once per key (as `setFoo = assoc<Foo>()('key')`)
 * reads the same as any other curried helper here from then on.
 */
export const assoc =
  <T>() =>
  <K extends keyof T>(key: K) =>
  (value: T[K]) =>
  (obj: T): T => ({ ...obj, [key]: value })
