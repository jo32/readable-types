# TypeScript Type Functions

A type-programming library. The core idea: **treat types as data, express operations with names a person can read, then combine small operations into reusable type functions.**

It uses **TypeScript 7.0.2**, the stable version that npm `latest` pointed to when checked on 2026-10-16; the version and dependencies are locked. It uses strict mode, ESM / NodeNext, `exactOptionalPropertyTypes` and `noUncheckedIndexedAccess`. There is one dev dependency and no runtime dependencies.

## Getting started

Requires Node.js 22 or later.

```sh
npm ci
npm test                 # compile-time assertions, build, runtime tests
npm run typecheck        # check sources, tests and examples
npm run build            # emit dist/*.js and type declarations
```

Open [`examples/playground.ts`](examples/playground.ts) and hover to see the inferred types. Type computation happens at compile time; no `Add`, `MapItems` or similar functions exist at runtime.

## Design standard: readable for humans

**A capability the language already supports can still be wrapped. Whether to keep a primitive depends on whether it makes the intent easier for a reader to understand.** Even a one-line implementation can be worth keeping: the name, a consistent parameter order and the way it composes all add value. Underneath, reuse the official features as much as possible; on the outside, use words that say what it does.

| Intent to express | Readable form | Official syntax / utility |
| --- | --- | --- |
| Get property names | `Keys<T>` | `keyof T` |
| Get the property names of every union member | `AllKeys<T>` | `T extends unknown ? keyof T : never` |
| Get the union of property values | `Values<T>` | `T[keyof T]` |
| Read one known property | `Get<T, K>` | `T[K]` |
| Get the element type of an array or tuple | `ElementOf<T>` | `T[number]` |
| Check whether a whole type is assignable | `IsAssignable<A, B>` | `[A] extends [B] ? true : false`, with `any` handled explicitly |
| Choose a result by condition | `If<C, A, B>` | `C extends true ? A : B` |
| Either of two types | `Union<A, B>` | `A \| B` |
| Satisfy both type constraints | `Intersect<A, B>` | `A & B` |
| Keep matching union members | `SelectMembers<U, Match>` | `Extract<U, Match>` |
| Remove matching union members | `ExcludeMembers<U, Match>` / `Difference<U, Match>` | `Exclude<U, Match>` |

Complete side-by-side examples are in [`examples/readable.ts`](examples/readable.ts). For example, `SetRequired<Partial<User>, "id">` states directly that the id is required in the user update parameters; readers do not have to take apart a combination of `Omit`, `Pick` and `Required` each time.

A wrapper must still state its semantics precisely: whether it distributes over unions, whether it keeps readonly / optional, and whether failure is a compile error or `never`. `Keys`, `Values` and `Get` keep the official indexing semantics (a union yields only the properties its members share); the object helpers handle union members one at a time, so every branch of a discriminated union keeps its own fields. `IsAssignable` checks the whole type: it returns `boolean` when the input is `any` and `true` when the input is `never`. The readable names should also make these behaviors easy to look up and verify.

## Naming rule

Every operation comes in two forms whose names can be derived from each other:

- **Direct form** `X<Input, ...Rest>`: one computation, such as `Filter<T, P>`, `Join<T, ",">` or `SetRequired<T, "id">`.
- **Passable form** `XFn<...Rest>`: a `TypeFn` that leaves out the first parameter and can be passed to `Pipe`, `Compose`, `MapItems`, `Filter` and so on, such as `FilterFn<P>`, `JoinFn<",">` or `SetRequiredFn<"id">`.

**Every `TypeFn` ends in `Fn`**, so a name tells you whether it can go into a pipeline. Functions with no direct form follow the same rule: `IdentityFn` and `ConstantFn<V>`; `AwaitedFn` and `PromiseFn` correspond to the built-in types of those names. A numeric `XFn` with no argument is binary, for use with `Reduce`: `ReduceFn<AddFn, 0>`; with an argument it is unary: `AddFn<2>` means `Add<Input, 2>`.

## The minimal composition interface

`TypeFn` describes a passable type function; `Call` passes in an argument tuple; `Apply` is a single-argument call; `Arg<this, I>` reads argument `I` inside `output`.

