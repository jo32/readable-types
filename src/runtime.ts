import type { Callable, Promisify } from "./function-types.js";

/** Preserve literals through a const type parameter. No runtime freezing is performed. */
export function tuple<const T extends readonly unknown[]>(...values: T): T {
  return values;
}

/**
 * Minimal error-first adapter: null/undefined mean success; any other error rejects.
 * Supports a single concrete signature, preserves this, and assimilates thenables.
 * This does not implement Node's custom util.promisify symbol or special overloads.
 */
export function promisify<F extends Callable>(
  // Inline, not an alias, so the compile error prints the requirement itself.
  fn: F & ([Promisify<F>] extends [never]
    ? { readonly "promisify needs": "a required last parameter (error: Error | null, value?) => void" }
    : unknown),
): Promisify<F> {
  const wrapped = function (this: unknown, ...args: unknown[]): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const callback = (error: unknown, value?: unknown): void => {
        if (error !== null && error !== undefined) {
          reject(error);
        } else {
          resolve(value);
        }
      };
      // Reflect.apply is the dynamic boundary; the exported signature is Promisify<F>.
      Reflect.apply(fn, this, [...args, callback]);
    });
  };
  return wrapped as Promisify<F>;
}
