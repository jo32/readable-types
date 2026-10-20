# Type programming, read as ordinary programming

TypeScript's type system is a small programming language of its own. This guide teaches it the way you would learn any new language: values first, then functions, branches, loops and data structures. Every TypeScript example compiles under TypeScript 7.0 in strict mode.

## The problem

Most Node developers have written this function at some point:

```js
function promisify(fn) {
  return (...args) =>
    new Promise((resolve, reject) => {
      fn(...args, (error, value) => (error ? reject(error) : resolve(value)));
    });
}
```

At runtime it works. In TypeScript, written like this, it throws away everything the compiler knew about `fn`: the promisified function accepts anything, and awaiting it gives you nothing useful. To keep that information we need to answer two questions from the type of `fn` alone:

1. Which arguments may the promisified function be called with?
2. What does awaiting its result produce?

Answering questions like these is what type programming is for: writing programs whose inputs and outputs are types, run by the compiler. The answer to this one is at the end of the guide.

## The model: it is a programming language

A type-level program takes types as input and produces a type, and the compiler runs it. Here is the whole map; the rest of the guide walks through it.

| In ordinary code | At the type level |
| --- | --- |
| a value | a type: `string`, `"ada"`, `{ id: number }` |
| a variable | `type Name = ...` |
| a function | a generic type alias, `type F<T> = ...` |
| a parameter's type | a constraint, `T extends string` |
| a default argument | a default, `T = never` |
| `if` / `? :` | a conditional type, `A extends B ? X : Y` |
| destructuring | `infer` |
| property access | indexed access: `T["key"]`, `T[number]`, `T["length"]` |
| `for...in` over an object | a mapped type, `{ [K in keyof T]: ... }` |
| a loop over a list | recursion over a tuple |
| an array | a tuple |
| a set | a union |
| a record | an object type |
| arithmetic | the lengths of tuples |

There are no statements other than declarations, and no mutation. Everything is an expression, which makes type-level TypeScript a small, purely functional language.

## Values

The basic types are the ones you already know: `boolean`, `number`, `string`, `bigint`, `symbol`, `null` and `undefined`, plus TypeScript's own `any`, `unknown`, `never`, `void`, tuples and enums. For type programming the most important values are **literal types**. `"ada"`, `42` and `true` are types with exactly one value each, and most type-level computation works on them.

```ts
type User = {
  id: number;
  name: string;
  role: "admin" | "member"; // a union of two literals
  active: true;             // a literal used as a constant
};
```

## Functions

A generic type alias is a function. The angle brackets are its parameter list, the right-hand side is its body, and writing `F<X>` calls it.

```ts
type WithTimestamps<T> = T & { createdAt: number; updatedAt: number };

type Post = { title: string };
type StoredPost = WithTimestamps<Post>;
```

A constraint plays the role of a parameter type. Here `K` may only be a key of `T`:

```ts
type Simplify<T> = { [K in keyof T]: T[K] };
type SetRequired<T, K extends keyof T> = Simplify<Omit<T, K> & Required<Pick<T, K>>>;

type App = {
  _id?: string;
  appId: string;
  name: string;
  ownerList: string[];
  createdAt?: number;
};

// An update must name the record it changes; every other field is optional.
type AppUpdate = SetRequired<Partial<App>, "_id">;
// => { appId?: string; name?: string; ownerList?: string[]; createdAt?: number; _id: string }
```

Once you see aliases as functions you start collecting them, and that is how libraries of type utilities (this repository included) come about. `Simplify` only flattens the intersection so that the editor shows one object instead of `Omit<...> & Required<...>`.

### Three limits, and how far they still apply

**Recursion.** Recursive conditional types arrived in TypeScript 4.1, and since 4.5 tail-recursive ones may run for about a thousand steps instead of about fifty. What remains is a budget, not a ban.

**A function cannot be an argument.** TypeScript has no higher-kinded types, so `type MapItems<T, F> = { [K in keyof T]: F<T[K]> }` is a syntax error. It can, however, be *encoded*. Describe the function as an interface whose output reads its input through `this`, and "call" it by intersecting in a concrete input:

```ts
interface TypeFn {
  input: unknown;
  output: unknown;
}
type Apply<F extends TypeFn, X> = (F & { input: X })["output"];

interface ToArray extends TypeFn {
  output: this["input"][];
}

type MapItems<T extends readonly unknown[], F extends TypeFn> = { [K in keyof T]: Apply<F, T[K]> };

type Lists = MapItems<[1, "a"], ToArray>; // => [1[], "a"[]]
```

