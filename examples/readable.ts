import type {
  ElementOf, ExcludeMembers, FilterFn, Get, If, Intersect, IsAssignable, IsAssignableFn,
  Keys, MapItems, Pipe, SelectMembers, SetRequired, Union, Values,
} from "../src/index.js";

// A layer of readable vocabulary can wrap the official syntax. Both spellings are kept,
// so they are easy to understand and trace back.
type User = { readonly id: string; nickname?: string; active: boolean };
export type UserKeys = Keys<User>;               // "id" | "nickname" | "active"
export type NativeUserKeys = keyof User;
export type UserValues = Values<User>;           // string | boolean | undefined
export type NativeUserValues = User[keyof User];
export type Nickname = Get<User, "nickname">;    // string | undefined
export type NativeNickname = User["nickname"];
export type Action = ElementOf<readonly ["read", "write"]>; // "read" | "write"
export type NativeAction = (readonly ["read", "write"])[number];

// Expressed by domain: whether a condition holds, and which result to choose.
export type HasIdentity = IsAssignable<User, { id: string }>;
export type NativeHasIdentity = [User] extends [{ id: string }] ? true : false;
export type Access = If<HasIdentity, "identified", "anonymous">;

export type UpdateUser = SetRequired<Partial<User>, "id">;
export type NativeUpdateUser = Omit<Partial<User>, "id"> & Required<Pick<User, "id">>;

// Union member selection and intersection constraints are named separately.
export type Event = Union<
  { kind: "created"; user: User },
  { kind: "deleted"; id: string }
>;
export type Created = SelectMembers<Event, { kind: "created" }>;
export type NativeCreated = Extract<Event, { kind: "created" }>;
export type Remaining = ExcludeMembers<Event, { kind: "created" }>;
export type NativeRemaining = Exclude<Event, { kind: "created" }>;
export type Identified = Intersect<{ id: string }, { active: boolean }>;
export type NativeIdentified = { id: string } & { active: boolean };

// An operation has a direct form X<Input, ...> and a passable form XFn<...>.
export type NumericChecks = MapItems<readonly [1, "two", 3], IsAssignableFn<number>>;
// readonly [true, false, true]
export type Numbers = Pipe<readonly [1, "two", 3], [FilterFn<IsAssignableFn<number>>]>;
// readonly [1, 3]

// MapItems does not take over the native Map name, so both uses read clearly in the same file.
export type UserCache = Map<string, User>;
