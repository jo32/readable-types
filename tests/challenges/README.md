# type-challenges: extreme

Solutions to all 17 [extreme](https://github.com/type-challenges/type-challenges#extreme) challenges, built on this library's type functions where they fit.

```sh
npm run test:challenges   # only these; npm test also runs them
```

Each file in `extreme/` is the solution followed by that challenge's official `test-cases.ts` from type-challenges@0b0b0b1, unchanged except for the import path. `utils.ts` is a copy of `@type-challenges/utils`. Everything is checked with the project's own compiler settings: TypeScript 7.0.2, `strict`, `exactOptionalPropertyTypes` and `noUncheckedIndexedAccess` (which challenge 925 requires anyway).

| Challenge | Library pieces used |
| --- | --- |
| 5 Get Readonly Keys | `Equal`, `Keys` |
| 151 Query String Parser | `Split`, `Reduce` with a reducer `TypeFn`, `Simplify` |
| 216 Slice | `Subtract`, `IsNever` (negative indices) |
| 274 Integers Comparator | `Compare` per digit and per digit count, `Split` |
| 462 Currying 2 | `BuildTuple` (dropping the supplied arguments) |
| 476 Sum | `Split`, `Reverse`, `Tail`, `Join`; `Add` + `DivMod` per column |
| 517 Multiply | `Multiply` + `Add` + `DivMod` per column, `Sum` from 476 |
| 697 Tag | `IsAny`, `IsNever`, `IsUnion`, `Equal` |
| 734 Inclusive Range | none: the tests go up to 200, past the 0..128 budget |
| 741 Sort | `CompareNumbers` from 274 |
| 869 DistributeUnions | `UnionToIntersection`, `Simplify` |
| 925 Assert Array Index | `Add`, `Split`, `IsNever` (key to number) |
| 6228 JSON Parser | none beyond the template's own `Pure` / `SetProperty` |
| 7561 Subtract | `Subtract` itself: it is this challenge, and its budget gives the `never` that the `@ts-expect-error` case expects for 1000 - 999 |
| 31447 CountReversePairs | `CompareNumbers` from 274 |
| 31997 Parameter Intersection | `Simplify` |
| 33345 Dynamic Route | `Split`, `Simplify` |

The library's numbers stop at 128 on purpose, so the big-number challenges (Sum, Multiply, Comparator) work on digit strings and use the library only for single-column arithmetic, which never exceeds 89 (9 × 9 plus a carry of 8).

Two solutions that are less obvious:

- **925**: under `noUncheckedIndexedAccess`, every read through an index signature gets `| undefined`, whatever the signature's key type is, so branded-number index signatures cannot work. Each key is instead turned into a numeric literal (two digits per character), and the asserted array gets a real property with that name. Keys are limited to `[a-zA-Z0-9_$]`, and to about 7 characters so the number stays a safe integer; other keys are rejected at the call.
- **697**: tags live under an optional symbol property, with the list stored under a key derived from the list itself. Different tag lists therefore never conflict on one property, so all tagged variants stay mutually assignable.
