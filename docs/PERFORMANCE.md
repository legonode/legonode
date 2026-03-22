# Performance

Teevr is built for high throughput. These optimizations help you get the most req/s and stay ahead of frameworks like Fastify where it matters.

## What Teevr does (that Fastify does too or similar)

- **Radix router** — Same find-my-way style routing; O(path depth) lookup, no regex.
- **Schema-based serialization** — `fast-json-stringify` compiles once per response schema; minimal runtime cost.
- **Pre-warmed runtime** — `warmRuntime()` before `listen()` so the first request doesn't pay for route/middleware/pipeline setup.
- **Sync hot path** — After warm, route and pipeline resolution are sync from cache; no await on the common path.

## What Teevr does that Fastify doesn't

1. **Zero alloc when tracing is off**  
   If tracing is disabled (`tracing: false` or `TEEVR_SKIP_TRACING=1`), the request path uses a shared no-op span: no `randomUUID()`, no per-request span object. Fastify doesn't ship a tracer; when you add one you typically pay per request.

2. **Pre-allocated error buffers**  
   Common responses are sent from pre-allocated buffers to avoid JSON.stringify + allocation on the hot path:
   - `200` with `{ hello: "world" }` → single shared buffer.
   - `500` with `{ error: "Internal Server Error" }` → single shared buffer.

3. **Optional context pooling**  
   `contextPool: true` reuses context objects across requests to reduce GC pressure under load (similar idea to connection/object pooling in other runtimes).

4. **Sync runtime after warm**  
   Once the runtime is created, subsequent requests use it synchronously (no microtask for a resolved promise). First request may still await; every other request avoids that await.

## How to maximize req/s

- **Benchmarks / load tests**  
  Set `TEEVR_SKIP_TRACING=1` (or `tracing: false` in options) so the hot path doesn't create trace IDs or span objects.

- **Production**  
  - Call `warmRuntime(options)` before `server.listen()` so the first request isn't cold.
  - Use `contextPool: true` for long-lived servers with many concurrent requests.
  - Keep tracing off (or use a no-op tracer) if you don't need it.

- **Run on Bun**  
  Running the same Teevr app on Bun (instead of Node) often yields higher req/s due to Bun's runtime and HTTP stack. Use the same `createNodeServer` API; no code change.

- **Response schemas**  
  Define response schemas where possible so Teevr can use compiled `fast-json-stringify` instead of `JSON.stringify`.

## Measuring

Use your usual tooling (e.g. autocannon, wrk). The repo's benchmark suite compares Teevr vs Fastify under the same options (connections, pipelining, duration). Run with `TEEVR_SKIP_TRACING=1` for a fair comparison.
