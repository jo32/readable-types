// https://github.com/type-challenges/type-challenges/blob/main/questions/00741-extreme-sort/README.md
import type { CompareNumbers } from "./00274-extreme-integers-comparator.js";

// X goes before the first item it strictly precedes, so equal items keep their order.
type Insert<X extends number, Sorted extends number[], Descending extends boolean, Before extends number[] = []> =
  Sorted extends [infer First extends number, ...infer Rest extends number[]]
    ? CompareNumbers<X, First> extends (Descending extends true ? 1 : -1)
      ? [...Before, X, ...Sorted]
      : Insert<X, Rest, Descending, [...Before, First]>
    : [...Before, X];

type InsertionSort<T extends number[], Descending extends boolean, Acc extends number[] = []> =
  T extends [infer First extends number, ...infer Rest extends number[]]
    ? InsertionSort<Rest, Descending, Insert<First, Acc, Descending>>
    : Acc;

type Sort<T extends number[], Descending extends boolean = false> = InsertionSort<T, Descending>;

// Official test cases from type-challenges@0b0b0b1, unchanged except for the import path.
import type { Equal, Expect } from '../utils.js'

type cases = [
  Expect<Equal<Sort<[]>, []>>,
  Expect<Equal<Sort<[1]>, [1]>>,
  Expect<Equal<Sort<[2, 1]>, [1, 2]>>,
  Expect<Equal<Sort<[0, 0, 0]>, [0, 0, 0]>>,
  Expect<Equal<Sort<[1, 2, 3]>, [1, 2, 3]>>,
  Expect<Equal<Sort<[3, 2, 1]>, [1, 2, 3]>>,
  Expect<Equal<Sort<[3, 2, 1, 2]>, [1, 2, 2, 3]>>,
  Expect<Equal<Sort<[3, 2, 0, 1, 0, 0, 0]>, [0, 0, 0, 0, 1, 2, 3]>>,
  Expect<Equal<Sort<[2, 4, 7, 6, 6, 6, 5, 8, 9]>, [2, 4, 5, 6, 6, 6, 7, 8, 9]>>,
  Expect<Equal<Sort<[1, 1, 2, 1, 1, 1, 1, 1, 1]>, [1, 1, 1, 1, 1, 1, 1, 1, 2]>>,
  Expect<Equal<Sort<[], true>, []>>,
  Expect<Equal<Sort<[1], true>, [1]>>,
  Expect<Equal<Sort<[2, 1], true>, [2, 1]>>,
  Expect<Equal<Sort<[0, 0, 0], true>, [0, 0, 0]>>,
  Expect<Equal<Sort<[1, 2, 3], true>, [3, 2, 1]>>,
  Expect<Equal<Sort<[3, 2, 1], true>, [3, 2, 1]>>,
  Expect<Equal<Sort<[3, 2, 1, 2], true>, [3, 2, 2, 1]>>,
  Expect<Equal<Sort<[3, 2, 0, 1, 0, 0, 0], true>, [3, 2, 1, 0, 0, 0, 0]>>,
  Expect<Equal<Sort<[2, 4, 7, 6, 6, 6, 5, 8, 9], true>, [9, 8, 7, 6, 6, 6, 5, 4, 2]>>,
]
