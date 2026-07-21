// Vitest runs server modules directly in Node. Next.js enforces this boundary
// at build time; this harmless shim lets pure adapter helpers be unit-tested.
export {};
