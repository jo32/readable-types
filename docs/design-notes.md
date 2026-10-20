# Design notes

## Principles

1. **Type programming is also program design**: types are data, generic parameters are inputs, and the right-hand side of an alias is the result. Conditional types handle branching, `infer` extracts structure, mapped types iterate over fields, and recursion processes sequences. The [type programming guide](type-programming-guide.md) walks through this model.
2. **Build small operations first, then compose them**: use tuples for sequences and unions for set-style selection. Separating "how to traverse" from "what to do with each item" is what makes `MapItems`, `Filter` and `Reduce` reusable.
3. **Keep the information of the actual call**: the value of `Promisify` is that the parameters and the callback result are not lost, so the tests check both the final types and that wrong calls are rejected.
4. **Recursion is an implementation tool**: use tail recursion to accumulate tuples and limit the scale of arithmetic. Turing completeness is not treated as a functional requirement of a practical library; see [Every computable function, written in types](turing-completeness.md) for what it does and does not mean.

## Wrapping by readability

Even when the language already offers a capability, a name and a consistent interface can lower the cost of reading it. For example, `Values<T>` writes out the intent of `T[keyof T]`, `IsAssignable<A, B>` writes out a whole-type assignability check, and `SetRequired<T, K>` folds a combination of several utility types into one action. A one-line implementation can still be useful.

The project keeps semantic wrappers such as `Union`, `Difference` and `If`, and provides two forms: a direct type alias and a passable `TypeFn`. The former suits expressing a single action; the latter lets mapping, filtering and pipelines read step by step. The names of the two forms can be derived from each other: the direct form `X<Input, ...Rest>` corresponds to the passable form `XFn<...Rest>`, and every `TypeFn` ends in `Fn`. A new wrapper should have an intent that can be explained clearly, a clear parameter direction and defined edge behavior; its implementation should reuse official syntax and utility types as much as possible.

Names also need to tell different operations apart: `SelectMembers<U, Match>` selects members by assignability, while `Intersect<A, B>` means satisfying both constraints. `MapItems` clearly means transforming elements, and it can coexist with the native `Map<K, V>`. See [`examples/readable.ts`](../examples/readable.ts).

## Decisions

| Topic | Decision |
| --- | --- |
| Passing a type function to another | TypeScript has no higher-kinded types, so passable computation is encoded with `TypeFn` + polymorphic `this` + intersection types, without claiming native higher-kinded generics |
| Reduce | `T[number]` only extracts the union of the elements; the real `Reduce` has an accumulator and calls a binary type function item by item |
| Merging objects | `A & B` requires satisfying both constraints, and conflicting fields can become `never`. Property-definition override uses `Omit<A, keyof B> & B`, handled one union member at a time so that `Omit` does not see only the shared properties. This is not equivalent to the runtime behavior of `Object.assign` with optional properties |
| Selective readonly | First remove the selected fields, then merge `Readonly<Pick<T, K>>`, so the original mutable property does not take part in the intersection |
| Predecessor and subtraction | `Decrement<0>` and other negative differences give `never`, consistent with results outside `0–128`, so an error is not truncated into 0 and hidden; negative numbers, decimals and broad numbers are rejected before recursion |
| Order and size of a union | Union-to-tuple is not provided, because it depends on the internal order of union members; the library keeps `MapUnion`, filtering and intersection conversion |
| Async results | Reuse native `Awaited`, which handles nested Promises / thenables |
| Unbounded computation | No unbounded minimization; natural-number arithmetic is limited to `0–128`, and recursive collection operations require a known length |
| `promisify` | States the limits for the last signature, optional callbacks, multiple return values and custom protocols, and keeps an explicit `this`; the callback's first parameter must accept `null` / `undefined`, otherwise a callback that passes only a result would be rejected as an error at runtime |

An intersection of call signatures expresses overloads; it is not `never` just because the return values look inconsistent. Type inference reading the last overload signature should likewise not be treated as an interface for ordering union members stably.

Theoretical computing power and the resource limits of a real compiler need to be understood separately. This library implements only bounded, testable computation, and does not claim to have proved unbounded Turing completeness through finite tests or a finite arithmetic range.

## Syntax and official basis

Checked on 2026-10-16. On npm, the `latest` tag of `typescript` is `7.0.2` and `next` is `7.1.0-dev.20261016.1`; the project uses the stable version. The official 7.0 release announcement confirms that the standard npm package provides the new compiler; this project only calls the compiler command and does not depend on the programmatic compiler API.

| Current syntax / capability | Use in the project | Official source |
| --- | --- | --- |
| Conditional types, `infer`, distributive and non-distributive checks | Structure matching, union distribution, `never` checks | [Conditional Types](https://www.typescriptlang.org/docs/handbook/2/conditional-types.html) |
| Mapped types, modifiers, `as` key remapping | Selecting properties, preserving readonly / optional | [Mapped Types](https://www.typescriptlang.org/docs/handbook/2/mapped-types.html) |
| Variadic tuples | Parameter-list transformation, taking the head and tail, recursion | [TypeScript 4.0](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-0.html) |
| `Awaited`, tail-recursion optimization of conditional types | Extracting async results, recursive accumulation | [TypeScript 4.5](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-5.html) |
| Template literal types | Trim / Split / Join | [Template Literal Types](https://www.typescriptlang.org/docs/handbook/2/template-literal-types.html) |
| `satisfies` | Checks AppUpdate in the examples without annotating the variable directly with a broad model | [TypeScript 4.9](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-9.html) |
| `const` type parameters | `tuple` preserves the input literals | [TypeScript 5.0](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-0.html) |
| `Parameters`, `ReturnType`, `ThisParameterType` | Function-signature extraction, inheriting their overload / generic limits | [Utility Types](https://www.typescriptlang.org/docs/handbook/utility-types.html) |
| Current stable compiler | Strict checking, declaration build | [TypeScript 7.0](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/) |

"Use the latest TypeScript" means implementing and verifying correctly on the current stable compiler; there is no need to replace still-applicable stable syntax with unrelated new features.
