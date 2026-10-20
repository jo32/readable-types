// https://github.com/type-challenges/type-challenges/blob/main/questions/31447-extreme-countreversepairs/README.md
import type { CompareNumbers } from "./00274-extreme-integers-comparator.js";

// One tuple slot for each later item that X is greater than.
type SmallerAfter<X extends number, Rest extends number[], Acc extends unknown[] = []> =
  Rest extends [infer First extends number, ...infer Tail extends number[]]
    ? SmallerAfter<X, Tail, CompareNumbers<X, First> extends 1 ? [...Acc, unknown] : Acc>
    : Acc;

type CountLoop<T extends number[], Acc extends unknown[] = []> =
  T extends [infer First extends number, ...infer Rest extends number[]]
    ? CountLoop<Rest, [...Acc, ...SmallerAfter<First, Rest>]>
    : Acc["length"];

type CountReversePairs<T extends number[]> = CountLoop<T>;

// Official test cases from type-challenges@0b0b0b1, unchanged except for the import path.
import type { Equal, Expect } from '../utils.js'

type cases = [
  Expect<Equal<CountReversePairs<[5, 2, 6, 1]>, 4>>,
  Expect<Equal<CountReversePairs<[1, 2, 3, 4]>, 0>>,
  Expect<Equal<CountReversePairs<[-1, -1]>, 0>>,
  Expect<Equal<CountReversePairs<[-1]>, 0>>,
]
