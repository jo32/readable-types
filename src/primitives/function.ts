import type { Get } from "./access.js";
import type { Equal, IsAssignable, IsAny, IsFiniteTuple, IsNever, Not } from "./logic.js";

/**
 * A userland encoding of a type-level function. `input` is its domain;
 * `args` is bound by Call, and polymorphic `this` computes its `output`.
 * Naming rule: every TypeFn ends in `Fn`, and the pipeable form of a direct
 * type `X<Input, ...Rest>` is `XFn<...Rest>`.
 */
export interface TypeFn {
  readonly input: readonly unknown[];
  // Keep this independent of input: intersecting a constrained array with a
  // literal tuple can corrupt tuple inference inside higher-order functions.
  readonly args: readonly unknown[];
  readonly output: unknown;
}

/**
 * Read argument Index inside a TypeFn's output, narrowed to Constraint so it can be
 * passed to constrained generics, e.g. `Add<Arg<this, 0, number>, 1>`. A mismatch is never.
 */
export type Arg<Self extends TypeFn, Index extends number, Constraint = unknown> =
  Self["args"][Index] extends infer Value extends Constraint ? Value : never;

// Readonly and mutable argument tuples both satisfy an input declared either way.
type Writable<T> = { -readonly [K in keyof T]: T[K] };

/** Wrong arity/domain returns never. Args is a tuple, not a runtime argument list. */
export type Call<F extends TypeFn, Args extends readonly unknown[]> =
  IsAny<Args> extends true ? never
    : IsNever<Args> extends true ? never
      : [Writable<Args>] extends [F["input"]]
        ? (F & { readonly args: Args })["output"]
        : never;

export type Apply<F extends TypeFn, Input> = Call<F, readonly [Input]>;

export interface IdentityFn extends TypeFn {
  readonly input: readonly [unknown];
  readonly output: Arg<this, 0>;
}

/** Ignores its arguments, so it accepts any arity. */
export interface ConstantFn<Value> extends TypeFn {
  readonly output: Value;
}

/** Pipeable Equal<Input, Value>. */
export interface EqualFn<Value> extends TypeFn {
  readonly input: readonly [unknown];
  readonly output: Equal<Arg<this, 0>, Value>;
}

/**
 * Pipeable IsAssignable<Input, Target>. Unlike the direct form it decides any the way an
 * assignment does (true, unless Target is never), so Filter always receives true or false.
 */
export interface IsAssignableFn<Target> extends TypeFn {
  readonly input: readonly [unknown];
  readonly output: IsAny<Arg<this, 0>> extends true
    ? Not<IsNever<Target>>
    : IsAssignable<Arg<this, 0>, Target>;
}

/** Pipeable Not<Input>; inside ComposeFn it negates a predicate. */
export interface NotFn extends TypeFn {
  readonly input: readonly [boolean];
  readonly output: Not<Arg<this, 0, boolean>>;
}

/** Pipeable Get<Input, Key>; a missing key is never rather than a compile error. */
export interface GetFn<Key extends PropertyKey> extends TypeFn {
  readonly input: readonly [unknown];
  readonly output: Key extends keyof Arg<this, 0> ? Get<Arg<this, 0>, Key> : never;
}

/** Pipeable Awaited<Input>. */
export interface AwaitedFn extends TypeFn {
  readonly input: readonly [unknown];
  readonly output: Awaited<Arg<this, 0>>;
}

/** Pipeable Promise<Input>. */
export interface PromiseFn extends TypeFn {
  readonly input: readonly [unknown];
  readonly output: Promise<Arg<this, 0>>;
}

type PipeLoop<Input, Functions extends readonly TypeFn[]> =
  IsNever<Input> extends true ? never
    : Functions extends readonly [infer F extends TypeFn, ...infer Rest extends TypeFn[]]
      ? PipeLoop<Apply<F, Input>, Rest>
      : Input;

/** Apply unary type functions from left to right; never stops the pipeline. */
export type Pipe<Input, Functions extends readonly TypeFn[]> =
  IsFiniteTuple<Functions> extends true ? PipeLoop<Input, Functions> : never;

export interface PipeFn<Functions extends readonly TypeFn[]> extends TypeFn {
  readonly input: readonly [unknown];
  readonly output: Pipe<Arg<this, 0>, Functions>;
}

type ComposeLoop<Input, Functions extends readonly TypeFn[]> =
  IsNever<Input> extends true ? never
    : Functions extends readonly [...infer Rest extends TypeFn[], infer F extends TypeFn]
      ? ComposeLoop<Apply<F, Input>, Rest>
      : Input;

/** Apply unary type functions from right to left: Compose<X, [F, G]> = F(G(X)). */
export type Compose<Input, Functions extends readonly TypeFn[]> =
  IsFiniteTuple<Functions> extends true ? ComposeLoop<Input, Functions> : never;

export interface ComposeFn<Functions extends readonly TypeFn[]> extends TypeFn {
  readonly input: readonly [unknown];
  readonly output: Compose<Arg<this, 0>, Functions>;
}
