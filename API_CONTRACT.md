# Lattice API contract

`backend/packages/contracts` is the authoritative, versioned API contract:

- `src/types.ts` exposes framework-independent TypeScript types.
- `src/schema/index.ts` exposes the equivalent runtime Zod schemas.
- `docs/contract.md` is the human-readable endpoint guide.

The Fastify API is implemented and its route tests validate responses against the
shared schemas. Frontend code imports types from `@lattice/contracts`; the legacy
`src/types/apiContract.ts` module only provides compatibility aliases.

## Change process

Changes to public request or response shapes must update the shared package first,
then the relevant route/client code, schema-based route tests, and this guide when
endpoint behaviour changes. Do not treat this file as a separate contract source.
