import assert from "node:assert/strict";
import { fetchBridgeActivity } from "../lib/bridge-activity-client.js";

const originalBaseUrl = process.env.THA_BRIDGE_BASE_URL;
const originalToken = process.env.THA_BRIDGE_TOKEN;

function restoreEnv(): void {
  if (originalBaseUrl === undefined) delete process.env.THA_BRIDGE_BASE_URL;
  else process.env.THA_BRIDGE_BASE_URL = originalBaseUrl;
  if (originalToken === undefined) delete process.env.THA_BRIDGE_TOKEN;
  else process.env.THA_BRIDGE_TOKEN = originalToken;
}

async function testSendsCredentialAsHeaderNotQueryString(): Promise<void> {
  process.env.THA_BRIDGE_BASE_URL = "https://bridge.example.com";
  process.env.THA_BRIDGE_TOKEN = "secret-token-value";

  let capturedUrl: string | URL | undefined;
  let capturedInit: RequestInit | undefined;

  const fetchImpl = (async (url: string | URL, init?: RequestInit) => {
    capturedUrl = url;
    capturedInit = init;
    return new Response(JSON.stringify({ items: [] }), { status: 200 });
  }) as typeof fetch;

  const result = await fetchBridgeActivity({ fetchImpl });

  assert.equal(result.ok, true, "request with valid config succeeds");
  assert.equal(String(capturedUrl).includes("secret-token-value"), false,
    "credential must not appear in the request URL");
  assert.equal(String(capturedUrl).includes("/v1/tha/activity"), true,
    "request targets the /v1/tha/activity endpoint");

  const headers = new Headers(capturedInit?.headers);
  assert.equal(headers.get("Authorization"), "Bearer secret-token-value",
    "credential is sent as an Authorization header");
}

async function testReturnsMockedProjectionUnchanged(): Promise<void> {
  process.env.THA_BRIDGE_BASE_URL = "https://bridge.example.com";
  process.env.THA_BRIDGE_TOKEN = "secret-token-value";

  const projection = {
    activity: [{ id: "evt-1", state: "QUEUED", detail: "unchanged-field" }],
    generatedAt: "2026-08-29T00:00:00.000Z",
  };

  const fetchImpl = (async () =>
    new Response(JSON.stringify(projection), { status: 200 })) as typeof fetch;

  const result = await fetchBridgeActivity({ fetchImpl });

  assert.equal(result.ok, true, "successful response is reported as ok");
  if (result.ok) {
    assert.deepEqual(result.data, projection,
      "the parsed JSON projection is returned unchanged (no renaming, no invented fields)");
  }
}

async function testFailureResponseProducesTypedError(): Promise<void> {
  process.env.THA_BRIDGE_BASE_URL = "https://bridge.example.com";
  process.env.THA_BRIDGE_TOKEN = "secret-token-value";

  const fetchImpl = (async () =>
    new Response("Unauthorized", { status: 401 })) as typeof fetch;

  const result = await fetchBridgeActivity({ fetchImpl });

  assert.equal(result.ok, false, "a non-ok HTTP response is a typed failure");
  if (!result.ok) {
    assert.equal(typeof result.error, "string", "failure carries a string error message");
    assert.equal("data" in result, false, "no fabricated data field on failure");
  }
}

async function testNetworkErrorProducesTypedError(): Promise<void> {
  process.env.THA_BRIDGE_BASE_URL = "https://bridge.example.com";
  process.env.THA_BRIDGE_TOKEN = "secret-token-value";

  const fetchImpl = (async () => {
    throw new Error("ECONNREFUSED");
  }) as typeof fetch;

  const result = await fetchBridgeActivity({ fetchImpl });

  assert.equal(result.ok, false, "a network failure is a typed failure, not a thrown exception");
  if (!result.ok) {
    assert.match(result.error, /ECONNREFUSED/, "underlying network error is surfaced in the message");
  }
}

async function testMissingCredentialProducesTypedError(): Promise<void> {
  process.env.THA_BRIDGE_BASE_URL = "https://bridge.example.com";
  delete process.env.THA_BRIDGE_TOKEN;

  let called = false;
  const fetchImpl = (async () => {
    called = true;
    return new Response("{}", { status: 200 });
  }) as typeof fetch;

  const result = await fetchBridgeActivity({ fetchImpl });

  assert.equal(called, false, "no request is made when the credential is not configured");
  assert.equal(result.ok, false, "missing credential is a typed failure");
}

async function main(): Promise<void> {
  try {
    await testSendsCredentialAsHeaderNotQueryString();
    await testReturnsMockedProjectionUnchanged();
    await testFailureResponseProducesTypedError();
    await testNetworkErrorProducesTypedError();
    await testMissingCredentialProducesTypedError();
  } finally {
    restoreEnv();
  }

  console.log("PASS: bridge-activity-client sends the credential as a header, passes the projection through unchanged, and surfaces failures as typed results");
}

main();
