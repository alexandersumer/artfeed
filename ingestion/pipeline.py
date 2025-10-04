"""Utilities to transform ingested ArtworkRecord objects into database payloads."""

from __future__ import annotations

from .models import ArtworkRecord


def record_to_artwork_payload(record: ArtworkRecord) -> dict:
    """Map an ArtworkRecord to the shape expected by the NestJS data layer."""
    payload = {
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
    }
    return payload


def record_to_embedding_payload(record: ArtworkRecord, embedding: list[float]) -> dict:
    return {
        "embedding": embedding,
        "model": "clip-vit-b32",
        "phash": None,
    }


__all__ = ["record_to_artwork_payload", "record_to_embedding_payload"]
