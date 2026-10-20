# Every computable function, written in types

TypeScript's type system is Turing complete. This document shows why, by building every computable function in it, and is careful about what that claim does and does not mean. All the code here runs or compiles as shown.

## The plan

To show that a language can compute anything computable, you don't need to build a Turing machine in it. It is enough to show that the language can express the **partial recursive functions** (also called μ-recursive functions), because that class of functions is exactly as powerful as Turing machines ([nLab](https://ncatlab.org/nlab/show/partial+recursive+function) has the precise statement).

The class is small enough to implement in an afternoon: three basic functions, and three ways of making new functions from old ones. If a language has all six, it has everything. We will build them twice, once in JavaScript and once in TypeScript's type system, and derive arithmetic from them up to division.

## The definitions

A *function* here takes one or more natural numbers and returns a natural number: $f: \mathbb{N}^n \to \mathbb{N}$. It is *total* if it returns a value for every input and *partial* ($f: \mathbb{N}^n \rightharpoonup \mathbb{N}$) if for some inputs it never does.

### Three basic functions

- **Zero.** $Z^n(x_1, \dots, x_n) = 0$. Ignore the input, answer 0. In machine terms: clear a register.
- **Successor.** $S(x) = x + 1$. In machine terms: increment a register.
- **Projection.** $P^n_i(x_1, \dots, x_n) = x_i$. Return one of the arguments. In machine terms: read a register.

### Three ways to build functions

- **Composition.** Given $h$ of $m$ arguments and $g_1, \dots, g_m$ of $n$ arguments each,
  $$f(\vec{x}) = h(g_1(\vec{x}), \dots, g_m(\vec{x}))$$
  written $f = h \circ [g_1, \dots, g_m]$. In programming terms: calling functions with the results of other calls.

- **Primitive recursion.** Given $g$ of $n$ arguments and $h$ of $n + 2$, the function $f = \rho(g, h)$ of $n + 1$ arguments is
  $$f(\vec{x}, 0) = g(\vec{x}) \qquad f(\vec{x}, y + 1) = h(\vec{x}, y, f(\vec{x}, y))$$
  In programming terms: a `for` loop whose number of iterations, $y$, is known before it starts. $h$ receives the loop counter and the value from the previous iteration.

- **Minimization.** Given $f$ of $n + 1$ arguments, $\mu f$ of $n$ arguments returns the smallest $z$ with $f(\vec{x}, z) = 0$, and is undefined if there is none. In programming terms: a `while` loop that may never end.

Functions built from the basic ones with composition and primitive recursion are the *primitive recursive* functions. They are all total, because every loop has a bound. Adding minimization gives the *partial recursive* functions: the unbounded loop is where both the extra power and the possibility of never answering come from. A theorem of Kleene's says one minimization is always enough: every partial recursive function can be written as a primitive recursive function applied to the result of a single $\mu$.

## Deriving arithmetic

Each derivation below is a choice of $g$ and $h$ (or of the function to minimize). Note the arities: in $\rho(g, h)$, $g$ takes one argument fewer than $f$ and $h$ takes one more.

**Addition.** $add(x, 0) = x$ and $add(x, y + 1) = S(add(x, y))$. So $g$ returns its only argument and $h$ increments the previous result, which is its third argument:
$$add = \rho(P^1_1,\ S \circ [P^3_3])$$

**Predecessor** (with $pred(0) = 0$). $pred(0) = 0$ and $pred(y + 1) = y$. Here $\vec{x}$ is empty, so $g$ is the zero function of no arguments and $h(y, prev)$ returns $y$:
$$pred = \rho(Z^0,\ P^2_1)$$

**Truncated subtraction** ($x \mathbin{\dot-} y$, which is 0 when $y > x$). $sub(x, 0) = x$ and $sub(x, y + 1) = pred(sub(x, y))$:
$$sub = \rho(P^1_1,\ pred \circ [P^3_3])$$

**Zero test.** $isZero(0) = 1$ and $isZero(y + 1) = 0$. The base case is a constant 1, which is the successor of the zero function of no arguments:
$$isZero = \rho(S \circ [Z^0],\ Z^2)$$

**Less than or equal.** $x \le y$ exactly when $x \mathbin{\dot-} y = 0$:
$$leq = isZero \circ [sub]$$

**Multiplication.** $mul(x, 0) = 0$ and $mul(x, y + 1) = add(x, mul(x, y))$:
$$mul = \rho(Z^1,\ add \circ [P^3_1, P^3_3])$$

