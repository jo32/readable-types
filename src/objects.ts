import type { AllKeys } from "./primitives/access.js";
import type { Apply, Arg, TypeFn } from "./primitives/function.js";

// These helpers apply to each member of a union separately, so every branch of a
// discriminated union keeps its own fields. Key parameters accept AllKeys<T>.

/** Flatten a record intersection for readable editor output, not deep normalization. */
export type Simplify<T> = { [K in keyof T]: T[K] };

/** Right-hand property definitions replace left-hand ones, including modifiers. */
export type Merge<A extends object, B extends object> = A extends unknown
  ? B extends unknown ? Simplify<Omit<A, keyof B> & B> : never
  : never;
export type SetRequired<T extends object, K extends AllKeys<T>> = T extends unknown
  ? Simplify<Omit<T, K> & Required<Pick<T, K & keyof T>>> : never;
export type SetOptional<T extends object, K extends AllKeys<T>> = T extends unknown
  ? Simplify<Omit<T, K> & Partial<Pick<T, K & keyof T>>> : never;
export type SetReadonly<T extends object, K extends AllKeys<T>> = T extends unknown
  ? Simplify<Omit<T, K> & Readonly<Pick<T, K & keyof T>>> : never;
export type Mutable<T> = { -readonly [K in keyof T]: T[K] };
export type SetMutable<T extends object, K extends AllKeys<T>> = T extends unknown
  ? Simplify<Omit<T, K> & Mutable<Pick<T, K & keyof T>>> : never;

export type OptionalKeys<T extends object> = T extends unknown
  ? { [K in keyof T]-?: {} extends Pick<T, K> ? K : never }[keyof T]
  : never;
export type RequiredKeys<T extends object> = T extends unknown
  ? Exclude<keyof T, OptionalKeys<T>> : never;
export type PickRequired<T extends object> = T extends unknown
  ? Pick<T, RequiredKeys<T> & keyof T> : never;

/** Keep properties whose declared type is assignable to Value; preserves modifiers. */
export type PickByValue<T extends object, Value> = T extends unknown
  ? { [K in keyof T as [Required<T>[K]] extends [Value] ? K : never]: T[K] }
  : never;

/** Optional properties pass their declared type to Mapper, without the implicit undefined. */
export type MapValues<T extends object, Mapper extends TypeFn> = {
  [K in keyof T]: Apply<Mapper, Required<T>[K]>;
};

export interface MergeFn<B extends object> extends TypeFn {
  readonly input: readonly [object];
  readonly output: Merge<Arg<this, 0, object>, B>;
}

// The Set*Fn forms return never when the piped object has none of the keys.
export interface SetRequiredFn<K extends PropertyKey> extends TypeFn {
  readonly input: readonly [object];
  readonly output: Arg<this, 0, object> extends infer T extends object
    ? [K] extends [AllKeys<T>] ? SetRequired<T, K & AllKeys<T>> : never
    : never;
}
export interface SetOptionalFn<K extends PropertyKey> extends TypeFn {
  readonly input: readonly [object];
  readonly output: Arg<this, 0, object> extends infer T extends object
    ? [K] extends [AllKeys<T>] ? SetOptional<T, K & AllKeys<T>> : never
    : never;
}
export interface SetReadonlyFn<K extends PropertyKey> extends TypeFn {
  readonly input: readonly [object];
  readonly output: Arg<this, 0, object> extends infer T extends object
    ? [K] extends [AllKeys<T>] ? SetReadonly<T, K & AllKeys<T>> : never
    : never;
}
export interface SetMutableFn<K extends PropertyKey> extends TypeFn {
  readonly input: readonly [object];
  readonly output: Arg<this, 0, object> extends infer T extends object
    ? [K] extends [AllKeys<T>] ? SetMutable<T, K & AllKeys<T>> : never
    : never;
}

export interface MapValuesFn<Mapper extends TypeFn> extends TypeFn {
  readonly input: readonly [object];
  readonly output: MapValues<Arg<this, 0, object>, Mapper>;
}

export interface PickByValueFn<Value> extends TypeFn {
  readonly input: readonly [object];
  readonly output: PickByValue<Arg<this, 0, object>, Value>;
}
