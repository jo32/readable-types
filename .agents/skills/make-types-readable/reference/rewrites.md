# Rewrite catalog

Raw patterns and the library name that states their intent. Every "Same?" claim and every
difference below is compiled in [`rewrites.check.ts`](rewrites.check.ts); run
`../scripts/check.sh` after changing either file. Imports come from `src/index.js`.

## Drop-in replacements

These give identical results on every input, so the rewrite needs no behavior review.

| Raw pattern | Readable form |
| --- | --- |
| `keyof T` | `Keys<T>` |
| `T extends unknown ? keyof T : never` | `AllKeys<T>` (keys of every union member) |
| `T[keyof T]` | `Values<T>` |
| `T["key"]` | `Get<T, "key">` (an unknown key is still a compile error) |
| `T[number]` on an array or tuple | `ElementOf<T>` |
| `C extends true ? A : B` with `C extends boolean` | `If<C, A, B>` |
| `Extract<U, Match>` used to pick union members | `SelectMembers<U, Match>` |
| `Exclude<U, Match>` used to drop union members | `ExcludeMembers<U, Match>` (or `Difference` for set-style code) |
| `{ [K in keyof T]: T[K] }` used to flatten | `Simplify<T>` |
| `{ -readonly [K in keyof T]: T[K] }` | `Mutable<T>` |
| `{ [K in keyof T]-?: {} extends Pick<T, K> ? K : never }[keyof T]` | `OptionalKeys<T>` (and `RequiredKeys<T>`) |
| `Awaited<ReturnType<F>>` | `ResolvedReturn<F>` |

## Replacements that change edge behavior

Pin the edges listed here before swapping. A difference is often an improvement, but it
is still a behavior change: report it and get approval.

| Raw pattern | Readable form | What differs |
| --- | --- | --- |
| `A extends B ? true : false` on a type parameter | `IsAssignable<A, B>` | The raw form distributes: `1 \| "two"` vs `number` gives `boolean`, `never` gives `never`. `IsAssignable` checks the whole type (`false`, `true`) and gives `boolean` for `any`. |
| `[A] extends [B] ? true : false` | `IsAssignable<A, B>` | Only `any` differs: raw gives `true`, `IsAssignable` gives `boolean`. |
| `Omit<T, K> & Required<Pick<T, K>>` | `SetRequired<T, K>` | Same on a plain object. On a union the raw form collapses to the shared keys (`{ kind: "created" \| "deleted" }`); `SetRequired` keeps each branch. Likewise `SetOptional`, `SetReadonly`, `SetMutable`. |
| `Omit<A, keyof B> & B` | `Merge<A, B>` | Same on plain objects; `Merge` also handles union members one at a time. Never replace a plain `A & B` with `Merge`: `&` requires both (a conflicting property becomes `never`), `Merge` lets `B` win. |
| `{ [K in keyof T as T[K] extends V ? K : never]: T[K] }` | `PickByValue<T, V>` | Under `exactOptionalPropertyTypes` the raw form reads `nickname?: string` as `string \| undefined` and drops it; `PickByValue` tests the declared type and keeps it. |
| A recursive `[infer First, ...infer Rest]` loop that maps each item | `MapItems<T, MapperFn>` | `MapItems` keeps `readonly`, labels and optional slots, and maps plain arrays (`number[]` → `Box<number>[]`); a typical loop returns a mutable tuple and `[]` for arrays. |
| A recursive loop that keeps items matching a type | `Filter<T, IsAssignableFn<X>>` | `Filter` gives `never` for arrays and open tuples (a loop gives `[]`), keeps `never` and `any` items (a loop collapses to `never` on a `never` item and splits into a union on `any`), and keeps `readonly`. |
| `[...Build<A>, ...Build<B>]["length"]` and other tuple-length math | `Add`, `Subtract`, `Multiply`, `Divide`, `Modulo`, `Compare` | Bounded: operands and result must be single literals in `0..128`, otherwise `never`. Keep the raw form, or a digit-string algorithm, when bigger numbers matter. |
| `C<B<A<T>>>` with three or more steps | `Pipe<T, [AFn, BFn, CFn]>` | Same results, but `Pipe` stops at `never` and needs every step to have an `XFn` form. For one or two steps, nesting is clearer. |

## Keep the native spelling

- `A | B` and `A & B` inside an ordinary type literal are already clear. Use `Union` /
  `Intersect` only where the type is talking *about* the operation, as in docs and examples.
- `Partial`, `Required`, `Readonly`, `Pick`, `Omit`, `Record`, `Parameters`, `ReturnType`
  and `Awaited` are well known. Wrap a combination of them, not a single one.
- Union to tuple, union size and unbounded arithmetic have no library form. Don't invent
  one inside a rewrite.
