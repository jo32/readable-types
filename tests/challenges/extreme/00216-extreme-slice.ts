// https://github.com/type-challenges/type-challenges/blob/main/questions/00216-extreme-slice/README.md
import type { IsNever, Subtract } from "../../../src/index.js";

// A negative index counts from the end; one past the start clamps to 0.
type ToIndex<Arr extends readonly unknown[], N extends number> =
  `${N}` extends `-${infer Abs extends number}`
    ? [Subtract<Arr["length"], Abs>] extends [infer Index extends number]
      ? IsNever<Index> extends true ? 0 : Index
      : 0
    : N;

// Counter walks the array; items are collected from Start until Counter reaches End.
type SliceLoop<
  Arr extends readonly unknown[], Start extends number, End extends number,
  Counter extends unknown[] = [], Started extends boolean = false, Acc extends unknown[] = [],
> =
  Counter["length"] extends End ? Acc
    : Arr extends readonly [infer First, ...infer Rest]
      ? (Started extends true ? true : Counter["length"] extends Start ? true : false) extends infer Taking extends boolean
        ? SliceLoop<Rest, Start, End, [...Counter, First], Taking, Taking extends true ? [...Acc, First] : Acc>
        : never
      : Acc;

type Slice<Arr extends readonly unknown[], Start extends number = 0, End extends number = Arr["length"]> =
  SliceLoop<Arr, ToIndex<Arr, Start>, ToIndex<Arr, End>>;

// Official test cases from type-challenges@0b0b0b1, unchanged except for the import path.
import type { Equal, Expect } from '../utils.js'

type Arr = [1, 2, 3, 4, 5]

type cases = [
  // basic
  Expect<Equal<Slice<Arr, 0, 1>, [1]>>,
  Expect<Equal<Slice<Arr, 0, 0>, []>>,
  Expect<Equal<Slice<Arr, 2, 4>, [3, 4]>>,

  // optional args
  Expect<Equal<Slice<[]>, []>>,
  Expect<Equal<Slice<Arr>, Arr>>,
  Expect<Equal<Slice<Arr, 0>, Arr>>,
  Expect<Equal<Slice<Arr, 2>, [3, 4, 5]>>,

  // negative index
  Expect<Equal<Slice<Arr, 0, -1>, [1, 2, 3, 4]>>,
  Expect<Equal<Slice<Arr, -3, -1>, [3, 4]>>,

  // invalid
  Expect<Equal<Slice<Arr, 10>, []>>,
  Expect<Equal<Slice<Arr, 1, 0>, []>>,
  Expect<Equal<Slice<Arr, 10, 20>, []>>,
]
