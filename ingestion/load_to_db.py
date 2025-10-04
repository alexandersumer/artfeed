"""CLI to push normalized artwork records into the Nest ingestion endpoint."""

from __future__ import annotations

import argparse
import asyncio
import hashlib
import math
import os
from collections.abc import AsyncIterator, Iterable, Sequence

import httpx

from ingestion.aic_client import iter_aic_records
from ingestion.met_client import iter_met_records
from ingestion.models import ArtworkRecord

DEFAULT_BATCH_SIZE = 50
DEFAULT_EMBEDDING_DIM = 64


def generate_embedding(record: ArtworkRecord, *, dims: int = DEFAULT_EMBEDDING_DIM) -> list[float]:
    """Generate a deterministic pseudo-embedding from the record identity."""
    digest = hashlib.sha256(f"{record.source}:{record.source_id}".encode()).digest()
    values = list(digest) * ((dims + len(digest) - 1) // len(digest))
    vector = [value / 255.0 for value in values[:dims]]
    magnitude = math.sqrt(sum(component * component for component in vector))
    if magnitude == 0:
        return vector
    return [component / magnitude for component in vector]


async def iter_records(source: str, *, limit: int | None = None) -> AsyncIterator[ArtworkRecord]:
    if source == "met":
        async with httpx.AsyncClient() as client:
            async for record in iter_met_records(client, max_objects=limit):
                yield record
    elif source == "aic":
        async with httpx.AsyncClient() as client:
            pages = None
            if limit:
                pages = max(1, math.ceil(limit / 100))
            async for record in iter_aic_records(client, max_pages=pages):
                yield record
    else:
        raise ValueError(f"Unsupported source '{source}'")


def build_payload(record: ArtworkRecord, embedding: Sequence[float], *, model: str) -> dict:
    return {
        "source": record.source,
        "sourceId": record.source_id,
        "title": record.title,
        "artist": record.artist,
        "period": record.period,
        "styles": record.styles,
        "subjects": record.subjects,
        "iiifManifestUrl": record.iiif_manifest_url,
        "iiifImageBase": record.iiif_image_base,
        "imageUrlFull": record.image.full,
        "imageUrl1080": record.image.feed,
        "license": record.license,
        "rights": record.rights,
        "creditLine": record.credit_line,
        "isPublicDomain": record.is_public_domain,
        "createdAt": record.fetched_at.isoformat(),
        "embedding": list(embedding),
        "embeddingModel": model,
        "imageDetail": {
            "detailIiif": record.image.detail_iiif,
            "full": record.image.full,
        },
    }


async def send_batches(
    *,
    api_base: str,
    api_key: str,
    source: str,
    batch_size: int,
    limit: int | None,
    embedding_model: str,
) -> None:
    headers = {"x-ingestion-key": api_key}
    async with httpx.AsyncClient(base_url=api_base, headers=headers, timeout=60) as client:
        batch: list[dict] = []
        count = 0
        async for record in iter_records(source, limit=limit):
            embedding = generate_embedding(record)
            batch.append(build_payload(record, embedding, model=embedding_model))
            if len(batch) >= batch_size:
                response = await client.post("/v1/internal/ingestion/batch", json={"items": batch})
                response.raise_for_status()
                count += len(batch)
                print(f"Ingested batch of {len(batch)} (total {count})")
                batch = []
        if batch:
            response = await client.post("/v1/internal/ingestion/batch", json={"items": batch})
            response.raise_for_status()
            count += len(batch)
            print(f"Ingested final batch of {len(batch)} (total {count})")


def parse_args(argv: Iterable[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", choices=["met", "aic"], help="Ingestion source to export")
    parser.add_argument(
        "--api-base", default=os.environ.get("ARTFEED_API_BASE", "http://localhost:3000")
    )
    parser.add_argument(
        "--api-key",
        default=os.environ.get("INGESTION_API_KEY"),
        help="Shared secret for ingestion endpoint",
    )
    parser.add_argument("--batch-size", type=int, default=DEFAULT_BATCH_SIZE)
    parser.add_argument("--limit", type=int, default=None, help="Optional limit on records fetched")
    parser.add_argument("--embedding-model", default="clip-vit-b32")
    return parser.parse_args(argv)


async def main(argv: Iterable[str] | None = None) -> None:
    args = parse_args(list(argv) if argv is not None else None)
    if not args.api_key:
        raise SystemExit("INGESTION_API_KEY must be provided via --api-key or environment variable")
    await send_batches(
        api_base=args.api_base,
        api_key=args.api_key,
        source=args.source,
        batch_size=args.batch_size,
        limit=args.limit,
        embedding_model=args.embedding_model,
    )


if __name__ == "__main__":  # pragma: no cover - CLI entrypoint
    asyncio.run(main())
