import type {
  Access, Created, Identified, NativeCreated, NativeHasIdentity, NativeIdentified,
  NativeNickname, NativeRemaining, NativeUpdateUser, NativeUserKeys, NativeUserValues,
  Nickname, NumericChecks, Numbers, Remaining, UpdateUser, UserCache, UserKeys, UserValues,
} from "../examples/readable.js";
import type { Get, Intersect, IsAssignable, SelectMembers, Simplify } from "../src/index.js";
import type { Expect, Same } from "./assert.js";

// Check whole usage examples, including optional/readonly fields and native Map coexistence.
export type ReadabilityCases = [
  Expect<Same<UserKeys, NativeUserKeys>>,
  Expect<Same<UserValues, NativeUserValues>>,
  Expect<Same<Nickname, NativeNickname>>,
  Expect<Same<Nickname, string | undefined>>,
  Expect<Same<NativeHasIdentity, true>>,
  Expect<Same<Access, "identified">>,
  Expect<Same<UpdateUser, Simplify<NativeUpdateUser>>>,
  Expect<Same<Created, NativeCreated>>,
  Expect<Same<Remaining, NativeRemaining>>,
  Expect<Same<Identified, NativeIdentified>>,
  Expect<Same<NumericChecks, readonly [true, false, true]>>,
  Expect<Same<Numbers, readonly [1, 3]>>,
  Expect<Same<UserCache["size"], number>>,
  Expect<Same<IsAssignable<1 | "two", number>, false>>,
  Expect<Same<IsAssignable<any, number>, boolean>>,
  Expect<Same<IsAssignable<never, number>, true>>,
  // Selecting members and intersecting constraints must not be confused.
  Expect<Same<SelectMembers<{ id: string }, { active: boolean }>, never>>,
  Expect<Same<Simplify<Intersect<{ id: string }, { active: boolean }>>, { id: string; active: boolean }>>,
  Expect<Same<SelectMembers<"read", string>, "read">>,
  Expect<Same<SelectMembers<string, "read">, never>>,
];

// @ts-expect-error A readable property accessor must still reject typos.
export type MissingProperty = Get<Created, "uesr">;

declare let update: UpdateUser;
// @ts-expect-error Making a field required must retain its readonly modifier.
update.id = "changed";
