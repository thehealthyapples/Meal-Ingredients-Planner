#!/usr/bin/env python3
"""Secure Replit-internal launcher for the full Replit -> Neon staging refresh."""
from __future__ import annotations

import getpass
import hashlib
import json
import os
import pathlib
import subprocess
from urllib.parse import unquote, urlparse

ROOT = pathlib.Path(__file__).resolve().parent
WORKSPACE = pathlib.Path.cwd()
SCRIPT = ROOT / "refresh_neon_staging_from_replit.mjs"
SOURCE_SNAPSHOT = ROOT / "replit-source-schema.json"
TARGET_SNAPSHOT = ROOT / "neon-target-schema.json"
NODE_MODULES = WORKSPACE / "node_modules"
REPORT = ROOT / "FULL_STAGING_DATA_REFRESH_REPORT.json"
PIN = ROOT / "NEON_STAGING_TARGET_PIN.json"

for required in (SCRIPT, SOURCE_SNAPSHOT, TARGET_SNAPSHOT, NODE_MODULES, PIN):
    if not required.exists():
        raise SystemExit(f"Required path is missing: {required}")


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


source_url = os.environ.get("DATABASE_URL", "").strip()
if not source_url:
    raise SystemExit("Replit DATABASE_URL is not available in this workspace; nothing was run.")
try:
    identity_hash(source_url)
except ValueError as error:
    raise SystemExit(f"Replit DATABASE_URL is invalid: {error}; nothing was run.") from None

pin_payload = json.loads(PIN.read_text(encoding="utf-8"))
expected_target_hash = str(pin_payload.get("identitySha256", ""))
if len(expected_target_hash) != 64 or pin_payload.get("endpointDiscriminatorVerified") is not True:
    raise SystemExit("Neon staging target pin is invalid or lacks independent endpoint verification; nothing was run.")

print("This will transactionally REPLACE Neon staging application data with this Replit workspace's data.")
print("It preserves the Neon schema and migration ledger, and excludes stale sessions.")
print("Any copy or constraint failure rolls back the complete Neon transaction.")
confirmation = input("Type exactly REPLACE NEON STAGING DATA to continue: ").strip()
if confirmation != "REPLACE NEON STAGING DATA":
    raise SystemExit("Confirmation did not match; nothing was run.")
target_url = getpass.getpass("Paste the Neon STAGING DATABASE_URL again (input hidden): ").strip()
try:
    actual_target_hash = identity_hash(target_url)
except ValueError as error:
    raise SystemExit(f"{error}; nothing was run.") from None
if actual_target_hash != expected_target_hash:
    raise SystemExit("Target URL does not match the securely pinned Neon staging identity; nothing was run.")

env = os.environ.copy()
env.update(
    {
        "REPLIT_SOURCE_DATABASE_URL": source_url,
        "NEON_STAGING_DATABASE_URL": target_url,
        "REPLIT_SCHEMA_SNAPSHOT": str(SOURCE_SNAPSHOT),
        "NEON_SCHEMA_SNAPSHOT": str(TARGET_SNAPSHOT),
        "DATA_MIGRATION_REPORT": str(REPORT),
        "MIGRATION_NODE_MODULES": str(NODE_MODULES),
        "EXPECTED_NEON_STAGING_IDENTITY_SHA256": expected_target_hash,
        "MIGRATION_CONFIRM": confirmation,
    }
)
try:
    result = subprocess.run(["node", str(SCRIPT)], cwd=WORKSPACE, env=env, check=False)
finally:
    for key in (
        "REPLIT_SOURCE_DATABASE_URL",
        "NEON_STAGING_DATABASE_URL",
        "EXPECTED_NEON_STAGING_IDENTITY_SHA256",
        "MIGRATION_CONFIRM",
    ):
        env.pop(key, None)
    source_url = ""
    target_url = ""
    confirmation = ""

if result.returncode == 2:
    raise SystemExit(
        "The Neon data transaction committed successfully, but the evidence report could not be written. "
        "Do not rerun automatically; inspect staging first."
    )
if result.returncode != 0:
    raise SystemExit(
        f"Migration aborted with exit code {result.returncode}. Neon was rolled back and no credential was stored."
    )
print(f"Full staging data refresh completed. Evidence report: {REPORT}")
