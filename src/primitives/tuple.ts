import type { Arg, TypeFn } from "./function.js";
import type { PreserveReadonly } from "./internal.js";
import type { IsFiniteTuple } from "./logic.js";

export type Head<T extends readonly unknown[]> =
  T extends readonly [infer First, ...unknown[]] ? First : never;
export type Last<T extends readonly unknown[]> =
  T extends readonly [...unknown[], infer End] ? End : never;
export type Tail<T extends readonly unknown[]> =
  T extends readonly [unknown, ...infer Rest] ? PreserveReadonly<T, Rest>
    : T extends readonly [] ? T : never;
export type Init<T extends readonly unknown[]> =
  T extends readonly [...infer Rest, unknown] ? PreserveReadonly<T, Rest>
    : T extends readonly [] ? T : never;
export type Push<T extends readonly unknown[], Value> = PreserveReadonly<T, [...T, Value]>;
export type Prepend<T extends readonly unknown[], Value> = PreserveReadonly<T, [Value, ...T]>;
export type Concat<A extends readonly unknown[], B extends readonly unknown[]> =
  A extends unknown[] ? B extends unknown[] ? [...A, ...B] : readonly [...A, ...B]
    : readonly [...A, ...B];

type ReverseLoop<T extends readonly unknown[], Acc extends unknown[] = []> =
  T extends readonly [infer First, ...infer Rest] ? ReverseLoop<Rest, [First, ...Acc]> : Acc;

export type Reverse<T extends readonly unknown[]> = IsFiniteTuple<T> extends true
  ? PreserveReadonly<T, ReverseLoop<T>> : never;

type ZipLoop<A extends readonly unknown[], B extends readonly unknown[], Acc extends unknown[] = []> =
  A extends readonly [infer AH, ...infer AT]
    ? B extends readonly [infer BH, ...infer BT] ? ZipLoop<AT, BT, [...Acc, [AH, BH]]> : Acc
    : Acc;

/** Zip stops at the shorter tuple; outer readonly follows either input. */
export type Zip<A extends readonly unknown[], B extends readonly unknown[]> =
  IsFiniteTuple<A> extends true
    ? IsFiniteTuple<B> extends true
      ? A extends unknown[] ? PreserveReadonly<B, ZipLoop<A, B>> : Readonly<ZipLoop<A, B>>
      : never
    : never;

export interface HeadFn extends TypeFn {
  readonly input: readonly [readonly unknown[]];
  readonly output: Head<Arg<this, 0, readonly unknown[]>>;
}
export interface LastFn extends TypeFn {
  readonly input: readonly [readonly unknown[]];
  readonly output: Last<Arg<this, 0, readonly unknown[]>>;
}
export interface TailFn extends TypeFn {
  readonly input: readonly [readonly unknown[]];
  readonly output: Tail<Arg<this, 0, readonly unknown[]>>;
}
export interface InitFn extends TypeFn {
  readonly input: readonly [readonly unknown[]];
  readonly output: Init<Arg<this, 0, readonly unknown[]>>;
}
export interface PushFn<Value> extends TypeFn {
  readonly input: readonly [readonly unknown[]];
  readonly output: Push<Arg<this, 0, readonly unknown[]>, Value>;
}
export interface PrependFn<Value> extends TypeFn {
  readonly input: readonly [readonly unknown[]];
  readonly output: Prepend<Arg<this, 0, readonly unknown[]>, Value>;
}
export interface ConcatFn<B extends readonly unknown[]> extends TypeFn {
  readonly input: readonly [readonly unknown[]];
  readonly output: Concat<Arg<this, 0, readonly unknown[]>, B>;
}
export interface ReverseFn extends TypeFn {
  readonly input: readonly [readonly unknown[]];
  readonly output: Reverse<Arg<this, 0, readonly unknown[]>>;
}
export interface ZipFn<B extends readonly unknown[]> extends TypeFn {
  readonly input: readonly [readonly unknown[]];
  readonly output: Zip<Arg<this, 0, readonly unknown[]>, B>;
}
