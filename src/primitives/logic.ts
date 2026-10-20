/** JavaScript scalar values; distinct from the library's computational primitives. */
export type Primitive = string | number | bigint | boolean | symbol | null | undefined;

export type IsAny<T> = 0 extends 1 & T ? true : false;
export type IsNever<T> = [T] extends [never] ? true : false;
export type IsUnknown<T> = IsAny<T> extends true
  ? false
  : unknown extends T ? true : false;

/** Structural type equality, including distinctions such as any vs. unknown. */
export type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends
  (<T>() => T extends B ? 1 : 2)
    ? (<T>() => T extends B ? 1 : 2) extends
      (<T>() => T extends A ? 1 : 2) ? true : false
    : false;

/** Whole-type assignability. Unions are checked together; any yields boolean. */
export type IsAssignable<Source, Target> = IsAny<Source> extends true
  ? boolean
  : [Source] extends [Target] ? true : false;

export type If<Condition extends boolean, Then, Else> =
  Condition extends true ? Then : Else;
export type Not<T extends boolean> = T extends true ? false : true;
export type And<A extends boolean, B extends boolean> = A extends true ? B : false;
export type Or<A extends boolean, B extends boolean> = A extends true ? true : B;

// Distributes over T; each member is compared with the whole union.
type IsUnionCheck<T, Whole> = T extends Whole ? [Whole] extends [T] ? false : true : false;

export type IsUnion<T> = IsNever<T> extends true ? false : IsUnionCheck<T, T>;

/** Recursive folds require a known length and no optional/rest positions. */
export type IsFiniteTuple<T extends readonly unknown[]> = IsAny<T> extends true
  ? false
  : IsNever<T> extends true
    ? false
    : number extends T["length"]
      ? false
      : T extends Required<T> ? true : false;
