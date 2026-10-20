// https://github.com/type-challenges/type-challenges/blob/main/questions/00462-extreme-currying-2/README.md
import type { BuildTuple } from "../../../src/index.js";

// [a] | [a, b] | [a, b, c] ... every prefix a call may supply.
type NonEmptyPrefix<Params extends unknown[], Prefix extends unknown[] = []> =
  Params extends [infer First, ...infer Rest]
    ? [...Prefix, First] | NonEmptyPrefix<Rest, [...Prefix, First]>
    : never;

type DropFirst<Params extends unknown[], Count extends number> =
  Params extends [...BuildTuple<Count>, ...infer Rest] ? Rest : never;

/**
 * Unlike the library's Curry (one argument per call), each call takes any non-empty prefix
 * of the remaining parameters; the original result comes back once none are left.
 */
type DynamicCurried<Params extends unknown[], Result> =
  Params extends [] ? Result
    : <Args extends NonEmptyPrefix<Params>>(...args: Args) => DynamicCurried<DropFirst<Params, Args["length"]>, Result>;

declare function DynamicParamsCurrying<Params extends unknown[], Result>(
  fn: (...args: Params) => Result,
): DynamicCurried<Params, Result>;

// Official test cases from type-challenges@0b0b0b1, unchanged except for the import path.
import type { Equal, Expect } from '../utils.js'

const curried1 = DynamicParamsCurrying((a: string, b: number, c: boolean) => true)
const curried2 = DynamicParamsCurrying((a: string, b: number, c: boolean, d: boolean, e: boolean, f: string, g: boolean) => true)

const curried1Return1 = curried1('123')(123)(true)
const curried1Return2 = curried1('123', 123)(false)
const curried1Return3 = curried1('123', 123, true)

const curried2Return1 = curried2('123')(123)(true)(false)(true)('123')(false)
const curried2Return2 = curried2('123', 123)(true, false)(true, '123')(false)
const curried2Return3 = curried2('123', 123)(true)(false)(true, '123', false)
const curried2Return4 = curried2('123', 123, true)(false, true, '123')(false)
const curried2Return5 = curried2('123', 123, true)(false)(true)('123')(false)
const curried2Return6 = curried2('123', 123, true, false)(true, '123', false)
const curried2Return7 = curried2('123', 123, true, false, true)('123', false)
const curried2Return8 = curried2('123', 123, true, false, true)('123')(false)
const curried2Return9 = curried2('123', 123, true, false, true, '123')(false)
const curried2Return10 = curried2('123', 123, true, false, true, '123', false)

// @ts-expect-error
const curried1ReturnWrong = curried1('123')(123)('wrong arg type')
// @ts-expect-error
const curried1ReturnWrong2 = curried1('123')()(123)(true)

type cases = [
  Expect<Equal< typeof curried1Return1, boolean>>,
  Expect<Equal< typeof curried1Return2, boolean>>,
  Expect<Equal< typeof curried1Return3, boolean>>,

  Expect<Equal< typeof curried2Return1, boolean>>,
  Expect<Equal< typeof curried2Return2, boolean>>,
  Expect<Equal< typeof curried2Return3, boolean>>,
  Expect<Equal< typeof curried2Return4, boolean>>,
  Expect<Equal< typeof curried2Return5, boolean>>,
  Expect<Equal< typeof curried2Return6, boolean>>,
  Expect<Equal< typeof curried2Return7, boolean>>,
  Expect<Equal< typeof curried2Return8, boolean>>,
  Expect<Equal< typeof curried2Return9, boolean>>,
  Expect<Equal< typeof curried2Return10, boolean>>,
]
