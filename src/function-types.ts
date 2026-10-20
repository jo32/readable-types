import type { IsFiniteTuple, IsNever } from "./primitives/logic.js";

/** A constraint for callable values, not a function intended to be invoked. */
export type Callable = (...args: never[]) => unknown;

type Signature<F extends Callable, Args extends unknown[], Result> =
  unknown extends ThisParameterType<F> ? (...args: Args) => Result
    : (this: ThisParameterType<F>, ...args: Args) => Result;

export type ResolvedReturn<F extends Callable> = Awaited<ReturnType<F>>;
export type WithReturn<F extends Callable, Result> = Signature<F, Parameters<F>, Result>;
export type Asyncify<F extends Callable> = WithReturn<F, Promise<ResolvedReturn<F>>>;

type Curried<Args extends unknown[], Result> =
  Args extends [infer First, ...infer Rest]
    ? (arg: First) => Rest extends [] ? Result : Curried<Rest, Result>
    : () => Result;

/** Required, fixed parameter lists only. Explicit this belongs to the first call. */
export type Curry<F extends Callable> = IsFiniteTuple<Parameters<F>> extends true
  ? Curried<Parameters<F>, ReturnType<F>> extends infer C extends Callable
    ? Signature<F, Parameters<C>, ReturnType<C>> : never
  : never;

type DropBound<Args extends unknown[], Bound extends readonly unknown[]> =
  Bound extends readonly [infer Value, ...infer Rest]
    ? Args extends [infer Parameter, ...infer Tail]
      ? [Value] extends [Parameter] ? DropBound<Tail, Rest> : never
      : never
    : Args;

/**
 * Bind a prefix of the required parameters. Optional and rest parameters after that
 * prefix are kept; binding into them is never. Retains explicit this.
 */
export type PartialApply<F extends Callable, Bound extends readonly unknown[]> =
  IsFiniteTuple<Bound> extends true
    ? DropBound<Parameters<F>, Bound> extends infer Rest
      ? IsNever<Rest> extends true ? never
        : Rest extends unknown[] ? Signature<F, Rest, ReturnType<F>> : never
      : never
    : never;

export type Flip<F extends Callable> = Parameters<F> extends [infer A, infer B]
  ? Signature<F, [B, A], ReturnType<F>> : never;

// The first callback parameter is the error: it must accept null or undefined (success).
type AcceptsNoError<ErrorParameter> = [null] extends [ErrorParameter] ? true
  : [undefined] extends [ErrorParameter] ? true : false;

/** Error-first callbacks with zero or one success value; multiple values are unsupported. */
type CallbackResult<C> = C extends Callable
  ? Parameters<C> extends [] ? never
    : AcceptsNoError<Parameters<C>[0]> extends true
      ? Parameters<C> extends [unknown?, ...infer Values]
        ? Values extends [] ? void
          : Values extends [unknown?] ? Values[0] : never
        : never
      : never
  : never;

/**
 * Transform a required final error-first callback into an awaited Promise result.
 * Like Parameters/ReturnType, overloads use their last signature and generic
 * correlations are not universally preserved. Use a concrete adapter when needed.
 */
export type Promisify<F extends Callable> =
  Parameters<F> extends [...infer Args, infer Callback]
    ? CallbackResult<Callback> extends infer Result
      ? IsNever<Result> extends true ? never : Signature<F, Args, Promise<Awaited<Result>>>
      : never
    : never;
