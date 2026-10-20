import type {
  AddFn, Apply, ComposeFn, Concat, ConcatFn, ConstantFn, EqualFn, Filter, FilterFn, GetFn,
  Head, HeadFn, IdentityFn, Init, InitFn, IsAssignableFn, JoinFn, Last, LastFn, MapItems,
  MapItemsFn, MapValues, MapValuesFn, Merge, MergeFn, Mutable, NotFn, OptionalKeys,
  PickByValue, PickByValueFn, PickRequired, Pipe, Prepend, PrependFn, PromiseFn, Push, PushFn,
  Reduce, ReduceFn, Reject, RejectFn, RequiredKeys, Reverse, ReverseFn, SetMutable,
  SetMutableFn, SetOptional, SetOptionalFn, SetReadonly, SetReadonlyFn, SetRequired,
  SetRequiredFn, Tail, TailFn, Zip, ZipFn,
} from "../src/index.js";
import type { Expect, Same } from "./assert.js";

export type TupleCases = [
  Expect<Same<Head<readonly [1, 2]>, 1>>,
  Expect<Same<Last<readonly [1, 2]>, 2>>,
  Expect<Same<Head<[]>, never>>,
  Expect<Same<Last<[]>, never>>,
  Expect<Same<Tail<readonly [1, 2]>, readonly [2]>>,
  Expect<Same<Init<readonly [1, 2]>, readonly [1]>>,
  Expect<Same<Init<[]>, []>>,
  Expect<Same<Tail<readonly []>, readonly []>>,
  Expect<Same<Push<readonly [1], 2>, readonly [1, 2]>>,
  Expect<Same<Prepend<[2], 1>, [1, 2]>>,
  Expect<Same<Concat<[1], [2]>, [1, 2]>>,
  Expect<Same<Concat<[1], readonly [2]>, readonly [1, 2]>>,
  Expect<Same<Reverse<readonly [1, 2, 3]>, readonly [3, 2, 1]>>,
  Expect<Same<Reverse<string[]>, never>>,
  Expect<Same<Reverse<[string?]>, never>>,
  Expect<Same<Zip<[1, 2], ["a"]>, [[1, "a"]]>>,
  Expect<Same<Zip<readonly [1], ["a", "b"]>, readonly [[1, "a"]]>>,
  Expect<Same<Zip<[], []>, []>>,
  Expect<Same<Zip<string[], []>, never>>,
  Expect<Same<Apply<HeadFn, [1, 2]>, 1>>,
  Expect<Same<Apply<LastFn, [1, 2]>, 2>>,
  Expect<Same<Apply<InitFn, [1, 2]>, [1]>>,
  Expect<Same<Apply<PrependFn<0>, [1]>, [0, 1]>>,
  Expect<Same<Apply<HeadFn, "not a tuple">, never>>,
  Expect<Same<Pipe<readonly [1, 2, 3], [ReverseFn, TailFn, PushFn<0>]>, readonly [2, 1, 0]>>,
  Expect<Same<Pipe<[1, 2], [ConcatFn<[3]>, ZipFn<["a", "b", "c"]>]>, [[1, "a"], [2, "b"], [3, "c"]]>>,
];

export type CollectionCases = [
  Expect<Same<MapItems<readonly [1, "a"], PromiseFn>, readonly [Promise<1>, Promise<"a">]>>,
  Expect<Same<MapItems<string[], PromiseFn>, Promise<string>[]>>,
  Expect<Same<MapItems<readonly [name?: string], IdentityFn>, readonly [name?: string]>>,
  // An optional slot passes its declared type, without the implicit undefined.
  Expect<Same<MapItems<[name?: string], PromiseFn>, [name?: Promise<string>]>>,
  Expect<Same<MapItems<[string | undefined], PromiseFn>, [Promise<string | undefined>]>>,
  Expect<Same<Filter<readonly [1, "x", 2, true], IsAssignableFn<number>>, readonly [1, 2]>>,
  Expect<Same<Filter<[1 | "x", 2], IsAssignableFn<number>>, [2]>>,
  Expect<Same<Filter<[1, any, 2], IsAssignableFn<number>>, [1, any, 2]>>,
  Expect<Same<Filter<[1, 2, 1], EqualFn<1>>, [1, 1]>>,
  Expect<Same<Filter<[], IsAssignableFn<string>>, []>>,
  Expect<Same<Filter<[1, "x"], ComposeFn<[NotFn, IsAssignableFn<number>]>>, ["x"]>>,
  Expect<Same<Filter<[1], ConstantFn<boolean>>, never>>,
  Expect<Same<Filter<[1], ConstantFn<never>>, never>>,
  Expect<Same<Filter<[1], ConstantFn<any>>, never>>,
  Expect<Same<Filter<number[], IsAssignableFn<number>>, never>>,
  Expect<Same<Filter<[1?], IsAssignableFn<number>>, never>>,
  Expect<Same<Reject<readonly [1, "x", 2, true], IsAssignableFn<number>>, readonly ["x", true]>>,
  Expect<Same<Reject<[], IsAssignableFn<number>>, []>>,
  Expect<Same<Reject<[1], ConstantFn<boolean>>, never>>,
  Expect<Same<Reject<number[], IsAssignableFn<number>>, never>>,
  Expect<Same<Reduce<readonly [1, 2, 3], AddFn, 0>, 6>>,
  Expect<Same<Reduce<[], AddFn, 42>, 42>>,
  Expect<Same<Reduce<[1, "bad", 3], AddFn, 0>, never>>,
  Expect<Same<Reduce<number[], AddFn, 0>, never>>,
  Expect<Same<Pipe<readonly [1, "x", 2], [FilterFn<IsAssignableFn<number>>, ReduceFn<AddFn, 0>]>, 3>>,
  Expect<Same<Pipe<readonly [1, "x", 2], [RejectFn<IsAssignableFn<number>>]>, readonly ["x"]>>,
  Expect<Same<Pipe<readonly [{ name: "Ada" }, { name: "Lin" }], [MapItemsFn<GetFn<"name">>, JoinFn<", ">]>, "Ada, Lin">>,
];

