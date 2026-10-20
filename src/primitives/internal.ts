// Helpers shared between modules. index.ts does not re-export this file.

/** Changed tuples retain the input's readonly modifier. */
export type PreserveReadonly<Source extends readonly unknown[], Result extends unknown[]> =
  Source extends unknown[] ? Result : Readonly<Result>;
