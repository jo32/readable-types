// https://github.com/type-challenges/type-challenges/blob/main/questions/00476-extreme-sum/README.md
import type { Add, DivMod, Join, Reverse, Split, Tail } from "../../../src/index.js";

/** Least significant digit first: 328 -> ["8", "2", "3"]. */
export type ReversedDigits<N extends string | number | bigint> = Reverse<Split<`${N}`, "">>;

export type DigitValue<D> = D extends `${infer N extends number}` ? N : 0;
type FirstDigit<Digits extends readonly string[]> =
  Digits extends readonly [infer First, ...unknown[]] ? DigitValue<First> : 0;

/**
 * Schoolbook addition. Each column stays inside the library's 0..128 budget
 * (at most 9 + 9 + 1), and DivMod splits it into [carry, digit].
 */
type AddDigits<A extends readonly string[], B extends readonly string[], Carry extends number = 0, Acc extends string[] = []> =
  [A, B] extends [readonly [], readonly []]
    ? Carry extends 0 ? Acc : [`${Carry}`, ...Acc]
    : DivMod<Add<Add<FirstDigit<A>, FirstDigit<B>>, Carry>, 10> extends [infer NextCarry extends number, infer Digit extends number]
      ? AddDigits<Tail<A>, Tail<B>, NextCarry, [`${Digit}`, ...Acc]>
      : never;

export type Sum<A extends string | number | bigint, B extends string | number | bigint> =
  Join<AddDigits<ReversedDigits<A>, ReversedDigits<B>>, "">;

// Official test cases from type-challenges@0b0b0b1, unchanged except for the import path.
import type { Equal, Expect } from '../utils.js'

type cases = [
  Expect<Equal<Sum<2, 3>, '5'>>,
  Expect<Equal<Sum<'13', '21'>, '34'>>,
  Expect<Equal<Sum<'328', 7>, '335'>>,
  Expect<Equal<Sum<1_000_000_000_000n, '123'>, '1000000000123'>>,
  Expect<Equal<Sum<9999, 1>, '10000'>>,
  Expect<Equal<Sum<4325234, '39532'>, '4364766'>>,
  Expect<Equal<Sum<728, 0>, '728'>>,
  Expect<Equal<Sum<'0', 213>, '213'>>,
  Expect<Equal<Sum<0, '0'>, '0'>>,
]
