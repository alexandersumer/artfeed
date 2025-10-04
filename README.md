# artfeed

An end-to-end skeleton for an artwork recommendation product built around the MVP plan: a NestJS API gateway, modular feed and interaction services, a personalization core, and Python-based ingestion utilities for open-access museum data.

## Repository Layout

- `src/` – NestJS application composed of feature modules (`feed`, `interactions`, `artworks`, `recommendation`, `users`) backed by TypeORM.
- `ingestion/` – Python normalization and export helpers for The Met and the Art Institute of Chicago.
- `test/` – Jest integration and unit coverage for the backend modules.
- `.github/workflows/` – CI pipeline that mirrors the local `pnpm run ci` command.

## Getting Started

```bash
corepack enable pnpm
pnpm install
pnpm run build
pnpm run start
```

Run database migrations before starting the API in any environment that does not enable schema synchronization:

```bash
pnpm run migration:run
```

Set database credentials through environment variables (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`). During local development you can enable schema sync by setting `DB_AUTO_SYNC=true`.

Personalization experiments can be swapped via the `PERSONALIZATION_ENGINE` environment variable. The default `default` engine wraps the existing recommendation service; alternative adapters can be rolled out incrementally without redeploying the core modules.

### Authentication & Security

- Request a feed or post interactions with a Bearer token obtained from `POST /v1/auth/anonymous` (or your own identity provider). Tokens are JWTs signed with `JWT_SECRET` (default `change-me`) and expire based on `JWT_TTL` (default `7d`).
- Controllers now enforce JWT authentication and share a rate limiter (`120 requests/minute` per client) via `@nestjs/throttler`.
- Operational metrics are exposed at `GET /v1/metrics` (Prometheus format) and HTTP calls are traced by a lightweight interceptor.
- Configure the ingestion bridge with `INGESTION_API_KEY`; calls to `POST /v1/internal/ingestion/batch` must present this value through the `x-ingestion-key` header.

### Ingestion Pipeline

- Export and push artworks with embeddings via the authenticated ingestion endpoint:
  ```bash
  export INGESTION_API_KEY=replace-me
  pnpm run ingest:load -- met --limit 200 --api-base http://localhost:3000
  ```
  The CLI batches normalized records from the Python exporters and calls `POST /v1/internal/ingestion/batch`, which persists both artwork metadata and embeddings idempotently.

## Running Tests & Quality Gates

- **All checks (parity with CI):**
  ```bash
  pnpm run ci
  ```
- **TypeScript unit tests only:**
  ```bash
  pnpm run test:unit
  ```
- **Python ingestion tests:**
  ```bash
  pnpm run test:ingestion
  ```
  The command installs ingestion dependencies via `python3 -m pip install -r ingestion/requirements.txt` before executing `pytest`.
- **Linting:**
  ```bash
  pnpm run lint
  ```

## Key Backend Capabilities (MVP)

- **Feed API** – `GET /v1/feed` ranks artworks via a hybrid recommender blending cosine similarity, diversity, freshness, and exploration bonuses; impressions are persisted for analytics.
- **Interaction API** – `POST /v1/interaction` logs explicit events (like, save, hide, etc.) and performs immediate taste vector updates to drive re-ranking.
- **Artwork API** – `GET /v1/artworks/:id` returns the fully hydrated artwork metadata payload that powers the detail view with IIIF-ready fields.
- **Recommendation Core** – Embeds user preferences as normalized vectors, updates them with exponentially weighted deltas, and ranks candidate sets deterministically for reproducible testing.
- **Persistence** – Postgres-oriented schema (tests run against SQLite) covering artworks, embeddings, users, user profiles, interactions, and feed impressions.

## Ingestion Utilities

- `ingestion/met_client.py` – Async client for The Met open access API with normalization into `ArtworkRecord` objects.
- `ingestion/aic_client.py` – Async client for the Art Institute of Chicago IIIF catalog.
- `ingestion/pipeline.py` – Helpers to map `ArtworkRecord` data into structures expected by the NestJS services.

Each normalization helper is unit-tested to guarantee consistent payloads before wiring into offline jobs (Airflow/Prefect).

## Next Steps

- Connect the ingestion pipelines to Postgres via batch jobs (e.g., Prefect) and enqueue CLIP embedding inference.
- Add WebSocket push support for real-time re-ranks and cold-start onboarding APIs.
- Introduce infra-as-code, observability glue (OTel exporters), and the React Native client shell as outlined in the product plan.
