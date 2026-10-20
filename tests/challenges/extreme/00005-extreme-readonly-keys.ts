// https://github.com/type-challenges/type-challenges/blob/main/questions/00005-extreme-readonly-keys/README.md
import type { Equal as IsEqual, Keys } from "../../../src/index.js";

/** A key is readonly exactly when picking it already equals the Readonly version of that pick. */
type GetReadonlyKeys<T> = Keys<{
  [K in Keys<T> as IsEqual<Pick<T, K>, Readonly<Pick<T, K>>> extends true ? K : never]: T[K];
}>;

// Official test cases from type-challenges@0b0b0b1, unchanged except for the import path.
import type { Equal, Expect } from '../utils.js'

type cases = [
  Expect<Equal<'title', GetReadonlyKeys<Todo1>>>,
  Expect<Equal<'title' | 'description', GetReadonlyKeys<Todo2>>>,
]

interface Todo1 {
  readonly title: string
  description: string
  completed: boolean
}

interface Todo2 {
  readonly title: string
  readonly description: string
  completed?: boolean
}
