import assert from "node:assert/strict";
import { test } from "node:test";
import { promisify, tuple } from "typescript-type-functions/runtime";

test("preserves positional arguments and returns callback data", async () => {
  const load = promisify((id, retry, done) => done(null, { id, retry }));
  assert.deepEqual(await load("ada", 2), { id: "ada", retry: 2 });
});

test("supports a callback that completes asynchronously", async () => {
  const load = promisify((id, done) => setImmediate(() => done(null, id)));
  assert.equal(await load(3), 3);
});

test("rejects with the original callback error", async () => {
  const error = new Error("not found");
  const load = promisify((done) => done(error));
  await assert.rejects(load(), (actual) => actual === error);
});

test("converts a synchronous throw into a rejected promise", async () => {
  const error = new Error("synchronous failure");
  const load = promisify(() => { throw error; });
  await assert.rejects(load(), (actual) => actual === error);
});

test("keeps the caller's this receiver", async () => {
  const service = {
    prefix: "user-",
    load: promisify(function (id, done) { done(null, `${this.prefix}${id}`); }),
  };
  assert.equal(await service.load(42), "user-42");
  assert.equal(await service.load.call({ prefix: "other-" }, 7), "other-7");
});

test("assimilates thenables to match Awaited in the return type", async () => {
  const load = promisify((done) => done(null, { then(resolve) { resolve(42); } }));
  assert.equal(await load(), 42);
});

test("supports callbacks without a success value", async () => {
  const finish = promisify((done) => done(null));
  assert.equal(await finish(), undefined);
});

test("undefined also indicates success", async () => {
  const load = promisify((done) => done(undefined, 0));
  assert.equal(await load(), 0);
});

test("only nullish errors indicate success, even for falsy error values", async () => {
  const load = promisify((done) => done(false, "ignored"));
  const result = await load().then(() => "unexpected success", (error) => error);
  assert.equal(result, false);
});

test("only the first callback settlement takes effect", async () => {
  const load = promisify((done) => { done(null, "first"); done(new Error("late")); });
  assert.equal(await load(), "first");
});

test("tuple preserves values and references without freezing", () => {
  const reference = { count: 3 };
  const result = tuple("read", reference);
  assert.deepEqual(result, ["read", { count: 3 }]);
  assert.equal(result[1], reference);
  assert.equal(Object.isFrozen(result), false);
});