```ts
import type { Add, Apply, Arg, Call, MapItems, TypeFn, AddFn } from "./src/index.js";

type BoxValue<T> = { readonly value: T };

interface BoxFn extends TypeFn {
  readonly input: readonly [unknown];
  readonly output: BoxValue<Arg<this, 0>>;
}

interface DoubleFn extends TypeFn {
  readonly input: readonly [number];
  readonly output: Add<Arg<this, 0, number>, Arg<this, 0, number>>; // the third argument narrows the constraint
}

type A = Apply<BoxFn, "hello">;            // { readonly value: "hello" }
type B = MapItems<readonly [1, "a"], BoxFn>; // readonly [BoxValue<1>, BoxValue<"a">]
type C = Call<AddFn, [3, 4]>;             // 7
type D = Apply<DoubleFn, 21>;             // 42
```

`input` describes the number and range of the arguments, and can be written as `readonly [unknown]` or `[unknown]`; `args` is bound by `Call`, and `output` is computed with polymorphic `this`. `Arg<this, 0, number>` narrows the argument to `number`, so it can be passed straight to a constrained generic such as `Add`; if the constraint is not met, the result is `never`. Write an object result as `BoxValue<T>` first and then reference `this` in the interface member; referencing `this` directly inside a nested object type is a compile error.

This is an encoding of higher-order type functions using existing TypeScript syntax; the language has not gained a call syntax for generic parameters such as `Mapper<T>`. The direct form suits a single operation; `XFn` lets the same operation be passed into mapping, filtering and pipelines, and readers can pick whichever is clearer for the situation. For example, `IsAssignable<T, number>` is a direct check, while `IsAssignableFn<number>` is a passable check function.

## Building type functions from basic operations

```ts
import type {
  AddFn, Compose, ComposeFn, FilterFn, GetFn, IsAssignableFn, JoinFn, MapItemsFn,
  MultiplyFn, NotFn, Pipe, ReduceFn, RejectFn,
} from "./src/index.js";

type Total = Pipe<
  readonly [1, "skip", 2, false, 3],
  [FilterFn<IsAssignableFn<number>>, ReduceFn<AddFn, 0>]
>; // 6

type Skipped = Pipe<readonly [1, "skip", 2], [RejectFn<IsAssignableFn<number>>]>; // readonly ["skip"]
type NotNumber = ComposeFn<[NotFn, IsAssignableFn<number>]>;                      // negate a predicate

type Names = Pipe<
  readonly [{ name: "Ada" }, { name: "Lin" }],
  [MapItemsFn<GetFn<"name">>, JoinFn<", ">]
>; // "Ada, Lin"

type Twenty = Pipe<3, [AddFn<2>, MultiplyFn<4>]>;        // left to right
type SameTwenty = Compose<3, [MultiplyFn<4>, AddFn<2>]>; // right to left
```

| Layer | Direct forms | Passable forms | Purpose |
| --- | --- | --- | --- |
| Reading structure | `Keys`, `AllKeys`, `Values`, `Get`, `ElementOf` | `GetFn` | Express indexing intent with names |
| Checks and selection | `Equal`, `IsAssignable`, `IsAny`, `IsNever`, `If`, `Not` | `EqualFn`, `IsAssignableFn`, `NotFn` | Control type branches |
| Type function protocol | `TypeFn`, `Arg`, `Call`, `Apply`, `Pipe`, `Compose` | `PipeFn`, `ComposeFn`, `IdentityFn`, `ConstantFn`, `AwaitedFn`, `PromiseFn` | Call and combine computations |
| Tuple basics | `Head`, `Last`, `Tail`, `Init`, `Push`, `Prepend`, `Concat`, `Reverse`, `Zip` | The same names plus `Fn` | Extract and transform structure |
| Higher-order operations | `MapItems`, `Filter`, `Reject`, `Reduce` | `MapItemsFn`, `FilterFn`, `RejectFn`, `ReduceFn` | Pass computations to other computations |
| Objects | `Merge`, `SetRequired`, `SetOptional`, `SetReadonly`, `SetMutable`, `MapValues`, `PickByValue`, `OptionalKeys` | `MergeFn`, `SetRequiredFn` and the other `Set*Fn`, `MapValuesFn`, `PickByValueFn` | Build DTO and update-parameter types |
| Unions and intersections | `Union`, `Intersect`, `SelectMembers`, `ExcludeMembers`, `Difference`, `MapUnion` | `SelectMembersFn`, `ExcludeMembersFn`, `MapUnionFn` | Constrain combinations and choose branches |
| Strings | `Trim`, `Split`, `Join` | `TrimFn`, `SplitFn`, `JoinFn` | Literal transformations |
| Natural numbers | `Add`, `Subtract`, `Multiply`, `Divide`, `Modulo`, `Sum` | `AddFn`, `SubtractFn`, `MultiplyFn`, `DivideFn`, `ModuloFn` | Bounded compile-time computation |
| Function signatures | `Asyncify`, `Promisify`, `Curry`, `PartialApply`, `Flip` | — | Transform the types of real JS functions |

