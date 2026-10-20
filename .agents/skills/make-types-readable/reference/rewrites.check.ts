// Every claim in rewrites.md, checked by the compiler. Run ../scripts/check.sh with no
// arguments after editing either file.
import type {
  Add, AllKeys, Arg, ElementOf, ExcludeMembers, Filter, FilterFn, Get, If, IsAssignable,
  IsAssignableFn, Keys, MapItems, MapItemsFn, Merge, Mutable, OptionalKeys, PickByValue, Pipe,
  ResolvedReturn, SelectMembers, SetRequired, Simplify, TypeFn, Values,
} from "../../../../src/index.js";
import type { Expect, Same } from "../../../../tests/assert.js";

type User = { readonly id: string; nickname?: string; active: boolean };
type Event = { kind: "created"; user: User } | { kind: "deleted"; id: string };

// Drop-in replacements: identical results on every input.
type NativeIf<C extends boolean, Then, Else> = C extends true ? Then : Else;
export type Exact = [
  Expect<Same<Keys<User>, keyof User>>,
  Expect<Same<Values<User>, User[keyof User]>>,
  Expect<Same<Get<User, "nickname">, User["nickname"]>>,
  Expect<Same<ElementOf<readonly ["a", "b"]>, (readonly ["a", "b"])[number]>>,
  Expect<Same<AllKeys<Event>, "kind" | "user" | "id">>,
  Expect<Same<If<boolean, "a", "b">, NativeIf<boolean, "a", "b">>>,
  Expect<Same<SelectMembers<Event, { kind: "created" }>, Extract<Event, { kind: "created" }>>>,
  Expect<Same<ExcludeMembers<Event, { kind: "created" }>, Exclude<Event, { kind: "created" }>>>,
  Expect<Same<Simplify<{ a: 1 } & { b: 2 }>, { a: 1; b: 2 }>>,
  Expect<Same<Mutable<User>, { id: string; nickname?: string; active: boolean }>>,
  Expect<Same<OptionalKeys<User>, "nickname">>,
  Expect<Same<ResolvedReturn<() => Promise<Promise<1>>>, Awaited<ReturnType<() => Promise<Promise<1>>>>>>,
];

// IsAssignable checks the whole type; a bare conditional on a type parameter distributes.
type Bare<A, B> = A extends B ? true : false;
type Wrapped<A, B> = [A] extends [B] ? true : false;
export type Assignability = [
  Expect<Same<Bare<1 | "two", number>, boolean>>,
  Expect<Same<IsAssignable<1 | "two", number>, false>>,
  Expect<Same<Bare<never, number>, never>>,
  Expect<Same<IsAssignable<never, number>, true>>,
  Expect<Same<Wrapped<any, number>, true>>,
  Expect<Same<IsAssignable<any, number>, boolean>>,
  Expect<Same<Wrapped<1 | "two", number>, IsAssignable<1 | "two", number>>>,
  Expect<Same<Wrapped<never, number>, IsAssignable<never, number>>>,
];

// The Set* helpers flatten their result and handle union members one at a time; the
// native spelling collapses a union to its shared keys. Compare a raw intersection through
// Simplify: Same treats some intersections as equal to their flattened form, not all.
type NativeSetRequired<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;
export type SetHelpers = [
  Expect<Same<SetRequired<Partial<User>, "id">, Simplify<NativeSetRequired<Partial<User>, "id">>>>,
  Expect<Same<
    SetRequired<Partial<Event>, "kind">,
    { kind: "created"; user?: User } | { kind: "deleted"; id?: string }
  >>,
  Expect<Same<Simplify<NativeSetRequired<Partial<Event>, "kind">>, { kind: "created" | "deleted" }>>,
];

// Merge overrides; & demands both, so a conflicting property becomes never.
export type Merging = [
  Expect<Same<Merge<{ a: string; b: 1 }, { a: number }>, { b: 1; a: number }>>,
  Expect<Same<Merge<{ a: string; b: 1 }, { a: number }>, Simplify<Omit<{ a: string; b: 1 }, "a"> & { a: number }>>>,
  Expect<Same<Same<Merge<{ a: string; b: 1 }, { a: number }>, Omit<{ a: string; b: 1 }, "a"> & { a: number }>, false>>,
  Expect<Same<({ a: string } & { a: number })["a"], never>>,
];

// PickByValue tests an optional property's declared type, without the implicit undefined.
type NativePickByValue<T, V> = { [K in keyof T as T[K] extends V ? K : never]: T[K] };
export type PickingByValue = [
  Expect<Same<PickByValue<User, string>, { readonly id: string; nickname?: string }>>,
  Expect<Same<NativePickByValue<User, string>, { readonly id: string }>>,
];

// Hand-written tuple loops vs. MapItems / Filter.
type Box<T> = { value: T };
interface BoxFn extends TypeFn {
  readonly input: readonly [unknown];
  readonly output: Box<Arg<this, 0>>;
}
type BoxLoop<T> = T extends readonly [infer First, ...infer Rest] ? [Box<First>, ...BoxLoop<Rest>] : [];
type NumbersLoop<T> = T extends readonly [infer First, ...infer Rest]
  ? First extends number ? [First, ...NumbersLoop<Rest>] : NumbersLoop<Rest>
  : [];
export type Loops = [
  Expect<Same<MapItems<[1, 2], BoxFn>, BoxLoop<[1, 2]>>>,
  Expect<Same<MapItems<readonly [1], BoxFn>, readonly [Box<1>]>>,
  Expect<Same<BoxLoop<readonly [1]>, [Box<1>]>>,
  Expect<Same<MapItems<number[], BoxFn>, Box<number>[]>>,
  Expect<Same<BoxLoop<number[]>, []>>,
  Expect<Same<Filter<[1, "a", 2], IsAssignableFn<number>>, NumbersLoop<[1, "a", 2]>>>,
  Expect<Same<Filter<number[], IsAssignableFn<number>>, never>>,
  Expect<Same<NumbersLoop<number[]>, []>>,
  Expect<Same<Filter<[1, never], IsAssignableFn<number>>, [1, never]>>,
  Expect<Same<NumbersLoop<[1, never]>, never>>,
  Expect<Same<Filter<[1, any], IsAssignableFn<number>>, [1, any]>>,
  Expect<Same<NumbersLoop<[1, any]>, [1, any] | [1]>>,
  Expect<Same<
    Pipe<readonly [1, "a", 2], [FilterFn<IsAssignableFn<number>>, MapItemsFn<BoxFn>]>,
    readonly [Box<1>, Box<2>]
  >>,
];

// Tuple-length arithmetic vs. Add: same inside 0..128, never outside it.
type BuildLoop<N extends number, Acc extends unknown[] = []> =
  Acc["length"] extends N ? Acc : BuildLoop<N, [...Acc, unknown]>;
type NativeAdd<A extends number, B extends number> = [...BuildLoop<A>, ...BuildLoop<B>]["length"];
export type Arithmetic = [
  Expect<Same<Add<3, 4>, NativeAdd<3, 4>>>,
  Expect<Same<NativeAdd<100, 50>, 150>>,
  Expect<Same<Add<100, 50>, never>>,
];
