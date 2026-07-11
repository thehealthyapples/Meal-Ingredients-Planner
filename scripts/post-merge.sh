#!/bin/bash
# TRUST1-O8 — Production Schema Protection
# ========================================
# Wired to `.replit`'s [postMerge] hook: this runs automatically after every merge.
#
# It used to run `npm run db:push`, which meant a GIT MERGE COULD MUTATE A DATABASE SCHEMA —
# unreviewed, untransacted, unversioned, and against whatever DATABASE_URL happened to be set.
# `drizzle-kit push` drops columns to make the database match the code, so that path could
# destroy production data, and nobody ever decided it should exist.
#
# It is gone. This script now installs dependencies and NOTHING ELSE.
#
# DO NOT ADD A SCHEMA MUTATION HERE. Not `db:push`, not `drizzle-kit`, not `psql`, not a
# `tsx scripts/apply-*.ts`. Schema changes have exactly one route: a reviewed migration appended
# to `server/migrations/runner.ts`, applied at boot in a transaction, recorded in
# `schema_migrations`. See MIGRATIONS.md.
#
# `server/tests/test-trust1-o8-production-schema-protection.ts` fails the build if this file
# regains one, so an attempt to put it back will not merge quietly.

set -e

npm install