`Primitive` also denotes the union of JS's seven primitive value types, including `bigint` and `symbol`; it is a different concept from the "computational primitives" here.

## Function signatures and the runtime bridge

```ts
import type { Asyncify, Curry, PartialApply, Promisify } from "./src/index.js";
import { promisify } from "./src/runtime.js";

type LoadUser = (id: string, verbose: boolean) => { name: string };
type AsyncLoadUser = Asyncify<LoadUser>; // (id, verbose) => Promise<{ name: string }>
type Curried = Curry<LoadUser>;          // (id: string) => (verbose: boolean) => { name: string }
type Bound = PartialApply<LoadUser, ["ada"]>; // (verbose: boolean) => { name: string }

type FindUser = (id: string, options?: { cache: boolean }) => { name: string };
type BoundFind = PartialApply<FindUser, ["ada"]>; // (options?: { cache: boolean }) => { name: string }

type CallbackLoadUser = (
  id: string,
  done: (error: Error | null, value: { name: string }) => void,
) => void;
type PromiseLoadUser = Promisify<CallbackLoadUser>; // (id: string) => Promise<{ name: string }>

const load = promisify(
  (id: string, done: (error: Error | null, name: string) => void): void => {
    done(null, id.toUpperCase());
  },
);
const result = load("ada"); // Promise<string>
```

Type aliases do not change the behavior of existing functions. `Curry<F>` only describes the curried signature and does not produce a runtime curried function; the only runtime functions in this project are `promisify` and `tuple`, which preserves literal inference.

`promisify` takes a function whose last parameter is an error-first callback, and keeps the remaining parameters and an explicit `this`. The callback's first parameter is the error, and its type must accept `null` or `undefined`; a callback that passes only a result, such as `(value: number) => void`, is rejected, since otherwise the runtime would reject with that result as an error. The callback may have zero or one success value; the success value may be optional or a thenable. A `null` / `undefined` error means success and any other value causes rejection; a synchronous throw also becomes a Promise rejection. For an unsupported function the compile error shows `"promisify needs": ...` to describe the requirement. It does not implement Node's `util.promisify.custom` protocol.

## Behavior and limits

- **Failure convention**: invalid input to a type computation usually gives `never`. `Call` checks the number of arguments and the input range, and accepts both readonly and mutable argument tuples; `Pipe` stops at `never`; an invalid element in `MapItems` is kept as a `never` at the matching position. When a generic constraint is not met the compiler reports an error directly, for example for an unknown property name in `Get<T, K>`. `XFn` forms only learn their input while a pipeline runs, so they return `never` instead, for example `GetFn` and `SetRequiredFn` given a property name that does not exist.
- **Readonly and optional**: `MapItems` preserves tuple labels, optional positions and readonly, and also supports plain arrays. Object mapping preserves property modifiers. When `MapItems`, `MapValues` and `PickByValue` read an optional position they use the declared type, without the implicit `undefined` that optionality adds; an explicitly written `undefined` is kept.
- **Known length**: `Filter`, `Reject`, `Reduce`, `Reverse` and `Zip` accept tuples made of a finite number of required elements; plain arrays, optional tuples and rest tuples give `never`, while `Join` gives `string` for them. A predicate must return exactly `true` or `false`; for `any`, `IsAssignableFn` follows assignment rules and returns `true` (`false` when the target is `never`), so it can be used with `Filter` directly. `Zip` ends at the shorter input, the outer readonly follows either input, and the inner paired tuples are mutable tuples.
- **Function parameters**: `Curry` supports fixed required parameters; `PartialApply` binds a prefix of the required parameters, keeps any optional and rest parameters after it, and gives `never` when binding into an optional or rest position; `Flip` supports exactly two required parameters. `Asyncify` keeps optional and rest parameters. `Promisify` requires the final callback parameter to be required and does not support multiple success values.
- **Overloads and generics**: signature transformations follow the rules of `Parameters` / `ReturnType`: only the last overload signature is read, and correlations between generic parameters cannot be preserved in general. For such APIs, write an adapter function with an explicit signature first.
- **Natural-number resource limit**: inputs and results are both within `0–128`, and only a single natural-number literal is accepted. A broad `number`, a union of numbers, `any`, `never`, negative numbers, decimals, out-of-range results, negative results (including `Decrement<0>`) and division by zero give `never`. Division rounds down. Multiple numbers can be handled item by item, explicitly, with `MapItems` or `MapUnion`.
- **Unions**: `IsAssignable` judges the whole type, while `MapUnion` distributes explicitly. `SelectMembers` / `ExcludeMembers` filter union members by assignability; to pick a branch of a discriminated union use `SelectMembers<Event, { kind: "created" }>`. `Intersect` means `A & B`. A union has no stable order, so `UnionToTuple` and union-set size are not provided.
- **Objects and strings**: the object tools target plain record types and handle union members one at a time, and a key parameter accepts a property name from any member (`AllKeys<T>`). `Merge` lets the right-hand property definitions override the left, including optional / readonly, and does not simulate a runtime `Object.assign` with optional fields. Exact string computation targets finite literals; `Join` can join up to 128 items, within the budget; a broad `string` gets a conservative result, and exact splitting of open template-string patterns is not promised.
- **Compiler limits**: these types are still subject to instantiation-depth and computation limits; they suit small-scale modeling, not big-number arithmetic or unbounded search. `Equal` is a structural comparison trick and does not guarantee to normalize all equivalent type expressions.

