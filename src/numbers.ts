import type { Reduce } from "./collections.js";
import type { Arg, TypeFn } from "./primitives/function.js";
import type { IsAny, IsNever, IsUnion } from "./primitives/logic.js";

type Enumerate<Acc extends number[] = []> = Acc["length"] extends 129
  ? Acc[number] : Enumerate<[...Acc, Acc["length"]]>;

/** A deliberate resource budget: operands AND results must be in 0..128. */
export type Natural = Enumerate;
export type IsNatural<N extends number> = IsAny<N> extends true ? false
  : IsNever<N> extends true ? false
    : IsUnion<N> extends true ? false
      : [N] extends [Natural] ? true : false;

type BuildLoop<N extends number, Value, Acc extends Value[] = []> =
  Acc["length"] extends N ? Acc : BuildLoop<N, Value, [...Acc, Value]>;

export type BuildTuple<N extends number, Value = unknown> =
  IsNatural<N> extends true ? BuildLoop<N, Value> : never;

type BoundedLength<T extends readonly unknown[]> = T["length"] extends Natural ? T["length"] : never;
type ValidPair<A extends number, B extends number> =
  IsNatural<A> extends true ? IsNatural<B> : false;

export type Add<A extends number, B extends number> = ValidPair<A, B> extends true
  ? BoundedLength<[...BuildTuple<A>, ...BuildTuple<B>]> : never;
export type Increment<N extends number> = Add<N, 1>;

/** A negative result is never, like every other result outside 0..128. */
export type Subtract<A extends number, B extends number> = ValidPair<A, B> extends true
  ? BuildTuple<A> extends [...BuildTuple<B>, ...infer Rest] ? Rest["length"] : never
  : never;
export type Decrement<N extends number> = Subtract<N, 1>;

export type Compare<A extends number, B extends number> = ValidPair<A, B> extends true
  ? A extends B ? 0
    : BuildTuple<A> extends [...BuildTuple<B>, ...unknown[]] ? 1 : -1
  : never;

type MultiplyLoop<A extends unknown[], B extends unknown[], Acc extends unknown[] = []> =
  B extends [unknown, ...infer Rest]
    ? [...Acc, ...A]["length"] extends Natural ? MultiplyLoop<A, Rest, [...Acc, ...A]> : never
    : Acc["length"];

export type Multiply<A extends number, B extends number> = ValidPair<A, B> extends true
  ? MultiplyLoop<BuildTuple<A>, BuildTuple<B>> : never;

type DivideLoop<A extends unknown[], B extends unknown[], Quotient extends unknown[] = []> =
  A extends [...B, ...infer Rest]
    ? DivideLoop<Rest, B, [...Quotient, unknown]>
    : [quotient: Quotient["length"], remainder: A["length"]];

export type DivMod<A extends number, B extends number> = ValidPair<A, B> extends true
  ? B extends 0 ? never : DivideLoop<BuildTuple<A>, BuildTuple<B>>
  : never;
export type Divide<A extends number, B extends number> =
  DivMod<A, B> extends infer Result
    ? IsNever<Result> extends true ? never : Result extends [infer Q, number] ? Q : never
    : never;
export type Modulo<A extends number, B extends number> =
  DivMod<A, B> extends infer Result
    ? IsNever<Result> extends true ? never : Result extends [number, infer R] ? R : never
    : never;

// With Operand, an operator is unary: XFn<N> computes X<Input, N>. Without it, the
// operator takes [left, right], which is the shape Reduce passes: ReduceFn<AddFn, 0>.
type OperatorInput<Operand extends number> =
  IsNever<Operand> extends true ? readonly [number, number] : readonly [number];
type RightOperand<Self extends TypeFn, Operand extends number> =
  IsNever<Operand> extends true ? Arg<Self, 1, number> : Operand;

export interface AddFn<Operand extends number = never> extends TypeFn {
  readonly input: OperatorInput<Operand>;
  readonly output: Add<Arg<this, 0, number>, RightOperand<this, Operand>>;
}
export interface SubtractFn<Operand extends number = never> extends TypeFn {
  readonly input: OperatorInput<Operand>;
  readonly output: Subtract<Arg<this, 0, number>, RightOperand<this, Operand>>;
}
export interface MultiplyFn<Operand extends number = never> extends TypeFn {
  readonly input: OperatorInput<Operand>;
  readonly output: Multiply<Arg<this, 0, number>, RightOperand<this, Operand>>;
}
export interface DivideFn<Operand extends number = never> extends TypeFn {
  readonly input: OperatorInput<Operand>;
  readonly output: Divide<Arg<this, 0, number>, RightOperand<this, Operand>>;
}
export interface ModuloFn<Operand extends number = never> extends TypeFn {
  readonly input: OperatorInput<Operand>;
  readonly output: Modulo<Arg<this, 0, number>, RightOperand<this, Operand>>;
}

export type Sum<T extends readonly number[]> = Reduce<T, AddFn, 0>;
