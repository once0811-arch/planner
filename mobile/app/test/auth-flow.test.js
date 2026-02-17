const test = require("node:test");
const assert = require("node:assert/strict");

const {
  createSignedOutSession,
  signInWithProvider,
  signOut
} = require("../src/auth/session.ts");
const { resolveRootFlow } = require("../src/navigation/routePolicy.ts");

test("session starts signed out", () => {
  const session = createSignedOutSession();
  assert.equal(session.isAuthenticated, false);
  assert.equal(session.provider, null);
});

test("signInWithProvider authenticates with selected oauth provider", () => {
  const signedIn = signInWithProvider(createSignedOutSession(), "google");
  assert.equal(signedIn.isAuthenticated, true);
  assert.equal(signedIn.provider, "google");
});

test("signOut always returns signed out session", () => {
  const signedOut = signOut({
    isAuthenticated: true,
    provider: "kakao"
  });
  assert.deepEqual(signedOut, {
    isAuthenticated: false,
    provider: null
  });
});

test("root flow resolves auth vs main by session state", () => {
  assert.equal(resolveRootFlow(createSignedOutSession()), "auth");
  assert.equal(resolveRootFlow({ isAuthenticated: true, provider: "google" }), "main");
});
