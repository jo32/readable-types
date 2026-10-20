import type {
  And, Apply, Arg, AwaitedFn, Call, Compose, ComposeFn, ConstantFn, Equal, EqualFn, GetFn,
  IdentityFn, If, IsAny, IsAssignable, IsAssignableFn, IsFiniteTuple, IsNever, IsUnion,
  IsUnknown, MapItems, Not, NotFn, Or, Pipe, PipeFn, Primitive, PromiseFn, TypeFn,
} from "../src/index.js";
import type { Expect, Same } from "./assert.js";

type BoxValue<T> = { value: T };
interface BoxFn extends TypeFn {
  readonly input: readonly [unknown];
  readonly output: BoxValue<Arg<this, 0>>;
}

interface PairFn extends TypeFn {
  readonly input: readonly [unknown, unknown];
  readonly output: [Arg<this, 0>, Arg<this, 1>];
}

// Declared without readonly on the input tuple: Apply, MapItems and Pipe must still call it.
interface WrapFn extends TypeFn {
  readonly input: [unknown];
  readonly output: [Arg<this, 0>];
}

// Arg narrows to its constraint, and a mismatch is never.
interface OnlyStringFn extends TypeFn {
  readonly output: Arg<this, 0, string>;
}

export type LogicCases = [
  Expect<Same<Equal<any, unknown>, false>>,
  Expect<Same<Equal<never, never>, true>>,
  Expect<Same<Equal<{ readonly id: 1 }, { id: 1 }>, false>>,
  Expect<Same<Equal<1 | 2, 2 | 1>, true>>,
  Expect<Same<IsAny<any>, true>>,
  Expect<Same<IsAny<unknown>, false>>,
  Expect<Same<IsNever<never>, true>>,
  Expect<Same<IsNever<undefined>, false>>,
  Expect<Same<IsUnknown<unknown>, true>>,
  Expect<Same<IsUnknown<any>, false>>,
  Expect<Same<IsUnknown<{}>, false>>,
  Expect<Same<IsUnion<1 | 2>, true>>,
  Expect<Same<IsUnion<boolean>, true>>,
  Expect<Same<IsUnion<1>, false>>,
  Expect<Same<IsUnion<never>, false>>,
  Expect<Same<IsAssignable<1 | "a", number>, false>>,
  Expect<Same<IsAssignable<1 | 2, number>, true>>,
  Expect<Same<IsAssignable<never, number>, true>>,
  Expect<Same<IsAssignable<any, number>, boolean>>,
  Expect<Same<If<boolean, "yes", "no">, "yes" | "no">>,
  Expect<Same<Not<true>, false>>,
  Expect<Same<And<boolean, false>, false>>,
  Expect<Same<Or<boolean, true>, true>>,
  Expect<Same<Extract<Primitive, object>, never>>,
  Expect<Same<IsFiniteTuple<readonly [1, 2]>, true>>,
  Expect<Same<IsFiniteTuple<[value?: string]>, false>>,
  Expect<Same<IsFiniteTuple<[string, ...number[]]>, false>>,
  Expect<Same<IsFiniteTuple<any>, false>>,
  Expect<Same<IsFiniteTuple<never>, false>>,
];

export type FunctionCases = [
  Expect<Same<Call<IdentityFn, [42]>, 42>>,
  Expect<Same<Apply<IdentityFn, { readonly id: 1 }>, { readonly id: 1 }>>,
  Expect<Same<Call<PairFn, readonly [1, "two"]>, [1, "two"]>>,
  Expect<Same<Apply<BoxFn, "hello">, { value: "hello" }>>,
  Expect<Same<Call<IdentityFn, []>, never>>,
  Expect<Same<Call<IdentityFn, [1, 2]>, never>>,
  Expect<Same<Call<IdentityFn, any>, never>>,
  Expect<Same<Call<IdentityFn, never>, never>>,
  Expect<Same<Call<ConstantFn<42>, []>, 42>>,
  Expect<Same<Apply<EqualFn<"a">, "a">, true>>,
  Expect<Same<Apply<IsAssignableFn<number>, 1 | "a">, false>>,
  // The predicate form decides any like an assignment, so Filter never sees boolean.
  Expect<Same<Apply<IsAssignableFn<number>, any>, true>>,
  Expect<Same<Apply<IsAssignableFn<never>, any>, false>>,
  Expect<Same<Apply<NotFn, true>, false>>,
  Expect<Same<Apply<NotFn, "yes">, never>>,
  Expect<Same<Apply<ComposeFn<[NotFn, IsAssignableFn<number>]>, 1>, false>>,
  Expect<Same<Apply<GetFn<"id">, { readonly id: 3 }>, 3>>,
  Expect<Same<Apply<GetFn<"id">, {}>, never>>,
  Expect<Same<Apply<AwaitedFn, PromiseLike<Promise<1>>>, 1>>,
  Expect<Same<Apply<PromiseFn, 1>, Promise<1>>>,
  Expect<Same<Pipe<"a", [BoxFn, GetFn<"value">, PromiseFn]>, Promise<"a">>>,
  Expect<Same<Apply<PipeFn<[BoxFn, GetFn<"value">]>, 1>, 1>>,
  Expect<Same<Compose<1, [PromiseFn, GetFn<"value">, BoxFn]>, Promise<1>>>,
  Expect<Same<Apply<ComposeFn<[PromiseFn, GetFn<"value">, BoxFn]>, 1>, Promise<1>>>,
  Expect<Same<Pipe<42, []>, 42>>,
  Expect<Same<Compose<42, []>, 42>>,
  Expect<Same<Pipe<{}, [GetFn<"missing">, ConstantFn<1>]>, never>>,
  Expect<Same<Pipe<42, TypeFn[]>, never>>,
  Expect<Same<Compose<42, TypeFn[]>, never>>,
  Expect<Same<Call<WrapFn, [1]>, [1]>>,
  Expect<Same<Call<WrapFn, readonly [1]>, [1]>>,
  Expect<Same<Apply<WrapFn, 1>, [1]>>,
  Expect<Same<MapItems<[1, 2], WrapFn>, [[1], [2]]>>,
  Expect<Same<Pipe<1, [WrapFn, WrapFn]>, [[1]]>>,
  Expect<Same<Call<OnlyStringFn, ["a"]>, "a">>,
  Expect<Same<Call<OnlyStringFn, [1]>, never>>,
];

// @ts-expect-error A runtime function signature is not a TypeFn descriptor.
export type WrongDescriptor = Call<(n: number) => number, [1]>;