**Division** (rounded down). This is the first one that needs minimization. Let
$$f(a, b, q) = leq((q + 1) \cdot b,\ a) = leq \circ [mul \circ [S \circ [P^3_3], P^3_2],\ P^3_1]$$
which is 1 while $(q + 1) \cdot b \le a$ and 0 from the first $q$ where it exceeds $a$. That first $q$ is $\lfloor a / b \rfloor$, so
$$div = \mu f$$
For $b = 0$, $f$ is 1 for every $q$ and the search never ends: division by zero is precisely where $div$ is partial. Minimization is the only one of the six building blocks that can produce such a gap.

## In JavaScript

That JavaScript is Turing complete is no surprise, but writing the six building blocks out is the clearest way to check the derivations: each formula above becomes one line. Projections are zero-based in code, so $P^3_3$ is `proj(2)`, and the recursion variable is always the last argument, as in the formulas.

```js
// Basic functions
const zero = (..._args) => 0;
const succ = (n) => n + 1;
const proj = (i) => (...args) => args[i];

// Composition: f(...xs) = h(g1(...xs), ..., gm(...xs))
const compose = (h, ...gs) => (...xs) => h(...gs.map((g) => g(...xs)));

// Primitive recursion: a loop whose length y is known up front
const primitiveRecursion = (g, h) => (...args) => {
  const xs = args.slice(0, -1);
  const y = args.at(-1);
  let acc = g(...xs);
  for (let i = 0; i < y; i++) acc = h(...xs, i, acc);
  return acc;
};

// Minimization: the smallest z with f(...xs, z) === 0; loops forever if there is none
const minimize = (f) => (...xs) => {
  for (let z = 0; ; z++) if (f(...xs, z) === 0) return z;
};

const add = primitiveRecursion(proj(0), compose(succ, proj(2)));
const pred = primitiveRecursion(zero, proj(0));
const sub = primitiveRecursion(proj(0), compose(pred, proj(2)));
const isZero = primitiveRecursion(compose(succ, zero), zero);
const leq = compose(isZero, sub);
const mul = primitiveRecursion(zero, compose(add, proj(0), proj(2)));
const div = minimize(compose(leq, compose(mul, compose(succ, proj(2)), proj(1)), proj(0)));

console.log(add(3, 4));                       // 7
console.log(pred(0), pred(1), pred(5));       // 0 0 4
console.log(sub(3, 1), sub(3, 3), sub(3, 4)); // 2 0 0
console.log(isZero(0), isZero(3));            // 1 0
console.log(leq(3, 4), leq(4, 4), leq(5, 4)); // 1 1 0
console.log(mul(3, 4));                       // 12
console.log(div(9, 4), div(4, 4), div(3, 4)); // 2 1 0
// div(1, 0) never returns.
```

Primitive recursion is defined recursively, but a loop computes the same function and makes the point of the definition visible: primitive recursion *is* a bounded `for` loop, and minimization *is* an unbounded `while`.

## In TypeScript's type system

The obstacle in the type system is that a type-level function cannot take another function as an argument, and every combinator here needs to. The way around that is the encoding this repository is built on (see [`src/primitives/function.ts`](../src/primitives/function.ts) for the full version): describe a function as an interface whose `output` reads its arguments through `this`, and call it by intersecting in concrete arguments. Numbers are tuple lengths.

