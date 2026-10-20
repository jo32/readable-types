// https://github.com/type-challenges/type-challenges/blob/main/questions/33345-extreme-dynamic-route/README.md
import type { Simplify, Split } from "../../../src/index.js";

/**
 * ["optional-catch-all", name] | ["catch-all", name] | ["dynamic", name] | ["static"] | ["skip"].
 * `[...]` has nothing after the dots, so it is an ordinary dynamic segment named "...".
 */
type Classify<Segment extends string> =
  Segment extends "" | "[]" ? ["skip"]
    : Segment extends `[[...${infer Name}]]` ? Name extends "" ? ["static"] : ["optional-catch-all", Name]
      : Segment extends `[...${infer Name}]` ? Name extends "" ? ["dynamic", "..."] : ["catch-all", Name]
        : Segment extends `[${infer Name}]` ? ["dynamic", Name]
          : ["static"];

/**
 * Two catch-all segments with no static segment between them are ambiguous, so the route is
 * never. AfterCatchAll is true while a catch-all has been seen since the last static segment.
 */
type RouteParams<
  Segments extends string[], Required = {}, Optional = {}, AfterCatchAll extends boolean = false,
> =
  Segments extends [infer Segment extends string, ...infer Rest extends string[]]
    ? Classify<Segment> extends infer Kind
      ? Kind extends ["optional-catch-all", infer Name extends string]
        ? AfterCatchAll extends true ? never : RouteParams<Rest, Required, Optional & Record<Name, string[]>, true>
        : Kind extends ["catch-all", infer Name extends string]
          ? AfterCatchAll extends true ? never : RouteParams<Rest, Required & Record<Name, string[]>, Optional, true>
          : Kind extends ["dynamic", infer Name extends string]
            ? RouteParams<Rest, Required & Record<Name, string>, Optional, AfterCatchAll>
            : Kind extends ["static"]
              ? RouteParams<Rest, Required, Optional, false>
              : RouteParams<Rest, Required, Optional, AfterCatchAll>
      : never
    : Simplify<Required & Partial<Optional>>;

type DynamicRoute<T extends string> = RouteParams<Split<T, "/">>;

// Official test cases from type-challenges@0b0b0b1, unchanged except for the import path.
import type { Equal, Expect } from '../utils.js'

type cases = [
  Expect<Equal<DynamicRoute<'/shop'>, {}>>,
  Expect<Equal<DynamicRoute<'/shop/[]'>, {}>>,
  Expect<Equal<DynamicRoute<'/shop/[slug]'>, { slug: string }>>,
  Expect<Equal<DynamicRoute<'/shop/[slug]/'>, { slug: string }>>,
  Expect<
    Equal<DynamicRoute<'/shop/[slug]/[foo]'>, { slug: string, foo: string }>
  >,
  Expect<
    Equal<
      DynamicRoute<'/shop/[slug]/stub/[foo]'>,
      { slug: string, foo: string }
    >
  >,
  Expect<
    Equal<
      DynamicRoute<'/shop/[slug]/stub/[foo]'>,
      { slug: string, foo: string }
    >
  >,
  Expect<
    Equal<
      DynamicRoute<'/shop/[slug]/stub/[...foo]'>,
      { slug: string, foo: string[] }
    >
  >,
  Expect<
    Equal<
      DynamicRoute<'/shop/[slug]/stub/[[...foo]]'>,
      { slug: string, foo?: string[] }
    >
  >,
  Expect<
    Equal<
      DynamicRoute<'/shop/[slug]/stub/[[...foo]]/[]'>,
      { slug: string, foo?: string[] }
    >
  >,
  Expect<
    Equal<
      DynamicRoute<'/shop/[slug]/stub/[[...foo]]/[...]'>,
      { slug: string, foo?: string[], '...': string }
    >
  >,
  Expect<
    Equal<
      DynamicRoute<'/shop/[slug]/stub/[[...foo]]/[...]/[]index.html'>,
      { slug: string, foo?: string[], '...': string }
    >
  >,
  Expect<
    Equal<
      DynamicRoute<'/shop/[slug]/stub/[[...foo]]/[...]/[...]index.html'>,
      { slug: string, foo?: string[], '...': string }
    >
  >,
  Expect<Equal<DynamicRoute<'/[slug]/[[...foo]]/[...bar]'>, never>>,
  Expect<Equal<DynamicRoute<'/[[...foo]]/[slug]/[...bar]'>, never>>,
  Expect<Equal<DynamicRoute<'/[[...foo]]/[...bar]/static'>, never>>,
  Expect<
    Equal<
      DynamicRoute<'[[...foo]]/stub/[...bar]'>,
      { foo?: string[], bar: string[] }
    >
  >,
  Expect<
    Equal<
      DynamicRoute<'[first]/[[...foo]]/stub/[...bar]/[last]'>,
      { first: string, foo?: string[], bar: string[], last: string }
    >
  >,
]