This repository's `TypeFn`, `Call`, `Apply`, `Pipe` and `Compose` are a fuller version of exactly this trick.

**Nothing can be changed.** A type can read an outer alias but never assign to it. That is the nature of a functional language: state is threaded through parameters instead. An accumulator parameter with a default is the type-level `let`:

```ts
type Reverse<T extends readonly unknown[], Acc extends unknown[] = []> =
  T extends readonly [infer First, ...infer Rest] ? Reverse<Rest, [First, ...Acc]> : Acc;

type Backwards = Reverse<[1, 2, 3]>; // => [3, 2, 1]
```

Accumulating like this also keeps the recursive call in tail position, which is what lets it run for a thousand steps.

## Branches: conditional types

`A extends B ? X : Y` is the type-level ternary: if `A` is assignable to `B`, the result is `X`, otherwise `Y`.

```ts
type IsString<T> = T extends string ? true : false;

type Yes = IsString<"ada">; // => true
type No = IsString<42>;     // => false
```

One rule surprises everyone once. When the checked type is a bare type parameter and you pass a union, the conditional runs once per member and the results are joined again. Wrapping both sides in a one-element tuple turns that off:

```ts
type EachToList<T> = T extends unknown ? T[] : never;
type WholeToList<T> = [T] extends [unknown] ? T[] : never;

type Each = EachToList<string | number>;   // => string[] | number[]
type Whole = WholeToList<string | number>; // => (string | number)[]
```

A classic exercise is a `ReturnType` that also unwraps promises. Today that is a combination of two built-ins, and `Awaited` also handles nested promises and other thenables:

```ts
async function greet(name: string) {
  return `hello, ${name}`;
}

type Greeting = Awaited<ReturnType<typeof greet>>; // => string
```

## Destructuring: `infer`

Inside the condition of a conditional type, `infer X` declares a variable that the compiler fills in by matching. It is how you take a type apart:

```ts
type SecondParameter<F> = F extends (first: any, second: infer Second, ...rest: any[]) => any ? Second : never;

declare function connect(host: string, port: number): void;

type Port = SecondParameter<typeof connect>; // => number
```

For the common cases there is shorter syntax, the type-level version of `a.b` and `a[0]`:

```ts
type Point = { x: number; label: string };
type Row = [string, number, boolean];

type Label = Point["label"]; // => string
type First = Row[0];         // => string
type Cell = Row[number];     // => string | number | boolean
type Width = Row["length"];  // => 3
type LastOf<T extends readonly unknown[]> = T extends readonly [...unknown[], infer L] ? L : never;
type End = LastOf<Row>;      // => boolean
```

## Loops

Over the fields of an object, the loop is a **mapped type**. It can also change modifiers (`?`, `readonly`) and rename keys with `as`:

```ts
type Getters<T> = { [K in keyof T & string as `get${Capitalize<K>}`]: () => T[K] };

type UserGetters = Getters<{ name: string; age: number }>;
// => { getName: () => string; getAge: () => number }
```

Mapped types work on tuples as well, so they are also the type-level `Array.prototype.map` (that is what `MapItems` above relies on). Anything that needs the items in order, one at a time, is **recursion**: look at the first item, handle it, recurse on the rest.

It is tempting to read `T[number] extends ... ? X : Y` as a type-level `reduce`. It is not one: `T[number]` is the union of all the items, so that expression asks a single question about the whole union. A real reduce carries an accumulator from one item to the next. Here is filtering written that way:

```ts
type Filter<T extends readonly unknown[], Keep, Acc extends unknown[] = []> =
  T extends readonly [infer First, ...infer Rest]
    ? Filter<Rest, Keep, [First] extends [Keep] ? [...Acc, First] : Acc>
    : Acc;

type Numbers = Filter<[1, "a", 2, false], number>; // => [1, 2]
```

## Data structures

### Sets are unions

A union is a set of types, and the set operations are short:

```ts
type Primary = "red" | "green" | "blue";
type Warm = "red" | "orange" | "yellow";

type Every = Primary | Warm;                                    // union
type Shared = Extract<Primary, Warm>;                           // => "red"
type OnlyPrimary = Exclude<Primary, Warm>;                      // => "green" | "blue"
type OnlyOne = Exclude<Primary, Warm> | Exclude<Warm, Primary>; // => "green" | "blue" | "orange" | "yellow"
type HasRed = "red" extends Primary ? true : false;             // => true
```

