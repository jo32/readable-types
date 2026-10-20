import type { Arg, TypeFn } from "./primitives/function.js";
import type { IsFiniteTuple } from "./primitives/logic.js";

type Whitespace = " " | "\n" | "\r" | "\t";
export type Trim<S extends string> = S extends `${Whitespace}${infer Rest}` ? Trim<Rest>
  : S extends `${infer Rest}${Whitespace}` ? Trim<Rest> : S;

type SplitLoop<S extends string, Separator extends string, Acc extends string[] = []> =
  S extends `${infer First}${Separator}${infer Rest}`
    ? SplitLoop<Rest, Separator, [...Acc, First]>
    : [...Acc, S];
type Characters<S extends string, Acc extends string[] = []> =
  S extends `${infer First}${infer Rest}` ? Characters<Rest, [...Acc, First]> : Acc;

/** Literal strings are split exactly; broad strings conservatively yield string[]. */
export type Split<S extends string, Separator extends string> =
  string extends S | Separator ? string[]
    : Separator extends "" ? Characters<S> : SplitLoop<S, Separator>;

// Accumulates the result so the recursion stays in tail position.
type JoinLoop<T extends readonly string[], Separator extends string, Acc extends string> =
  T extends readonly [infer First extends string, ...infer Rest extends string[]]
    ? JoinLoop<Rest, Separator, `${Acc}${Separator}${First}`>
    : Acc;

/** Finite tuples are joined exactly; arrays and optional/rest tuples yield string. */
export type Join<T extends readonly string[], Separator extends string = ","> =
  IsFiniteTuple<T> extends true
    ? T extends readonly [infer First extends string, ...infer Rest extends string[]]
      ? JoinLoop<Rest, Separator, First> : ""
    : string;

export interface TrimFn extends TypeFn {
  readonly input: readonly [string];
  readonly output: Trim<Arg<this, 0, string>>;
}
export interface SplitFn<Separator extends string> extends TypeFn {
  readonly input: readonly [string];
  readonly output: Split<Arg<this, 0, string>, Separator>;
}
export interface JoinFn<Separator extends string> extends TypeFn {
  readonly input: readonly [readonly string[]];
  readonly output: Join<Arg<this, 0, readonly string[]>, Separator>;
}
