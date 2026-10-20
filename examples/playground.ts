import type {
  AddFn, Apply, Arg, Asyncify, Call, Compose, Curry, FilterFn, GetFn, IsAssignableFn, JoinFn,
  MapItems, MapItemsFn, MapValuesFn, Merge, MultiplyFn, PartialApply, PickByValueFn, Pipe,
  Promisify, ReduceFn, RejectFn, SetRequired, SplitFn, TrimFn, TypeFn,
} from "../src/index.js";
import { promisify, tuple } from "../src/runtime.js";

// 1. Types are inputs and outputs. Wrap an existing type alias and it can be passed as an argument.
//    Naming rule: every TypeFn ends in Fn; Arg<this, 0> reads the first argument.
type BoxValue<T> = { readonly value: T };
export interface BoxFn extends TypeFn {
  readonly input: readonly [unknown];
  readonly output: BoxValue<Arg<this, 0>>;
}

export type Boxed = Apply<BoxFn, "hello">;                   // { readonly value: "hello" }
export type BoxedTuple = MapItems<readonly [1, "a"], BoxFn>; // readonly [BoxValue<1>, BoxValue<"a">]
export type Seven = Call<AddFn, [3, 4]>;                     // 7
export type Twenty = Pipe<3, [AddFn<2>, MultiplyFn<4>]>;     // (3 + 2) * 4 = 20
export type TwentyAgain = Compose<3, [MultiplyFn<4>, AddFn<2>]>;

// 2. The same higher-order functions combine type computations from different domains.
export type Total = Pipe<
  readonly [1, "skip", 2, false, 3],
  [FilterFn<IsAssignableFn<number>>, ReduceFn<AddFn, 0>]
>; // 6
export type Skipped = Pipe<readonly [1, "skip", 2, false], [RejectFn<IsAssignableFn<number>>]>;
// readonly ["skip", false]

export type Names = Pipe<
  readonly [{ name: "Ada" }, { name: "Lin" }],
  [MapItemsFn<GetFn<"name">>, JoinFn<", ">]
>; // "Ada, Lin"

export type Route = Pipe<"  users,profile,edit  ", [TrimFn, SplitFn<",">, JoinFn<"/">]>;
// "users/profile/edit"

// 3. Object modeling: readonly/optional are preserved; field override and type intersection are different operations.
export type App = {
  readonly id: string;
  name: string;
  owner: string;
  createdAt: number;
};
export type AppUpdate = SetRequired<Partial<App>, "id">;
export const update = { id: "app-1", name: "type-functions" } satisfies AppUpdate;
export type WireApp = Merge<App, { createdAt: string }>; // the timestamp field is replaced by a string
export type TextBoxes = Pipe<App, [PickByValueFn<string>, MapValuesFn<BoxFn>]>;
// { readonly id: BoxValue<string>; name: BoxValue<string>; owner: BoxValue<string> }

// Each branch of a union keeps its own fields.
export type AppEvent =
  | { kind: "created"; app: App; note?: string }
  | { kind: "renamed"; id: string; name: string };
export type StampedEvent = Merge<AppEvent, { at: number }>;

// 4. TypeFn describes compile-time computation; the types below describe JavaScript function signatures.
export type LoadApp = (id: string, includeOwner: boolean) => App;
export type AsyncLoadApp = Asyncify<LoadApp>;          // (...) => Promise<App>
export type CurriedLoadApp = Curry<LoadApp>;           // (id: string) => (includeOwner: boolean) => App
export type LoadKnownApp = PartialApply<LoadApp, ["app-1"]>; // (includeOwner: boolean) => App
export type FindApp = (id: string, options?: { cache: boolean }) => App;
export type FindKnownApp = PartialApply<FindApp, ["app-1"]>; // (options?: { cache: boolean }) => App

export type CallbackLoadApp = (
  id: string,
  done: (error: Error | null, result: App) => void,
) => void;
export type PromiseLoadApp = Promisify<CallbackLoadApp>; // (id: string) => Promise<App>

// 5. A small runtime bridge, using const type parameters and native Promise.
export const items = tuple("alpha", 2, true);             // readonly ["alpha", 2, true]

export const loadApp: PromiseLoadApp = promisify(
  (id: string, done: (error: Error | null, app: App) => void): void => {
    done(null, { id, name: "Demo", owner: "Ada", createdAt: 0 });
  },
);
