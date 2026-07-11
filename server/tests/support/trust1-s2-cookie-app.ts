/**
 * trust1-s2-cookie-app.ts — support fixture for TRUST1-S2
 * =======================================================
 * Not a test. A minimal, real HTTP server used by
 * `server/tests/test-trust1-s2-secure-production-cookies.ts` to observe the session cookie
 * **on the wire** rather than reading a flag out of the source.
 *
 * It mounts the REAL `setupAuth()` — which is the code under test. `setupAuth` is what calls
 * `app.set("trust proxy", 1)`, what configures `express-session` with `sessionCookieOptions()`, and
 * what registers `POST /api/login` and `GET /api/user`. So the `Set-Cookie` header this fixture
 * emits is produced by exactly the production code path, with no mock, stub, or reimplementation
 * anywhere in it.
 *
 * What it deliberately does NOT do is boot `server/index.ts`. In production mode that would call
 * `serveStatic()`, which throws unless the client has been built — a client bundle has nothing to do
 * with a cookie flag, and requiring one would have made the production half of this test impossible
 * to run, which is how "verified in production" quietly becomes "verified in development".
 *
 * The environment matrix (NODE_ENV, ENABLE_REGISTRATION) is supplied by the parent process, one
 * child per configuration, because the flags are read per-request from a module the parent has
 * already imported.
 */

import express from "express";
import { setupAuth } from "../../auth.js";

const app = express();
app.use(express.json());

setupAuth(app);

const port = parseInt(process.env.PORT || "0", 10);
app.listen(port, "127.0.0.1", () => {
  console.log(`cookie-app listening on port ${port}`);
});
