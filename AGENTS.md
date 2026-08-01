# villagealchemist engineering contract

## Scope

These instructions apply to all villagealchemist source outside `sites/jux`. The `sites/jux` tree is transitional
content for an independent website. Do not inspect, traverse, modify, move, format, scan, build, copy, publish, or
otherwise include it in villagealchemist work.

## TypeScript requirements

- TypeScript is the default and required language for all authored executable code.
- JavaScript may exist only as ignored generated browser output in `dist`.
- Do not add authored `.js`, `.mjs`, or `.cjs` source or tooling files.
- Use interfaces for object-shaped models.
- Reserve type aliases for unions, primitives, mapped types, and cases interfaces cannot represent cleanly.
- Do not create class-based DTOs or domain models.
- Use classes only where a framework genuinely requires them, such as future TSOA controllers.
- Prefer precise types, discriminated unions, explicit return types at public boundaries, type-only imports, exhaustive
  control flow, and readonly data where semantically correct.
- Use `unknown` plus validation or narrowing at untrusted boundaries.
- Do not use explicit or implicit `any`, `as any`, double assertions, blanket type assertions, unjustified non-null
  assertions, `@ts-ignore`, `@ts-nocheck`, or broad lint suppression.
- Do not silence compiler errors. Correct the model or narrow the value.
- Runtime behavior and runtime validation must agree with declared types.
- Use the smallest correct change and preserve public behavior unless a change is explicitly requested.

## Future API architecture

- Do not install or scaffold TSOA, Express, a database, or API routes until API work is explicitly requested.
- When the API begins, TSOA is the required controller and OpenAPI generation framework.
- Use the architecture `Controllers -> Services -> Repositories`.
- Controllers own HTTP concerns only and must never access the database directly.
- Services own business logic.
- Repositories own persistence.
- Keep database, request, and response interfaces separate under clear boundaries such as `src/models/db`,
  `src/models/requests`, and `src/models/responses`.
- Use named request and response interfaces at API boundaries. Do not expose anonymous object blobs.
- TSOA must generate routes, validation metadata, and the OpenAPI specification from TypeScript source.
- Serve Swagger UI at `/docs` once the API exists.
- Do not maintain a second handwritten specification that can drift from the implementation.

## OpenAPI documentation standards

- Give every controller and endpoint an accurate description.
- Use applicable TSOA route, tag, method, path, query, body, header, security, success-response, and error-response
  decorators.
- Give every API-facing interface and non-obvious property useful TSOA-compatible documentation.
- Include truthful examples, formats, patterns, allowed values, defaults, minimums, maximums, and nullability where
  applicable.
- Document actual success and expected error responses with named response interfaces.
- Use HTTP 422 for validation failures and document a structured field-error response.
- Keep documentation constraints and runtime validation consistent.
- Model complex filter, pagination, sort, and query grammars precisely.
- If TSOA cannot represent a contract faithfully, use a deliberate generated-spec extension or merge process. Never
  substitute `any` or publish misleading Swagger documentation.
- Keep OpenAPI documentation on API-facing contracts. Do not add fake annotations to ordinary DOM helpers. Normal TSDoc
  is appropriate for exported configuration contracts when it adds real value.

## Testing and tooling

- Every change must pass source-policy checks, strict type checking, type-aware linting, deterministic building, route
  validation, and Wrangler dry-run validation.
- Inspect actual failures and never claim success while a relevant check is failing.
- Exclude generated content, `node_modules`, `dist`, `.wrangler`, `.build-tools`, `.git`, lockfiles, and `sites/jux`
  from authored-source scans where appropriate.
- Unicode code point U+2014 is prohibited in authored villagealchemist files.
- Do not add assistant, AI, or co-author attribution to commits.
