// https://github.com/type-challenges/type-challenges/blob/main/questions/00274-extreme-integers-comparator/README.md
import type { Compare, Split } from "../../../src/index.js";

export enum Comparison {
  Greater,
  Equal,
  Lower,
}

type Ordering = -1 | 0 | 1;

// The library's Compare is bounded to 0..128, which is plenty for single digits and digit counts.
type CompareDigit<A extends string, B extends string> =
  A extends `${infer X extends number}` ? B extends `${infer Y extends number}` ? Compare<X, Y> : never : never;
type CompareLength<A extends string, B extends string> = Compare<Split<A, "">["length"], Split<B, "">["length"]>;

// Left to right; when one side runs out the longer one is greater. Valid for equal-length
// integer parts and for fraction parts (a number's fraction never ends in 0).
type CompareDigits<A extends string, B extends string> =
  A extends `${infer HA}${infer RA}`
    ? B extends `${infer HB}${infer RB}`
      ? CompareDigit<HA, HB> extends 0 ? CompareDigits<RA, RB> : CompareDigit<HA, HB>
      : 1
    : B extends "" ? 0 : -1;

type SplitDecimal<S extends string> = S extends `${infer Integer}.${infer Fraction}` ? [Integer, Fraction] : [S, ""];

type CompareUnsigned<A extends string, B extends string> =
  [SplitDecimal<A>, SplitDecimal<B>] extends [[infer IA extends string, infer FA extends string], [infer IB extends string, infer FB extends string]]
    ? CompareLength<IA, IB> extends 0
      ? CompareDigits<IA, IB> extends 0 ? CompareDigits<FA, FB> : CompareDigits<IA, IB>
      : CompareLength<IA, IB>
    : never;

type Negate<C extends Ordering> = C extends 1 ? -1 : C extends -1 ? 1 : C;

/**
 * -1 | 0 | 1 like the library's Compare, but for any integer or decimal literal, including
 * negative numbers and numbers beyond Number.MAX_SAFE_INTEGER. It compares the digit strings.
 */
export type CompareNumbers<A extends number, B extends number> =
  `${A}` extends `-${infer AbsA}`
    ? `${B}` extends `-${infer AbsB}` ? Negate<CompareUnsigned<AbsA, AbsB>> : -1
    : `${B}` extends `-${string}` ? 1 : CompareUnsigned<`${A}`, `${B}`>;

export type Comparator<A extends number, B extends number> = {
  [1]: Comparison.Greater;
  [0]: Comparison.Equal;
  [-1]: Comparison.Lower;
}[CompareNumbers<A, B>];

// Official test cases from type-challenges@0b0b0b1, unchanged except for the import path.
import type { Equal, Expect } from '../utils.js'

type cases = [
  Expect<Equal<Comparator<5, 5>, Comparison.Equal>>,
  Expect<Equal<Comparator<5, 6>, Comparison.Lower>>,
  Expect<Equal<Comparator<5, 8>, Comparison.Lower>>,
  Expect<Equal<Comparator<5, 0>, Comparison.Greater>>,
  Expect<Equal<Comparator<-5, 0>, Comparison.Lower>>,
  Expect<Equal<Comparator<0, 0>, Comparison.Equal>>,
  Expect<Equal<Comparator<0, -5>, Comparison.Greater>>,
  Expect<Equal<Comparator<5, -3>, Comparison.Greater>>,
  Expect<Equal<Comparator<5, -7>, Comparison.Greater>>,
  Expect<Equal<Comparator<-5, -7>, Comparison.Greater>>,
  Expect<Equal<Comparator<-5, -3>, Comparison.Lower>>,
  Expect<Equal<Comparator<-25, -30>, Comparison.Greater>>,
  Expect<Equal<Comparator<15, -23>, Comparison.Greater>>,
  Expect<Equal<Comparator<40, 37>, Comparison.Greater>>,
  Expect<Equal<Comparator<-36, 36>, Comparison.Lower>>,
  Expect<Equal<Comparator<27, 27>, Comparison.Equal>>,
  Expect<Equal<Comparator<-38, -38>, Comparison.Equal>>,

  Expect<Equal<Comparator<1, 100>, Comparison.Lower>>,
  Expect<Equal<Comparator<100, 1>, Comparison.Greater>>,
  Expect<Equal<Comparator<-100, 1>, Comparison.Lower>>,
  Expect<Equal<Comparator<1, -100>, Comparison.Greater>>,
  Expect<Equal<Comparator<-100, -1>, Comparison.Lower>>,
  Expect<Equal<Comparator<-1, -100>, Comparison.Greater>>,

  // Extra tests if you like to challenge yourself!
  Expect<Equal<Comparator<9007199254740992, 9007199254740992>, Comparison.Equal>>,
  Expect<Equal<Comparator<-9007199254740992, -9007199254740992>, Comparison.Equal>>,
  Expect<Equal<Comparator<9007199254740991, 9007199254740992>, Comparison.Lower>>,
  Expect<Equal<Comparator<9007199254740992, 9007199254740991>, Comparison.Greater>>,
  Expect<Equal<Comparator<-9007199254740992, -9007199254740991>, Comparison.Lower>>,
  Expect<Equal<Comparator<-9007199254740991, -9007199254740992>, Comparison.Greater>>,
  Expect<Equal<Comparator<3.1415, 3.1415>, Comparison.Equal>>,
  Expect<Equal<Comparator<3.1415, 3.1414>, Comparison.Greater>>,
  Expect<Equal<Comparator<0, 3.1414>, Comparison.Lower>>,
  Expect<Equal<Comparator<31.415, 3.1415>, Comparison.Greater>>,
]
