"""Client utilities for ingesting artworks from The Metropolitan Museum of Art."""
from __future__ import annotations

import asyncio
from dataclasses import asdict
from typing import AsyncIterator, Dict, Iterable, List, Optional

import httpx

from .models import ArtworkRecord, ImageVariants

MET_API_ROOT = "https://collectionapi.metmuseum.org/public/collection/v1"


async def fetch_json(client: httpx.AsyncClient, url: str, params: Optional[Dict[str, str]] = None) -> dict:
    response = await client.get(url, params=params, timeout=30)
    response.raise_for_status()
    return response.json()


def normalize_met_item(raw: dict) -> Optional[ArtworkRecord]:
    if not raw.get("primaryImage") and not raw.get("primaryImageSmall"):
        return None

    iiif_manifest = raw.get("iiifManifest")
    iiif_image_base = raw.get("iiifManifest")
    if raw.get("additionalImages") and len(raw["additionalImages"]) > 0:
        # The Met does not expose IIIF image base directly; fall back to original image.
        iiif_image_base = None

    image_variants = ImageVariants(
        feed=raw.get("primaryImageSmall") or raw.get("primaryImage"),
        detail_iiif=iiif_manifest,
        full=raw.get("primaryImage"),
    )

    license = "Public Domain" if raw.get("isPublicDomain") else raw.get("rightsAndReproduction")

    return ArtworkRecord(
        source="met",
        source_id=str(raw.get("objectID")),
        title=raw.get("title"),
        artist=raw.get("artistDisplayName"),
        period=[raw.get("period")] if raw.get("period") else [],
        styles=[raw.get("objectName")] if raw.get("objectName") else [],
        subjects=raw.get("tags") or [],
        license=license,
        rights=raw.get("rightsAndReproduction"),
        credit_line=raw.get("creditLine"),
        image=image_variants,
        iiif_manifest_url=iiif_manifest,
        iiif_image_base=iiif_image_base,
        width=raw.get("width"),
        height=raw.get("height"),
        is_public_domain=bool(raw.get("isPublicDomain")),
        tags=[tag.get("term") for tag in raw.get("tags", []) if isinstance(tag, dict) and tag.get("term")],
        raw=raw,
    )


async def iter_met_records(
    client: httpx.AsyncClient,
    *,
    query: str = "*",
    chunk_size: int = 100,
    max_objects: Optional[int] = None,
) -> AsyncIterator[ArtworkRecord]:
    search_payload = await fetch_json(
        client,
        f"{MET_API_ROOT}/search",
        params={"q": query, "hasImages": "true", "isPublicDomain": "true"},
    )
    object_ids: Iterable[int] = search_payload.get("objectIDs", []) or []

    if max_objects:
        object_ids = list(object_ids)[:max_objects]

    for chunk_index in range(0, len(object_ids), chunk_size):
        chunk = object_ids[chunk_index : chunk_index + chunk_size]
        tasks = [fetch_json(client, f"{MET_API_ROOT}/objects/{object_id}") for object_id in chunk]
        for coro in asyncio.as_completed(tasks):
            raw = await coro
            record = normalize_met_item(raw)
            if record:
                yield record


async def export_met_records(
    *,
    query: str = "*",
    max_objects: Optional[int] = None,
    output: Optional[str] = None,
) -> List[ArtworkRecord]:
    async with httpx.AsyncClient() as client:
        records = [record async for record in iter_met_records(client, query=query, max_objects=max_objects)]

    if output:
        import json
        from pathlib import Path

        Path(output).write_text(
            json.dumps([asdict(record) for record in records], default=str, indent=2),
            encoding="utf-8",
        )

    return records


__all__ = [
    "ArtworkRecord",
    "ImageVariants",
    "normalize_met_item",
    "iter_met_records",
    "export_met_records",
]