```ts
// Natural numbers are tuple lengths.
type Tuple<N extends number, T extends unknown[] = []> = T["length"] extends N ? T : Tuple<N, [...T, unknown]>;

// A function value: `output` reads `args` through `this`, and Call binds `args`.
// `args` is declared unknown so that binding it yields exactly the tuple passed in.
interface Fn {
  args: unknown;
  output: unknown;
}
type Args<F extends Fn> = Extract<F["args"], number[]>;
type Call<F extends Fn, A extends number[]> = Extract<(F & { args: A })["output"], number>;

// Basic functions
interface Zero extends Fn { output: 0 }
interface Succ extends Fn { output: [...Tuple<Args<this>[0]>, unknown]["length"] }
interface Proj<I extends number> extends Fn { output: Args<this>[I] }

// Composition
type CallEach<Gs extends Fn[], A extends number[]> = { [K in keyof Gs]: Call<Gs[K], A> };
interface Compose<H extends Fn, Gs extends Fn[]> extends Fn {
  output: Call<H, Extract<CallEach<Gs, Args<this>>, number[]>>;
}

// Primitive recursion: the same bounded loop, with the accumulator as a parameter
type Init<T extends number[]> = T extends [...infer I extends number[], number] ? I : [];
type Last<T extends number[]> = T extends [...number[], infer L extends number] ? L : 0;
type Iterate<G extends Fn, H extends Fn, Xs extends number[], Y extends number, I extends unknown[] = [], Acc extends number = Call<G, Xs>> =
  I["length"] extends Y ? Acc : Iterate<G, H, Xs, Y, [...I, unknown], Call<H, [...Xs, I["length"], Acc]>>;
interface PrimRec<G extends Fn, H extends Fn> extends Fn {
  output: Iterate<G, H, Init<Args<this>>, Last<Args<this>>>;
}

// Minimization: an unbounded search
type Search<F extends Fn, Xs extends number[], Z extends unknown[] = []> =
  Call<F, [...Xs, Z["length"]]> extends 0 ? Z["length"] : Search<F, Xs, [...Z, unknown]>;
interface Minimize<F extends Fn> extends Fn { output: Search<F, Args<this>> }

// The derivations, one line each, exactly as in the formulas
type Add = PrimRec<Proj<0>, Compose<Succ, [Proj<2>]>>;
type Pred = PrimRec<Zero, Proj<0>>;
type Sub = PrimRec<Proj<0>, Compose<Pred, [Proj<2>]>>;
type IsZero = PrimRec<Compose<Succ, [Zero]>, Zero>;
type Leq = Compose<IsZero, [Sub]>;
type Mul = PrimRec<Zero, Compose<Add, [Proj<0>, Proj<2>]>>;
type Div = Minimize<Compose<Leq, [Compose<Mul, [Compose<Succ, [Proj<2>]>, Proj<1>]>, Proj<0>]>>;

type Seven = Call<Add, [3, 4]>;          // => 7
type Four = Call<Pred, [5]>;             // => 4
type Two = Call<Sub, [3, 1]>;            // => 2
type Floor = Call<Sub, [3, 4]>;          // => 0
type ZeroIsZero = Call<IsZero, [0]>;     // => 1
type FiveIsAtMostFour = Call<Leq, [5, 4]>; // => 0
type Twelve = Call<Mul, [3, 4]>;         // => 12
type NineOverFour = Call<Div, [9, 4]>;   // => 2
type FourOverFour = Call<Div, [4, 4]>;   // => 1
```

Every derived function is now a single line built from the six blocks, with no function written out by hand, which is what the proof needs.

And division by zero behaves the way the theory says it must. The search has no answer, so the compiler keeps instantiating until it gives up:

```ts
// (Repeats the essentials of the previous block so that it stands alone.)
type Tuple<N extends number, T extends unknown[] = []> = T["length"] extends N ? T : Tuple<N, [...T, unknown]>;
interface Fn { args: unknown; output: unknown }
type Args<F extends Fn> = Extract<F["args"], number[]>;
type Call<F extends Fn, A extends number[]> = Extract<(F & { args: A })["output"], number>;
interface Proj<I extends number> extends Fn { output: Args<this>[I] }

// f(a, b, z) = b: zero exactly when b is zero, whatever z is
type Search<F extends Fn, Xs extends number[], Z extends unknown[] = []> =
  Call<F, [...Xs, Z["length"]]> extends 0 ? Z["length"] : Search<F, Xs, [...Z, unknown]>;
interface Minimize<F extends Fn> extends Fn { output: Search<F, Args<this>> }
type FirstZeroOfB = Minimize<Proj<1>>;

type Found = Call<FirstZeroOfB, [7, 0]>; // => 0
// @ts-expect-error: Type instantiation is excessively deep and possibly infinite.
type NeverFound = Call<FirstZeroOfB, [7, 3]>;
```

## How far does this proof go?

What the code shows is that TypeScript's type language can *express* every building block of the partial recursive functions, and therefore every computable function. What it cannot show is that the compiler will finish any particular computation. The checker gives up after a fixed amount of work: tail-recursive conditional types stop after about a thousand steps, and other limits cap the depth and total number of instantiations. So any single run of the compiler is a bounded computation, the same way any real computer is a finite machine running a Turing-complete language.

In practice that is the useful distinction. "Turing complete" says that no type-level algorithm is out of reach in principle. It says nothing about whether one is a good idea, and the compiler's budget is small. Every number in this encoding is a tuple of that length: computing 99 / 7 still type-checks in a fraction of a second, but numbers near a thousand already run into the limit on tail recursion. That is why this repository treats type-level arithmetic as a bounded tool (its numbers stop at 128) and does not set out to prove anything about unbounded computation.

## References

1. Partial recursive function, nLab: https://ncatlab.org/nlab/show/partial+recursive+function
2. TypeScript 4.5, tail-recursion elimination on conditional types: https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-5.html
