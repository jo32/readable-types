// https://github.com/type-challenges/type-challenges/blob/main/questions/31997-extreme-parameter-intersection/README.md
import type { Simplify } from "../../../src/index.js";

// Element types meet with &; objects are flattened so { a: 0 } & { c: 2 } reads as { a: 0; c: 2 }.
type IntersectItems<A, B> = A & B extends infer Both ? Both extends object ? Simplify<Both> : Both : never;

/** The first position of a parameter list: ["none"] | ["required" | "optional", Item, Rest] | ["rest", Item]. */
type FirstSlot<Params extends readonly unknown[]> =
  Params extends readonly [] ? ["none"]
    : Params extends readonly [infer Item, ...infer Rest] ? ["required", Item, Rest]
      // A plain array also matches [X?, ...Rest], so only a list whose Required form has a
      // first element really starts with an optional slot.
      : Required<Params> extends readonly [unknown, ...unknown[]]
        ? Params extends readonly [(infer Item)?, ...infer Rest] ? ["optional", Item, Rest] : never
        : Params extends readonly (infer Item)[] ? ["rest", Item]
          : never;

type AppendSlot<Acc extends unknown[], Kind, Item> =
  Kind extends "required" ? [...Acc, Item]
    : Kind extends "optional" ? [...Acc, ...[Item?]]
      : [...Acc, ...Item[]];

/**
 * Walk both lists in step. Once one side runs out, the other side's remainder is kept as is.
 * A rest element keeps applying to later positions of the other side. A position is required
 * if either side requires it, otherwise optional; two rest elements meet in a final rest.
 */
type IntersectLoop<L extends readonly unknown[], R extends readonly unknown[], Acc extends unknown[] = []> =
  [FirstSlot<L>, FirstSlot<R>] extends [infer Left extends unknown[], infer Right extends unknown[]]
    ? Left[0] extends "none" ? [...Acc, ...R]
      : Right[0] extends "none" ? [...Acc, ...L]
        : [Left[0], Right[0]] extends ["rest", "rest"]
          ? AppendSlot<Acc, "rest", IntersectItems<Left[1], Right[1]>>
          : IntersectLoop<
            Left[0] extends "rest" ? L : Extract<Left[2], readonly unknown[]>,
            Right[0] extends "rest" ? R : Extract<Right[2], readonly unknown[]>,
            AppendSlot<Acc, "required" extends Left[0] | Right[0] ? "required" : "optional", IntersectItems<Left[1], Right[1]>>
          >
    : never;

type IntersectParameters<
  l extends readonly unknown[],
  r extends readonly unknown[],
> = IntersectLoop<l, r>;

// Official test cases from type-challenges@0b0b0b1, unchanged except for the import path.
import type { Equal, Expect } from '../utils.js'

type result1 = IntersectParameters<[], []>
type TwoEmpty = Expect<Equal<[], result1>>

type result2 = IntersectParameters<[], [string, number, ...boolean[]]>
type OneEmpty = Expect<Equal<[string, number, ...boolean[]], result2>>

type result3 = IntersectParameters<['a'], [string, number]>
type LongerParametersPreserved = Expect<Equal<['a', number], result3>>

type result4 = IntersectParameters<[unknown], []>
// Avoids evaluating unknown to {}
type UnknownPreserved = Expect<Equal<[unknown], result4>>

type result5 = IntersectParameters<[('a' | 'b' | 'c')?], [string, 1 | 2 | 3]>
type OneOptional = Expect<Equal<['a' | 'b' | 'c', 1 | 2 | 3], result5>>

type result6 = IntersectParameters<[{ a: 0 }?], [{ b: 1 }?]>
type BothOptional = Expect<Equal<[{ a: 0, b: 1 }?], result6>>

type result7 = IntersectParameters<[{ a: 0 }?], []>
type OptionalAndNotPresent = Expect<Equal<[{ a: 0 }?], result7>>

type result8 = IntersectParameters<{ a: 0 }[], { b: 1 }[]>
type TwoNonFixedLength = Expect<Equal<{ a: 0, b: 1 }[], result8>>

type result9 = IntersectParameters<[{ a: 0 }, { b: 1 }], { c: 2 }[]>
type OneNonFixedLength = Expect<
    Equal<
        [
          {
            a: 0
            c: 2
          },
          {
            b: 1
            c: 2
          },
          ...{
            c: 2
          }[],
        ],
        result9
    >
>

type result10 = IntersectParameters<
    [{ a: 0 }, ...{ b: 1 }[]],
    [{ c: 2 }, { d: 3 }]
>
type OneTrailingRest = Expect<
    Equal<
        [
          {
            a: 0
            c: 2
          },
          {
            b: 1
            d: 3
          },
          ...{
            b: 1
          }[],
        ],
        result10
    >
>

type result11 = IntersectParameters<
    [{ a: 0 }, ...{ b: 1 }[]],
    [{ c: 2 }, { d: 3 }, ...{ e: 4 }[]]
>
type TwoTrailingRest = Expect<
    Equal<
        [
          {
            a: 0
            c: 2
          },
          {
            b: 1
            d: 3
          },
          ...{
            b: 1
            e: 4
          }[],
        ],
        result11
    >
>

type result12 = IntersectParameters<
    [{ a: 0 }, { b: 1 }?, { c: 2 }?, ...{ d: 3 }[]],
    [{ e: 4 }?, { f: 5 }?, ...{ g: 6 }[]]
>
type KitchenSink = Expect<
    Equal<
        [
          {
            a: 0
            e: 4
          },
            {
              b: 1
              f: 5
            }?,
            {
              c: 2
              g: 6
            }?,
            ...{
              d: 3
              g: 6
            }[],
        ],
        result12
    >
>

type result13 = IntersectParameters<['a', 'b'], [string, ...string[]]>
type ExtraVariadicArgsPreserved = Expect<
    Equal<['a', 'b', ...string[]], result13>
>
