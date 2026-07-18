const assert = require("assert");

function normalizeMongoUri(uri) {
  return String(uri || "").trim().replace(/\/$/, "");
}

function getTestDatabaseUri() {
  const testUri = normalizeMongoUri(process.env.MONGODB_TEST_URI);
  const appUri = normalizeMongoUri(process.env.MONGODB_URI);
  assert.ok(testUri, "MONGODB_TEST_URI is required for integration tests");
  assert.notStrictEqual(
    testUri,
    appUri,
    "MONGODB_TEST_URI must not be the same as MONGODB_URI"
  );
  return testUri;
}

module.exports = { getTestDatabaseUri };
