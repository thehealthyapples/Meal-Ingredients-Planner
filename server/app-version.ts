// Must be stable across all server instances for the same deploy.
// Set the APP_VERSION env var in your deployment environment.
// Falling back to "dev" means all instances agree and no reload loop fires.
export const APP_VERSION = process.env.APP_VERSION || "dev";
