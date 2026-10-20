// https://github.com/type-challenges/type-challenges/blob/main/questions/00517-extreme-multiply/README.md
import type { Add, DivMod, Join, Multiply as MultiplyNatural, Split } from "../../../src/index.js";
import type { DigitValue, ReversedDigits, Sum } from "./00476-extreme-sum.js";

// [carry, digit] of one column; at most 9 * 9 + 8, inside the library's 0..128 budget.
type ScaleColumn<Digit extends number, Factor extends number, Carry extends number> =
  MultiplyNatural<Digit, Factor> extends infer Product extends number ? DivMod<Add<Product, Carry>, 10> : never;

/** A (reversed digits) times one digit. */
type ScaleDigits<A extends readonly string[], Digit extends number, Carry extends number = 0, Acc extends string[] = []> =
  A extends readonly [infer First, ...infer Rest extends string[]]
    ? ScaleColumn<DigitValue<First>, Digit, Carry> extends [infer NextCarry extends number, infer Column extends number]
      ? ScaleDigits<Rest, Digit, NextCarry, [`${Column}`, ...Acc]>
      : never
    : Carry extends 0 ? Acc : [`${Carry}`, ...Acc];

// Walk B's digits left to right: Acc = Acc * 10 + A * digit.
type MultiplyLoop<A extends readonly string[], BDigits extends readonly string[], Acc extends string = "0"> =
  BDigits extends readonly [infer Digit, ...infer Rest extends string[]]
    ? MultiplyLoop<A, Rest, Sum<`${Acc}0`, Join<ScaleDigits<A, DigitValue<Digit>>, "">>>
    : Acc;

type StripLeadingZeros<S extends string> =
  S extends `0${infer Rest}` ? Rest extends "" ? "0" : StripLeadingZeros<Rest> : S;

type Multiply<A extends string | number | bigint, B extends string | number | bigint> =
  StripLeadingZeros<MultiplyLoop<ReversedDigits<A>, Split<`${B}`, "">>>;

// Official test cases from type-challenges@0b0b0b1, unchanged except for the import path.
import type { Equal, Expect } from '../utils.js'

type cases = [
  Expect<Equal<Multiply<2, 3>, '6'>>,
  Expect<Equal<Multiply<3, '5'>, '15'>>,
  Expect<Equal<Multiply<'4', 10>, '40'>>,
  Expect<Equal<Multiply<0, 16>, '0'>>,
  Expect<Equal<Multiply<'13', '21'>, '273'>>,
  Expect<Equal<Multiply<'43423', 321543n>, '13962361689'>>,
  Expect<Equal<Multiply<9999, 1>, '9999'>>,
  Expect<Equal<Multiply<4325234, '39532'>, '170985150488'>>,
  Expect<Equal<Multiply<100_000n, '1'>, '100000'>>,
  Expect<Equal<Multiply<259, 9125385>, '2363474715'>>,
  Expect<Equal<Multiply<9, 99>, '891'>>,
  Expect<Equal<Multiply<315, '100'>, '31500'>>,
  Expect<Equal<Multiply<11n, 13n>, '143'>>,
  Expect<Equal<Multiply<728, 0>, '0'>>,
  Expect<Equal<Multiply<'0', 213>, '0'>>,
  Expect<Equal<Multiply<0, '0'>, '0'>>,
]