Turning a union into an intersection uses the fact that function parameters are checked in the opposite direction: inferring one parameter type from a union of functions forces the compiler to find a type that fits all of them.

```ts
type UnionToIntersection<U> =
  (U extends unknown ? (value: U) => void : never) extends (value: infer I) => void ? I : never;

type Both = UnionToIntersection<{ a: string } | { b: number }>; // => { a: string } & { b: number }
```

A well-known trick goes one step further and turns a union into a tuple, to get its members in order and its size. Don't build on it. It works by letting the compiler pick the last signature of an overloaded function, and the order of a union's members is an implementation detail that is free to change between compiler versions. While on the subject: an intersection of call signatures such as `((x: any) => true) & ((x: any) => false)` is not an impossible type that "should be `never`". It is an overloaded function type, and it has values: any function that never returns, such as one that always throws, satisfies both signatures.

### Records are object types

`A & B` is often read as `Object.assign`. The two differ as soon as a property appears on both sides: an intersection has to satisfy both declarations, so conflicting types collapse to `never` instead of the right-hand one winning. A merge removes the overridden keys first:

```ts
type Base = { id: number; name: string };
type Patch = { id: string };

type Clash = (Base & Patch)["id"]; // => never

type Merge<L, R> = Omit<L, keyof R> & R;
type Merged = Merge<Base, Patch>["id"]; // => string
```

Filtering an object by the type of its values is a mapped type that maps unwanted keys to `never`, which drops them:

```ts
type PickByValue<T, V> = { [K in keyof T as T[K] extends V ? K : never]: T[K] };

type NumericFields = PickByValue<{ id: number; name: string; age: number }, number>; // => { id: number; age: number }
```

### Lists are tuples

Variadic tuple types make the list operations one-liners:

```ts
type Push<T extends readonly unknown[], V> = [...T, V];
type Unshift<T extends readonly unknown[], V> = [V, ...T];
type Concat<A extends readonly unknown[], B extends readonly unknown[]> = [...A, ...B];
type Pop<T extends readonly unknown[]> = T extends readonly [...infer Init, unknown] ? Init : [];
type Shift<T extends readonly unknown[]> = T extends readonly [unknown, ...infer Rest] ? Rest : [];

type Pushed = Push<[1, 2], 3>;        // => [1, 2, 3]
type Joined = Concat<[1], ["a", "b"]>; // => [1, "a", "b"]
type Popped = Pop<[1, 2, 3]>;         // => [1, 2]
type Shifted = Shift<[1, 2, 3]>;      // => [2, 3]
```

## Arithmetic

There are no numeric operators at the type level, but a tuple's `length` is a number literal. So a number `N` can be represented by a tuple of `N` items, and arithmetic becomes tuple surgery:

```ts
type BuildTuple<N extends number, T extends unknown[] = []> =
  T["length"] extends N ? T : BuildTuple<N, [...T, unknown]>;

type Add<A extends number, B extends number> = [...BuildTuple<A>, ...BuildTuple<B>]["length"];
type Subtract<A extends number, B extends number> =
  BuildTuple<A> extends [...BuildTuple<B>, ...infer Rest] ? Rest["length"] : never;

type Seven = Add<3, 4>;           // => 7
type Four = Subtract<7, 3>;       // => 4
type NoAnswer = Subtract<3, 7>;   // => never
```

A negative result is `never` here instead of a silently wrong `0`. Multiplication is repeated addition and division is repeated subtraction. All of it costs compiler work proportional to the numbers involved, which is why this library caps its arithmetic at 0 to 128. Larger numbers are better handled as digit strings, adding one column at a time (see `Sum` and `Multiply` in [`tests/challenges/`](../tests/challenges/)).

Comparing types for exact equality needs a trick of its own. Assignability is too loose (`any` is assignable both ways to everything), so the usual test compares two generic functions, which the compiler can only relate if the types are identical:

```ts
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;

type Same = Equal<{ a: 1 }, { a: 1 }>; // => true
type NotSame = Equal<any, unknown>;    // => false
```

## Odds and ends

**`interface`.** Apart from declaration merging, everything an interface does can be written with `type`. Interfaces do have one feature that matters here, polymorphic `this`, which is what makes the `TypeFn` encoding above possible.

**Built-in utility types.** `Partial`, `Required`, `Readonly`, `Pick`, `Omit`, `Record`, `Exclude`, `Extract`, `Parameters`, `ReturnType`, `Awaited` and friends are type-level functions shipped with the compiler. Read their definitions in `lib.es5.d.ts`; they are short, and they are the best examples of the style.

