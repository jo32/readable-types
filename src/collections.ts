import type { Apply, Arg, Call, TypeFn } from "./primitives/function.js";
import type { PreserveReadonly } from "./primitives/internal.js";
import type { Equal, IsFiniteTuple, IsNever, Not } from "./primitives/logic.js";

/**
 * Homomorphic mapping preserves tuple labels, optional slots and readonly. An optional
 * slot passes its declared type to Mapper, without the implicit undefined.
 */
export type MapItems<T extends readonly unknown[], Mapper extends TypeFn> = {
  [K in keyof T]: Apply<Mapper, Required<T>[K]>;
};

// Keep is true for Filter and false for Reject.
type FilterLoop<
  T extends readonly unknown[], Predicate extends TypeFn, Keep extends boolean, Acc extends unknown[] = [],
> =
  T extends readonly [infer First, ...infer Rest]
    ? Apply<Predicate, First> extends infer Result
      ? Equal<Result, Keep> extends true ? FilterLoop<Rest, Predicate, Keep, [...Acc, First]>
        : Equal<Result, Not<Keep>> extends true ? FilterLoop<Rest, Predicate, Keep, Acc>
          : never
      : never
    : Acc;

/** Keep items whose predicate is true. Predicates must produce exactly true or false. */
export type Filter<T extends readonly unknown[], Predicate extends TypeFn> =
  IsFiniteTuple<T> extends true ? PreserveReadonly<T, FilterLoop<T, Predicate, true>> : never;

/** Drop items whose predicate is true: the inverse of Filter, with the same rules. */
export type Reject<T extends readonly unknown[], Predicate extends TypeFn> =
  IsFiniteTuple<T> extends true ? PreserveReadonly<T, FilterLoop<T, Predicate, false>> : never;

type ReduceLoop<T extends readonly unknown[], Reducer extends TypeFn, Acc> =
  IsNever<Acc> extends true ? never
    : T extends readonly [infer First, ...infer Rest]
      ? ReduceLoop<Rest, Reducer, Call<Reducer, readonly [Acc, First]>>
      : Acc;

/** Reducer receives [accumulator, item], like Array.prototype.reduce. */
export type Reduce<T extends readonly unknown[], Reducer extends TypeFn, Initial> =
  IsFiniteTuple<T> extends true ? ReduceLoop<T, Reducer, Initial> : never;

export interface MapItemsFn<Mapper extends TypeFn> extends TypeFn {
  readonly input: readonly [readonly unknown[]];
  readonly output: MapItems<Arg<this, 0, readonly unknown[]>, Mapper>;
}

export interface FilterFn<Predicate extends TypeFn> extends TypeFn {
  readonly input: readonly [readonly unknown[]];
  readonly output: Filter<Arg<this, 0, readonly unknown[]>, Predicate>;
}

export interface RejectFn<Predicate extends TypeFn> extends TypeFn {
  readonly input: readonly [readonly unknown[]];
  readonly output: Reject<Arg<this, 0, readonly unknown[]>, Predicate>;
}

export interface ReduceFn<Reducer extends TypeFn, Initial> extends TypeFn {
  readonly input: readonly [readonly unknown[]];
  readonly output: Reduce<Arg<this, 0, readonly unknown[]>, Reducer, Initial>;
}
