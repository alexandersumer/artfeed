"""Art Institute of Chicago ingestion helpers."""
from __future__ import annotations

import asyncio
from dataclasses import asdict
from typing import AsyncIterator, Dict, List, Optional

import httpx

from .models import ArtworkRecord, ImageVariants

AIC_API_ROOT = "https://api.artic.edu/api/v1"


async def fetch_json(client: httpx.AsyncClient, url: str, params: Optional[Dict[str, str]] = None) -> dict:
    response = await client.get(url, params=params, timeout=30)
    response.raise_for_status()
    return response.json()


def build_iiif_image_url(image_id: str, size: str) -> str:
    return f"https://www.artic.edu/iiif/2/{image_id}/full/{size}/0/default.jpg"


def normalize_aic_item(raw: dict) -> Optional[ArtworkRecord]:
    data = raw.get("data") or raw
    if not data.get("is_public_domain"):
        return None

    image_id = data.get("image_id")
    if not image_id:
        return None

    iiif_base = f"https://www.artic.edu/iiif/2/{image_id}"
    dimensions = (data.get("dimensions_detail") or [])
    first_dimension = dimensions[0] if dimensions else {}

    image_variants = ImageVariants(
        feed=build_iiif_image_url(image_id, "1080,"),
        detail_iiif=f"{iiif_base}/manifest.json",
        full=build_iiif_image_url(image_id, "full"),
    )

    return ArtworkRecord(
        source="aic",
        source_id=str(data.get("id")),
        title=data.get("title"),
        artist=data.get("artist_title"),
        period=data.get("style_titles") or [],
        styles=data.get("category_titles") or [],
        subjects=data.get("subject_titles") or [],
        license="CC0",
        rights=data.get("copyright_notice"),
        credit_line=data.get("credit_line"),
        image=image_variants,
        iiif_manifest_url=f"{iiif_base}/manifest.json",
        iiif_image_base=iiif_base,
        width=first_dimension.get("width"),
        height=first_dimension.get("height"),
        is_public_domain=True,
        tags=data.get("term_titles") or [],
        raw=raw,
    )


async def iter_aic_records(
    client: httpx.AsyncClient,
    *,
    page_size: int = 100,
    max_pages: Optional[int] = None,
) -> AsyncIterator[ArtworkRecord]:
    page = 1
    while True:
        response = await fetch_json(
            client,
            f"{AIC_API_ROOT}/artworks",
            params={
                "page": str(page),
                "limit": str(page_size),
                "fields": "id,title,image_id,is_public_domain,artist_title,style_titles,category_titles,subject_titles,credit_line,term_titles,dimensions_detail,copyright_notice",
                "is_public_domain": "true",
                "has_image": "true",
            },
        )
        for item in response.get("data", []):
            record = normalize_aic_item(item)
            if record:
                yield record

        pagination = response.get("pagination", {})
        if not pagination.get("next_page"):
            break

        page += 1
        if max_pages and page > max_pages:
            break


async def export_aic_records(*, max_pages: Optional[int] = None, output: Optional[str] = None) -> List[ArtworkRecord]:
    async with httpx.AsyncClient() as client:
        records = [record async for record in iter_aic_records(client, max_pages=max_pages)]

    if output:
        import json
        from pathlib import Path

        Path(output).write_text(
            json.dumps([asdict(record) for record in records], default=str, indent=2),
            encoding="utf-8",
        )

    return records


__all__ = [
    "normalize_aic_item",
    "iter_aic_records",
    "export_aic_records",
    "build_iiif_image_url",
]
