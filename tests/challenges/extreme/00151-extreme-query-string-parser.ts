// https://github.com/type-challenges/type-challenges/blob/main/questions/00151-extreme-query-string-parser/README.md
import type { Arg, Reduce, Simplify, Split, TypeFn } from "../../../src/index.js";

type ParsePair<Pair extends string> = Pair extends `${infer Key}=${infer Value}` ? [Key, Value] : [Pair, true];

// A single value stays unwrapped; a repeated value is kept once; new values are appended.
type AddValue<Current, Value> =
  Current extends unknown[]
    ? Value extends Current[number] ? Current : [...Current, Value]
    : [Value] extends [Current] ? Current : [Current, Value];

type InsertPair<Query extends object, Pair extends string> =
  Pair extends "" ? Query
    : ParsePair<Pair> extends [infer Key extends string, infer Value]
      ? Simplify<{
        [P in keyof Query | Key]: P extends Key
          ? P extends keyof Query ? AddValue<Query[P], Value> : Value
          : P extends keyof Query ? Query[P] : never;
      }>
      : never;

/** Reducer for `Reduce`: [query so far, "key=value"] -> query. */
interface InsertPairFn extends TypeFn {
  readonly input: readonly [object, string];
  readonly output: InsertPair<Arg<this, 0, object>, Arg<this, 1, string>>;
}

type ParseQueryString<S extends string> = Reduce<Split<S, "&">, InsertPairFn, {}>;

// Official test cases from type-challenges@0b0b0b1, unchanged except for the import path.
import type { Equal, Expect } from '../utils.js'

type cases = [
  Expect<Equal<ParseQueryString<''>, {}>>,
  Expect<Equal<ParseQueryString<'k1'>, { k1: true }>>,
  Expect<Equal<ParseQueryString<'k1&k1'>, { k1: true }>>,
  Expect<Equal<ParseQueryString<'k1&k2'>, { k1: true, k2: true }>>,
  Expect<Equal<ParseQueryString<'k1=v1'>, { k1: 'v1' }>>,
  Expect<Equal<ParseQueryString<'k1=v1&k1=v2'>, { k1: ['v1', 'v2'] }>>,
  Expect<Equal<ParseQueryString<'k1=v1&k2=v2'>, { k1: 'v1', k2: 'v2' }>>,
  Expect<Equal<ParseQueryString<'k1=v1&k2=v2&k1=v2'>, { k1: ['v1', 'v2'], k2: 'v2' }>>,
  Expect<Equal<ParseQueryString<'k1=v1&k2'>, { k1: 'v1', k2: true }>>,
  Expect<Equal<ParseQueryString<'k1=v1&k1=v1'>, { k1: 'v1' }>>,
  Expect<Equal<ParseQueryString<'k1=v1&k1=v2&k1=v1'>, { k1: ['v1', 'v2'] }>>,
  Expect<Equal<ParseQueryString<'k1=v1&k2=v1&k1=v2&k1=v1'>, { k1: ['v1', 'v2'], k2: 'v1' }>>,
  Expect<Equal<ParseQueryString<'k1=v1&k2=v2&k1=v2&k1=v3'>, { k1: ['v1', 'v2', 'v3'], k2: 'v2' }>>,
  Expect<Equal<ParseQueryString<'k1=v1&k1'>, { k1: ['v1', true] }>>,
  Expect<Equal<ParseQueryString<'k1&k1=v1'>, { k1: [true, 'v1'] }>>,
]
