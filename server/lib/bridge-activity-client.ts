/**
 * bridge-activity-client.ts — Gate 8 bounded implementation
 * ===========================================================
 * Server-only client for the ChatGPT bridge's existing `/v1/tha/activity`
 * projection. This module makes no assumptions about the shape of the
 * projection: it returns whatever JSON the bridge sends, unchanged — no
 * field renaming, no invented fields, no lifecycle reinterpretation.
 *
 * HARD BOUNDARIES:
 *  - Reads the bridge base URL and credential from server-side env only.
 *  - Sends the credential as an Authorization header, never a query string.
 *  - Never logs the credential.
 *  - Does not import or shell out to anything in the bridge repository —
 *    this is an HTTP client only.
 */

const ACTIVITY_PATH = "/v1/tha/activity";

export interface BridgeActivitySuccess {
  readonly ok: true;
  readonly data: unknown;
}

export interface BridgeActivityFailure {
  readonly ok: false;
  readonly error: string;
}

export type BridgeActivityResult = BridgeActivitySuccess | BridgeActivityFailure;

export interface FetchBridgeActivityOptions {
  /** Injectable for tests; defaults to the global fetch. */
  readonly fetchImpl?: typeof fetch;
}

/**
 * Issues an authenticated GET to the bridge's `/v1/tha/activity` endpoint
 * and returns the parsed JSON projection unchanged. Never throws — network,
 * auth, and parse failures all surface as a typed `{ ok: false }` result so
 * callers cannot mistake a failure for a fabricated activity record.
 */
export async function fetchBridgeActivity(
  options: FetchBridgeActivityOptions = {},
): Promise<BridgeActivityResult> {
  const baseUrl = process.env.THA_BRIDGE_BASE_URL;
  const token = process.env.THA_BRIDGE_TOKEN;

  if (!baseUrl) {
    return { ok: false, error: "THA_BRIDGE_BASE_URL is not configured" };
  }
  if (!token) {
    return { ok: false, error: "THA_BRIDGE_TOKEN is not configured" };
  }

  let url: string;
  try {
    url = new URL(ACTIVITY_PATH, baseUrl).toString();
  } catch {
    return { ok: false, error: "THA_BRIDGE_BASE_URL is not a valid URL" };
  }

  const doFetch = options.fetchImpl ?? globalThis.fetch;

  let response: Response;
  try {
    response = await doFetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (err) {
    return {
      ok: false,
      error: `Bridge activity request failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  if (!response.ok) {
    return {
      ok: false,
      error: `Bridge activity request returned HTTP ${response.status}`,
    };
  }

  try {
    const data: unknown = await response.json();
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: `Bridge activity response could not be parsed as JSON: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}
