// https://github.com/type-challenges/type-challenges/blob/main/questions/00925-extreme-assert-array-index/README.md
import type { Add, IsNever, Split } from "../../../src/index.js";

declare const ARRAY_INDEX: unique symbol;

/*
 * Why a number literal: with noUncheckedIndexedAccess every read through an index signature
 * gets `| undefined`, whatever the signature's key type; only a real property escapes that.
 * So each key becomes a numeric literal, the asserted array gets a property of that name, and
 * Index<typeof array> is the literal. `i += 1` still compiles because the literal is declared
 * through `0 as Index<...>`, and `i < array.length` sees an ordinary number.
 */

type KeyAlphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_$";

// Two digits per character (10..73), so distinct keys always give distinct digit strings.
type CharCode<C extends string> =
  KeyAlphabet extends `${infer Before}${C}${string}` ? `${Add<Split<Before, "">["length"], 10>}` : never;
type KeyDigits<Key extends string> =
  Key extends `${infer C}${infer Rest}` ? `${CharCode<C>}${KeyDigits<Rest>}` : "";

/**
 * The key's number. Inference only succeeds when the digits survive a round trip through a
 * JS number, so an empty key, an unsupported character, or a key that is too long for a safe
 * integer (more than 7 characters, in general) is never and rejected by assertArrayIndex.
 */
type KeyNumber<Key extends string> = KeyDigits<Key> extends `${infer N extends number}` ? N : never;

type IndexedBy<N extends number, Item> =
  { readonly [ARRAY_INDEX]: N } & { readonly [P in N]: Item };

function assertArrayIndex<A extends readonly unknown[], Key extends string>(
  array: number extends A["length"] ? A : never, // tuples are already precisely typed
  key: IsNever<KeyNumber<Key>> extends true ? never : Key,
): asserts array is (number extends A["length"] ? A : never) & IndexedBy<KeyNumber<Key>, A[number]> {}

type Index<Array> = Array extends { readonly [ARRAY_INDEX]: infer N extends number } ? N : never;

// Official test cases from type-challenges@0b0b0b1, unchanged except for the import path.
const matrix = [
  [3, 4],
  [5, 6],
  [7, 8],
]

assertArrayIndex(matrix, 'rows')

let sum = 0

for (let i = 0 as Index<typeof matrix>; i < matrix.length; i += 1) {
  const columns: number[] = matrix[i]

  // @ts-expect-error: number | undefined in not assignable to number
  const x: number[] = matrix[0]

  assertArrayIndex(columns, 'columns')

  for (let j = 0 as Index<typeof columns>; j < columns.length; j += 1) {
    sum += columns[j]

    // @ts-expect-error: number | undefined in not assignable to number
    const y: number = columns[i]

    // @ts-expect-error: number | undefined in not assignable to number
    const z: number = columns[0]

    // @ts-expect-error: number[] | undefined in not assignable to number[]
    const u: number[] = matrix[j]
  }
}

const a: string[] = []

assertArrayIndex(a, 'a')

for (let p = 0 as Index<typeof a>; p < a.length; p += 1) {
  const value: string = a[p]

  // @ts-expect-error: string | undefined is not assignable to string
  const z: string = a[2]
}

a.push('qux')
// @ts-expect-error: number is not assignable to string
a.push(3)

for (const value of a) {
  const other: string = value
}

const b: number[] = []

assertArrayIndex(b, 'b')

for (let p = 0 as Index<typeof a>; p < b.length; p += 1) {
  // @ts-expect-error: number | undefined is not assignable to string
  const value: string = b[p]
}

const c: string[] = []

assertArrayIndex(c, 'c')

for (let p = 0; p < c.length; p += 1) {
  // @ts-expect-error: string | undefined is not assignable to string
  let value: string = c[p]

  // @ts-expect-error: string | undefined is not assignable to string
  value = c[0 as Index<typeof a>]
}

const d: readonly number[] = []

assertArrayIndex(d, 'd')

for (let p = 0 as Index<typeof d>; p < d.length; p += 1) {
  const value: number = d[p]

  // @ts-expect-error: only permits reading
  d[2] = 3
}

// @ts-expect-error: push does not exist on readonly
d.push(3)

const e: [number] = [0]

// @ts-expect-error: [number] is not assignable to never
assertArrayIndex(e, 'e')

const f: readonly [boolean] = [false]

// @ts-expect-error: [boolean] is not assignable to never
assertArrayIndex(f, 'f')

const tuple = [5, 7] as const

// @ts-expect-error: readonly [5, 7] is not assignable to never
assertArrayIndex(tuple, 'tuple')
