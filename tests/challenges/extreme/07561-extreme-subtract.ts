// https://github.com/type-challenges/type-challenges/blob/main/questions/07561-extreme-subtract/README.md

// The library's Subtract is already this challenge: BuildTuple<M> minus BuildTuple<S>, with a
// negative result as never. Its 0..128 budget is also what the test's expected failure on
// Subtract<1000, 999> asks for: out of range gives never, not 1.
import type { Subtract } from "../../../src/index.js";

// Official test cases from type-challenges@0b0b0b1, unchanged except for the import path.
import type { Equal, Expect } from '../utils.js'

type cases = [
  Expect<Equal<Subtract<1, 1>, 0>>,
  Expect<Equal<Subtract<2, 1>, 1>>,
  Expect<Equal<Subtract<1, 2>, never>>,
  // @ts-expect-error
  Expect<Equal<Subtract<1000, 999>, 1>>,
]
