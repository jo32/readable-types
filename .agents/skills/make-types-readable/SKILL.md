---
name: make-types-readable
description: Rewrite hard-to-read TypeScript types into readable ones using this repo's vocabulary (Keys, Values, Get, IsAssignable, SetRequired, Merge, MapItems, Filter, Pipe, the XFn forms) and its naming rules, and prove with compile-time checks that the rewrite keeps the same behavior. Use when asked to make a type readable, clean up or simplify a type, replace conditional/mapped-type tricks with named operations, or review a type's readability, whether it lives in src/, tests/, examples/ or is a snippet the user pastes.
---

# Make types readable

The library's standard (README, "Design standard: readable for humans"): a type is readable
when its names say the intent and its edge behavior is stated. A rewrite that reads better
but behaves differently is a bug, so every rewrite here is pinned by compile-time checks
before it is made and compared exactly after.

Files in this skill:

- `reference/rewrites.md`: raw patterns, their readable forms, and where they differ.
- `reference/rewrites.check.ts`: the compiler-checked proof of every claim in that table.
- `templates/pin.ts`: the scratch file for pinning and comparing.
- `scripts/check.sh FILE.ts...`: type-checks files with the repo's compiler options
  (strict, `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`, NodeNext). With no
  arguments it checks the reference. Needs `npm ci` once.

Paths below are relative to this skill's directory; the repo root is `../../..`.

## Workflow

### 1. Find the type and its users

Read the type, the file around it and every use of it (`grep -rn TypeName src tests examples docs`).
An export of `src/` is public API: keep its name, parameter order and constraints unless
the user agrees to a breaking change. Match the surrounding naming and comment density.

### 2. Pin today's behavior

Copy `templates/pin.ts` to `scratch/<name>.ts` (git-ignored), paste the original as
`Before` and list what it produces, using the edges that readable wrappers treat
differently:

- a union input (does it distribute?)
- `never`, `any`, `unknown`
- optional and `readonly` members, an explicit `undefined`
- plain arrays, `readonly` tuples, optional or rest slots
- broad `string` / `number` next to literals; numbers above 128 if there is arithmetic

Run `scripts/check.sh scratch/<name>.ts` and fix the *expectations* until it passes.
These cases record what the type does now, not what it should do.

To see what a type evaluates to, assign it to a wrong literal and read the error:
`export const probe: "x" = null as unknown as Before<Input>;`. For a tuple of results,
probe each index separately, since the compiler reports only the first mismatch.

### 3. Diagnose

Check `reference/rewrites.md` for patterns with a library name, then go through the
structural checklist below. Pick the changes that make the intent obvious, not every
change that is possible.

### 4. Rewrite and compare

Add `After` to the scratch file with `Expect<Same<After<X>, Before<X>>>` for every pinned
input, and run the check again.

- `Same` is exact equality. Never weaken a case to assignability to make it pass.
- `Same` treats some intersections as equal to their flattened form and not others. When
  `Before` returns `A & B` and `After` returns a flat object, compare `After<X>` with
  `Simplify<Before<X>>`.
- If a case differs, either find a rewrite that matches, or report it to the user as a
  behavior change: the input, the old result, the new result. Keep it only with their
  approval. The "What differs" column of the catalog lists the usual ones.

### 5. Apply and verify

1. Edit the real file.
2. If the type is in `src/`, move the pinned behavior cases (not the Before/After
   comparison) into the matching `tests/*.test.ts`, using `tests/assert.ts`.
3. Run `npm test`. Also run `npm run test:challenges` when `src/` or `tests/challenges/`
   changed.
4. For a recursive type, compare the "Instantiations" line of
   `node_modules/.bin/tsc -p tsconfig.json --extendedDiagnostics` before and after. A
   rewrite that multiplies it, or hits TS2589 ("excessively deep"), is not done.
5. Delete the scratch file.

### 6. Report

Show before and after, give the reason for each change, list the commands you ran with
their results, and name any behavior change and who approved it.

## Structural checklist

1. **Name the steps.** Conditionals nested three or more deep usually hide two or three
   steps. Pull each into a helper whose name says what it computes. Keep helpers
   unexported unless they are useful on their own.
2. **Loops.** Put recursion in a private `XLoop` with an `Acc` parameter, so it stays tail
   recursive, and validate the input once in the exported `X` (see `Reverse`/`ReverseLoop`,
   `Filter`/`FilterLoop`). Before writing a loop, check whether `MapItems`, `Filter`,
   `Reject`, `Reduce` or `MapUnion` already does it.
3. **`infer X extends C`** instead of a nested `X extends C ? ... : never` right after an `infer`.
4. **Parameter names.** `T`, `K` and `U` are fine for a generic slot. Otherwise name the role:
   `Source`, `Target`, `Key`, `Separator`, `Predicate`, `Mapper`, `Acc`.
5. **Label tuple results**: `[quotient: Q, remainder: R]`.
6. **Distribution on purpose.** Write `[X] extends [Y]` when the whole type matters and
   `X extends Y` only when distributing is intended, and say which in the doc comment, or
   use `IsAssignable` / `MapUnion`, which say it in their names.
7. **One-line doc comment** stating the edge behavior: distribution, `readonly`/optional,
   and whether invalid input is `never` or a compile error. Match the style in `src/`.
8. **Passable form.** If the type will be mapped, filtered or piped, add
   `XFn<...Rest>` next to `X<Input, ...Rest>`. Every `TypeFn` name ends in `Fn`; read
   arguments with `Arg<this, I, Constraint>`, and write object results through an alias
   (`Box<Arg<this, 0>>`), because `this` can't appear inside a nested object type.
9. **Pipelines.** Three or more nested steps whose `XFn` forms exist read better as
   `Pipe<T, [AFn, BFn, CFn]>`. For one or two steps, nesting is clearer.
10. **Don't over-wrap.** See "Keep the native spelling" in the catalog. A wrapper that
    hides edge behavior the reader needs is worse than the raw syntax.

## Example

Before:

```ts
type NumbersOnly<T> = T extends readonly [infer First, ...infer Rest]
  ? First extends number ? [First, ...NumbersOnly<Rest>] : NumbersOnly<Rest>
  : [];
```

Candidate: `Filter<T, IsAssignableFn<number>>`. Pinning shows these results:

| Input | `Before` | `Filter` |
| --- | --- | --- |
| `[1, "a", 2]` | `[1, 2]` | `[1, 2]` |
| `readonly [1, "a"]` | `[1]` | `readonly [1]` |
| `number[]` | `[]` | `never` |
| `[1, never]` | `never` | `[1, never]` |
| `[1, any]` | `[1, any] \| [1]` | `[1, any]` |

The main case matches, but four edges changed. The `Filter` results are arguably the
correct ones, but this is still a behavior change, so report the table and ask. If the
callers depend on `[]` for arrays, either keep a readable hand-written loop
(`NumbersOnlyLoop` with an `Acc`, plus a doc comment saying it distributes over each
item), or wrap it: `IsFiniteTuple<T> extends true ? Filter<...> : []`.

## Limits of the vocabulary

- Arithmetic is bounded to single literals in `0..128` and gives `never` outside that
  range. Don't replace a digit-string algorithm (for example
  `tests/challenges/extreme/00476-extreme-sum.ts`) with `Add`.
- There is no union-to-tuple and no union size, because union order isn't stable.
- Signature helpers (`Parameters`-based) read only the last overload and lose generic
  correlations. Don't "simplify" an explicit overload list into one of them.
- `Equal` / `Same` are a structural comparison trick, not a full normalizer. When a
  comparison looks wrong, probe both sides.