## Exercises

### `promisify`, answered

With the pieces above, the opening problem takes a few lines. The parameters are all but the last; the result is the second parameter of the callback:

```ts
type Init<T extends readonly unknown[]> = T extends readonly [...infer I, unknown] ? I : never;
type Last<T extends readonly unknown[]> = T extends readonly [...unknown[], infer L] ? L : never;
type CallbackValue<C> =
  C extends (...args: infer A) => void ? (A extends [unknown, infer V, ...unknown[]] ? V : void) : never;

type Promisified<F extends (...args: any[]) => void> =
  (...args: Init<Parameters<F>>) => Promise<CallbackValue<Last<Parameters<F>>>>;

declare function promisify<F extends (...args: any[]) => void>(fn: F): Promisified<F>;

declare function readConfig(path: string, done: (error: Error | null, text: string) => void): void;

const load = promisify(readConfig);
type Loaded = Awaited<ReturnType<typeof load>>; // => string

async function main() {
  const text = await load("./config.json"); // text: string
  // @ts-expect-error: the path must be a string
  await load(42);
  return text;
}
```

Variadic tuples are what make this short: there is no need for one overload per number of parameters. Two caveats remain. `Parameters` only sees the *last* overload of an overloaded function such as `fs.readFile`. And a callback whose first parameter cannot be `null` would make every call reject at runtime. This repository's `Promisify` type and `promisify` function handle both and document their limits.

### type-challenges warm-ups

Four medium and hard [type-challenges](https://github.com/type-challenges/type-challenges), each an application of one section above.

**Return type**: `infer` on a function type.

```ts
type MyReturnType<F> = F extends (...args: any[]) => infer R ? R : never;

const pick = (flag: boolean) => (flag ? 1 : 2);
type Picked = MyReturnType<typeof pick>; // => 1 | 2
```

**Readonly 2**: make only some keys readonly. The obvious answer, `T & { readonly [P in K]: T[P] }`, does not work: the intersection still contains the writable declaration, and assignment is allowed. Remove the keys first, then add them back as readonly:

```ts
type MyReadonly2<T, K extends keyof T = keyof T> = Omit<T, K> & Readonly<Pick<T, K>>;

interface Todo {
  title: string;
  description: string;
  completed: boolean;
}

const todo: MyReadonly2<Todo, "title" | "description"> = { title: "Hey", description: "foobar", completed: false };
// @ts-expect-error: title is readonly
todo.title = "Hello";
todo.completed = true; // still writable
```

**Type lookup**: pick a member of a discriminated union. `Extract` already does it.

```ts
interface Cat {
  type: "cat";
  breeds: "Abyssinian" | "Shorthair";
}
interface Dog {
  type: "dog";
  breeds: "Hound" | "Boxer";
  color: "brown" | "white";
}

type LookUp<U, T> = Extract<U, { type: T }>;

type MyDog = LookUp<Cat | Dog, "dog">; // => Dog
```

**Get required**: keep the required keys. A key is optional exactly when `{}` is assignable to an object holding only that key.

```ts
type GetRequired<T> = { [K in keyof T as {} extends Pick<T, K> ? never : K]: T[K] };

type OnlyRequired = GetRequired<{ foo: number; bar?: string }>; // => { foo: number }
```

The extreme-level challenges are solved, on top of this library, in [`tests/challenges/`](../tests/challenges/).

## Where to go from here

Several libraries collect well-named, general type utilities to sit next to the built-ins, such as [utility-types](https://github.com/piotrwitek/utility-types) and [type-fest](https://github.com/sindresorhus/type-fest). This repository is one more take on the idea, with an emphasis on names a reader can understand and a pipeable form of every operation.

Type programming feels like a puzzle partly because it is a language assembled from features that were designed for describing types, not for computing them, and as of TypeScript 7.0 it has no friendlier syntax for computation. The practical answer is the same as for any small language with an awkward syntax: build a vocabulary of small, well-named functions, and compose them. For how far that vocabulary can reach in principle, see [Every computable function, written in types](turing-completeness.md).

## References

1. type-challenges: https://github.com/type-challenges/type-challenges
2. TypeScript Handbook, Creating Types from Types: https://www.typescriptlang.org/docs/handbook/2/types-from-types.html
3. utility-types: https://github.com/piotrwitek/utility-types
4. type-fest: https://github.com/sindresorhus/type-fest