type Entity = { readonly id?: string; name: string; score?: number; value: string | undefined };
declare const symbolKey: unique symbol;
type SymbolRecord = { readonly [symbolKey]: number; optional?: number; text: string };
type Event = { kind: "a"; x?: 1 } | { kind: "b"; readonly y?: 2 };

export type ObjectCases = [
  Expect<Same<Merge<{ a: string; b: number }, { a: number }>, { a: number; b: number }>>,
  Expect<Same<Merge<{ readonly a: string }, { a?: number }>, { a?: number }>>,
  Expect<Same<SetRequired<{ readonly id?: string; name?: string }, "id">, { readonly id: string; name?: string }>>,
  Expect<Same<SetOptional<{ readonly id: string; name: string }, "id">, { readonly id?: string; name: string }>>,
  Expect<Same<SetReadonly<{ id: string; name: string }, "id">, { readonly id: string; name: string }>>,
  Expect<Same<SetMutable<{ readonly id: string; readonly name: string }, "id">, { id: string; readonly name: string }>>,
  Expect<Same<Mutable<readonly [1, 2]>, [1, 2]>>,
  Expect<Same<OptionalKeys<Entity>, "id" | "score">>,
  Expect<Same<RequiredKeys<Entity>, "name" | "value">>,
  Expect<Same<PickRequired<Entity>, { name: string; value: string | undefined }>>,
  // Optional properties match by their declared type.
  Expect<Same<PickByValue<SymbolRecord, number>, { readonly [symbolKey]: number; optional?: number }>>,
  Expect<Same<PickByValue<Entity, string>, { readonly id?: string; name: string }>>,
  Expect<Same<MapValues<{ readonly id: string; name?: string }, PromiseFn>, { readonly id: Promise<string>; name?: Promise<string> }>>,
  Expect<Same<MapValues<{ value: string | undefined }, PromiseFn>, { value: Promise<string | undefined> }>>,
  Expect<Same<Pipe<{ name: string; count: number }, [PickByValueFn<number>, MapValuesFn<PromiseFn>]>, { count: Promise<number> }>>,
];

// Every branch of a discriminated union keeps its own fields.
export type UnionObjectCases = [
  Expect<Same<SetRequired<Event, "kind">, { kind: "a"; x?: 1 } | { kind: "b"; readonly y?: 2 }>>,
  Expect<Same<SetRequired<Event, "x" | "y">, { kind: "a"; x: 1 } | { kind: "b"; readonly y: 2 }>>,
  Expect<Same<SetOptional<Event, "kind">, { kind?: "a"; x?: 1 } | { kind?: "b"; readonly y?: 2 }>>,
  Expect<Same<SetReadonly<Event, "x">, { kind: "a"; readonly x?: 1 } | { kind: "b"; readonly y?: 2 }>>,
  Expect<Same<SetMutable<Event, "y">, { kind: "a"; x?: 1 } | { kind: "b"; y?: 2 }>>,
  Expect<Same<Merge<Event, { at: number }>, { kind: "a"; x?: 1; at: number } | { kind: "b"; readonly y?: 2; at: number }>>,
  Expect<Same<Merge<{ a: string }, { a: number } | { b: 1 }>, { a: number } | { a: string; b: 1 }>>,
  Expect<Same<OptionalKeys<Event>, "x" | "y">>,
  Expect<Same<RequiredKeys<Event>, "kind">>,
  Expect<Same<PickRequired<Event>, { kind: "a" } | { kind: "b" }>>,
  Expect<Same<PickByValue<Event, number>, { x?: 1 } | { readonly y?: 2 }>>,
  Expect<Same<MapValues<Event, PromiseFn>, { kind: Promise<"a">; x?: Promise<1> } | { kind: Promise<"b">; readonly y?: Promise<2> }>>,
];

export type ObjectFnCases = [
  Expect<Same<Pipe<{ id?: string; name: string }, [SetRequiredFn<"id">, SetReadonlyFn<"name">]>, { id: string; readonly name: string }>>,
  Expect<Same<Pipe<{ readonly id: string }, [SetOptionalFn<"id">, SetMutableFn<"id">]>, { id?: string }>>,
  Expect<Same<Apply<MergeFn<{ b: 1 }>, { a: string }>, { a: string; b: 1 }>>,
  Expect<Same<Apply<SetRequiredFn<"x">, Event>, { kind: "a"; x: 1 } | { kind: "b"; readonly y?: 2 }>>,
  Expect<Same<Apply<SetRequiredFn<"missing">, { a: 1 }>, never>>,
  Expect<Same<Apply<MergeFn<{ b: 1 }>, "not an object">, never>>,
];

declare let record: SetReadonly<{ id: string; name: string }, "id">;
record.name = "changed";
// @ts-expect-error The original mutable property cannot defeat the readonly modifier.
record.id = "changed";

// @ts-expect-error Unknown object keys are rejected.
export type MissingKey = SetRequired<Entity, "missing">;

// @ts-expect-error Keys from no union member are rejected too.
export type MissingUnionKey = SetRequired<Event, "missing">;

// @ts-expect-error exactOptionalPropertyTypes distinguishes absence from explicit undefined.
const absentOnly: SetOptional<{ id: string }, "id"> = { id: undefined };
void absentOnly;