## Migrating from 0.1.0

0.2.0 unified the naming and removed the compatibility aliases:

| 0.1.0 | 0.2.0 |
| --- | --- |
| `Map`, `MapWith` | `MapItems`, `MapItemsFn` |
| `FilterWith`, `ReduceWith`, `MapValuesWith` | `FilterFn`, `ReduceFn`, `MapValuesFn` |
| `Extends`, `IsAssignableTo`, `ExtendsType` | `IsAssignable`, `IsAssignableFn` |
| `Equals`, `GetProp`, `Await`, `ToPromise` | `EqualFn`, `GetFn`, `AwaitedFn`, `PromiseFn` |
| `Identity`, `Constant` | `IdentityFn`, `ConstantFn` |
| `AddBy<N>`, `MultiplyBy<N>` | `AddFn<N>`, `MultiplyFn<N>` (`AddFn` with no argument is still binary addition) |
| `SplitBy`, `JoinWith`, `PickBy` | `SplitFn`, `JoinFn`, `PickByValueFn` |
| `Apply<Compose<[F, G]>, X>` | `Compose<X, [F, G]>` or `Apply<ComposeFn<[F, G]>, X>` |
| `Intersection`, `Lookup<U, K, V>` | `SelectMembers<U, Match>`, `SelectMembers<U, { [P in K]: V }>` |
| The second parameter of `IsUnion<T, Whole>`, `PreserveReadonly` | Internal implementation, no longer exported |

Behavior changes: a negative result from `Subtract`, and `Decrement<0>`, now give `never` instead of `0`; optional positions in `MapItems` / `MapValues` / `PickByValue` use the declared type; the object tools handle union members one at a time; `PartialApply` supports functions with optional and rest parameters; `promisify` rejects callbacks whose first parameter cannot be `null` / `undefined`.

## File layout

```text
src/primitives/           structure reading, checks, the type-function protocol, tuple operations
src/primitives/internal.ts internal helpers shared between modules, not exported from the entry
src/collections.ts       MapItems / Filter / Reject / Reduce
src/numbers.ts           bounded natural-number computation and function wrappers
src/objects.ts           object transformations
src/unions.ts            union operations
src/strings.ts           string transformations
src/function-types.ts    JS function-signature transformations
src/runtime.ts           promisify / tuple
examples/playground.ts   a connected usage example
examples/readable.ts     side-by-side examples of readable names and the official spellings
tests/                   compile-time positive and negative cases, and runtime tests
tests/challenges/        the type-challenges extreme set, solved with this library
docs/type-programming-guide.md  type programming, read as ordinary programming
docs/turing-completeness.md     every computable function, written in types
docs/design-notes.md     design decisions and the syntax they rely on
```

After a build, the package entry `typescript-type-functions` exports types only, and `typescript-type-functions/runtime` exports the runtime bridge functions. The package is currently set to private, for local use.

## Further reading

[Type programming, read as ordinary programming](docs/type-programming-guide.md) teaches the type system as a small programming language; [Every computable function, written in types](docs/turing-completeness.md) builds the partial recursive functions in it; the [design notes](docs/design-notes.md) explain the trade-offs behind this library.

The current compiler baseline follows the official [TypeScript 7.0 release notes](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/); the type transformation syntax follows the official [Handbook](https://www.typescriptlang.org/docs/handbook/2/types-from-types.html). It uses current stable syntax and does not depend on nightly builds or compiler internals.
