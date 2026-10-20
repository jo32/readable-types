import type { Apply, Arg, TypeFn } from "./primitives/function.js";
import type { IsNever } from "./primitives/logic.js";

/** Either A or B. */
export type Union<A, B> = A | B;

/** Satisfy both type constraints. This is the TypeScript intersection operator. */
export type Intersect<A, B> = A & B;

/**
 * Keep union members assignable to Match. This is directional, not A & B. To pick a
 * branch of a discriminated union: SelectMembers<Event, { kind: "created" }>.
 */
export type SelectMembers<U, Match> = Extract<U, Match>;

/** Remove union members assignable to Match. */
export type ExcludeMembers<U, Match> = Exclude<U, Match>;

/** A set-style name for removing matching union members. */
export type Difference<A, B> = ExcludeMembers<A, B>;
export type SymmetricDifference<A, B> = Exclude<A, B> | Exclude<B, A>;

/** Distributes intentionally. `never` is the empty union. */
export type MapUnion<U, Mapper extends TypeFn> = U extends unknown ? Apply<Mapper, U> : never;

export type UnionToIntersection<U> = IsNever<U> extends true ? never
  : (U extends unknown ? (value: U) => void : never) extends (value: infer I) => void ? I : never;

export interface MapUnionFn<Mapper extends TypeFn> extends TypeFn {
  readonly input: readonly [unknown];
  readonly output: MapUnion<Arg<this, 0>, Mapper>;
}

export interface SelectMembersFn<Match> extends TypeFn {
  readonly input: readonly [unknown];
  readonly output: SelectMembers<Arg<this, 0>, Match>;
}

export interface ExcludeMembersFn<Match> extends TypeFn {
  readonly input: readonly [unknown];
  readonly output: ExcludeMembers<Arg<this, 0>, Match>;
}
