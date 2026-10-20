// Copy to ../scratch/<name>.ts (git-ignored), fill in, then run
// ../scripts/check.sh ../scratch/<name>.ts. Delete the copy when the rewrite is done.
import type { Expect, Same } from "../../../../tests/assert.js";
// import type { SetRequired } from "../../../../src/index.js";

// 1. The original type, copied verbatim (or imported from its file).
type Before<T> = T;

// 2. What it produces today, edges included: a union, never, any, optional and readonly
//    members, plain arrays vs. tuples, broad vs. literal string/number.
export type Pinned = [
  Expect<Same<Before<1>, 1>>,
];

// 3. The rewrite.
type After<T> = T;

// 4. It must match on every pinned input. Same is exact equality, not assignability.
export type Unchanged = [
  Expect<Same<After<1>, Before<1>>>,
];
