#!/usr/bin/env python3
"""Pin Neon staging inside Replit without storing URL components."""
from __future__ import annotations

import getpass
import hashlib
import json
import pathlib
from datetime import datetime, timezone
from urllib.parse import unquote, urlparse

ROOT = pathlib.Path(__file__).resolve().parent
PIN = ROOT / "NEON_STAGING_TARGET_PIN.json"


def identity_hash(connection_string: str) -> str:
    parsed = urlparse(connection_string)
    if parsed.scheme.lower() not in {"postgres", "postgresql"} or not parsed.hostname:
        raise ValueError("Input did not look like a complete PostgreSQL URL")
    identity = "\0".join(
        (
            parsed.hostname.lower(),
            str(parsed.port or 5432),
            unquote(parsed.path.lstrip("/")),
            unquote(parsed.username or ""),
        )
    )
    return hashlib.sha256(identity.encode("utf-8")).hexdigest()


print("Open the Neon STAGING project and locate its endpoint ID in the dashboard.")
expected_endpoint = input("Type the Neon STAGING endpoint ID (must begin ep-): ").strip().lower()
if not expected_endpoint.startswith("ep-") or any(ch not in "abcdefghijklmnopqrstuvwxyz0123456789-" for ch in expected_endpoint):
    raise SystemExit("Endpoint ID was not valid; no pin was written.")
confirmation = input("Type exactly PIN NEON STAGING TARGET to continue: ").strip()
if confirmation != "PIN NEON STAGING TARGET":
    raise SystemExit("Confirmation did not match; no pin was written.")
url = getpass.getpass("Paste the Neon STAGING DATABASE_URL (input hidden): ").strip()
try:
    parsed = urlparse(url)
    digest = identity_hash(url)
    host_label = (parsed.hostname or "").lower().split(".", 1)[0]
    endpoint_matches = host_label in {expected_endpoint, f"{expected_endpoint}-pooler"}
    if not endpoint_matches:
        raise ValueError("URL endpoint does not match the independently entered staging endpoint ID")
except ValueError as error:
    raise SystemExit(f"{error}; no pin was written.") from None
finally:
    url = ""
    expected_endpoint = ""
payload = {
    "formatVersion": 1,
    "identityHashAlgorithm": "sha256(host,port,database,user)",
    "identitySha256": digest,
    "endpointDiscriminatorVerified": True,
    "pinnedAt": datetime.now(timezone.utc).isoformat(),
    "containsConnectionDetails": False,
}
PIN.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
print(f"Neon staging identity pin written to: {PIN}")
print("No URL, hostname, database username, or password was stored.")
