import type {
  Asyncify, Curry, Flip, PartialApply, Promisify, ResolvedReturn, WithReturn,
} from "../src/index.js";
import { promisify, tuple } from "../src/runtime.js";
import type { Expect, Same } from "./assert.js";

type User = { readonly id: string; name: string };
type Load = (id: string, retries: number, done: (error: Error | null, user: User) => void) => void;
type Service = { prefix: string };
type Method = (this: Service, id: number, done: (error: Error | null, value: string) => void) => void;
type Options = { verbose: boolean };

export type FunctionTypeCases = [
  Expect<Same<ResolvedReturn<(id: string) => PromiseLike<Promise<User>>>, User>>,
  Expect<Same<ResolvedReturn<() => User | Promise<User>>, User>>,
  Expect<Same<WithReturn<(id: string, limit?: number) => User, boolean>, (id: string, limit?: number) => boolean>>,
  Expect<Same<Asyncify<(id: string) => Promise<User>>, (id: string) => Promise<User>>>,
  Expect<Same<Asyncify<(this: Service, ...ids: number[]) => string>, (this: Service, ...ids: number[]) => Promise<string>>>,
  Expect<Same<Curry<(a: string, b: number, c: boolean) => Date>, (a: string) => (b: number) => (c: boolean) => Date>>,
  Expect<Same<Curry<() => number>, () => number>>,
  Expect<Same<Curry<(a: string) => number>, (a: string) => number>>,
  Expect<Same<Curry<(this: Service, a: string, b: number) => boolean>, (this: Service, a: string) => (b: number) => boolean>>,
  Expect<Same<Curry<(a?: string) => number>, never>>,
  Expect<Same<Curry<(...args: number[]) => number>, never>>,
  Expect<Same<PartialApply<(a: string, b: number) => boolean, readonly ["fixed"]>, (b: number) => boolean>>,
  Expect<Same<PartialApply<(this: Service, a: string, b: number) => boolean, ["fixed"]>, (this: Service, b: number) => boolean>>,
  Expect<Same<PartialApply<(a: string) => number, [1]>, never>>,
  Expect<Same<PartialApply<(a: string) => number, ["a", 1]>, never>>,
  Expect<Same<PartialApply<(a: string) => number, []>, (a: string) => number>>,
  Expect<Same<PartialApply<(a: string) => number, ["a"]>, () => number>>,
  // Optional and rest parameters after the bound prefix are kept.
  Expect<Same<PartialApply<(id: string, options?: Options) => number, ["x"]>, (options?: Options) => number>>,
  Expect<Same<PartialApply<(separator: string, ...parts: string[]) => string, ["/"]>, (...parts: string[]) => string>>,
  Expect<Same<PartialApply<(a?: string) => number, []>, (a?: string) => number>>,
  Expect<Same<PartialApply<(a?: string) => number, ["x"]>, never>>,
  Expect<Same<PartialApply<(...parts: string[]) => string, ["a"]>, never>>,
  Expect<Same<PartialApply<(a: string) => number, string[]>, never>>,
  Expect<Same<Flip<(a: string, b: number) => boolean>, (b: number, a: string) => boolean>>,
  Expect<Same<Flip<(a: string) => boolean>, never>>,
  Expect<Same<Promisify<Load>, (id: string, retries: number) => Promise<User>>>,
  Expect<Same<Promisify<Method>, (this: Service, id: number) => Promise<string>>>,
  Expect<Same<Promisify<(done: (error: Error | null) => void) => void>, () => Promise<void>>>,
  Expect<Same<Promisify<(done: (error?: Error | null) => void) => void>, () => Promise<void>>>,
  Expect<Same<Promisify<(done: (error?: Error) => void) => void>, () => Promise<void>>>,
  Expect<Same<Promisify<(done: (error: Error | undefined, value: 1) => void) => void>, () => Promise<1>>>,
  Expect<Same<Promisify<(done: (error: unknown, value: 1) => void) => void>, () => Promise<1>>>,
  Expect<Same<Promisify<(done: (error: Error | null, value?: string) => void) => void>, () => Promise<string | undefined>>>,
  Expect<Same<Promisify<(done: (error: Error | null, value: PromiseLike<User>) => void) => void>, () => Promise<User>>>,
  // A first parameter that cannot be null/undefined is a value, not an error.
  Expect<Same<Promisify<(done: (value: number) => void) => void>, never>>,
  Expect<Same<Promisify<(done: (error: Error, value: string) => void) => void>, never>>,
  Expect<Same<Promisify<(id: string, done?: (error: Error | null, value: string) => void) => void>, never>>,
  Expect<Same<Promisify<(done: (error: Error | null, a: string, b: number) => void) => void>, never>>,
  Expect<Same<Promisify<(done: () => void) => void>, never>>,
  Expect<Same<Promisify<(value: string) => number>, never>>,
];

declare function load(id: string, retries: number, done: (error: Error | null, user: User) => void): void;
const loadAsync = promisify(load);
const pendingUser = loadAsync("ada", 2);
export type Inference = Expect<Same<typeof pendingUser, Promise<User>>>;

// @ts-expect-error Original argument types must survive the wrapper.
loadAsync(42, 2);
// @ts-expect-error Original required arguments must survive the wrapper.
loadAsync("ada");
// @ts-expect-error The callback has been removed from the transformed signature.
loadAsync("ada", 2, () => {});
// @ts-expect-error Unsupported signatures must fail at the runtime adapter boundary.
promisify((value: string): number => value.length);
// @ts-expect-error Multiple success values are unsupported by this adapter.
promisify((done: (error: Error | null, a: string, b: number) => void): void => done(null, "x", 1));
// @ts-expect-error A success-only callback would reject with its value at runtime.
promisify((done: (value: number) => void): void => done(42));

// The compile error names the requirement instead of an opaque never.
type Unsupported = (value: string) => number;
export type RequirementShown = Expect<Same<
  Parameters<typeof promisify<Unsupported>>[0] extends { readonly "promisify needs": string } ? true : false,
  true
>>;
export type SupportedHasNoRequirement = Expect<Same<Parameters<typeof promisify<Load>>[0], Load>>;

declare const method: Method;
const asyncMethod = promisify(method);
const boundResult = asyncMethod.call({ prefix: "user-" }, 3);
export type ReceiverInference = Expect<Same<typeof boundResult, Promise<string>>>;
// @ts-expect-error An explicit receiver is still required.
asyncMethod(3);

declare const curried: Curry<(name: string, age: number) => User>;
const user = curried("Ada")(37);
export type CurryInference = Expect<Same<typeof user, User>>;
// @ts-expect-error Currying must preserve the type of the second argument.
curried("Ada")("37");

const literals = tuple("read", 3, { enabled: true });
export type ConstInference = Expect<Same<typeof literals, readonly ["read", 3, { readonly enabled: true }]>>;

// Standard utility-type limitations are intentional and documented.
interface Overloaded {
  (id: string, done: (error: Error | null, value: string) => void): void;
  (id: number, done: (error: Error | null, value: number) => void): void;
}
export type OverloadCase = Expect<Same<Promisify<Overloaded>, (id: number) => Promise<number>>>;
