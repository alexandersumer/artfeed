from dataclasses import dataclass, field
from datetime import datetime


@dataclass(frozen=True)
class ImageVariants:
    feed: str | None = None
    detail_iiif: str | None = None
    full: str | None = None


@dataclass(frozen=True)
class ArtworkRecord:
    source: str
    source_id: str
    title: str | None
    artist: str | None
    period: list[str] = field(default_factory=list)
    styles: list[str] = field(default_factory=list)
    subjects: list[str] = field(default_factory=list)
    license: str | None = None
    rights: str | None = None
    credit_line: str | None = None
    image: ImageVariants = field(default_factory=ImageVariants)
    iiif_manifest_url: str | None = None
    iiif_image_base: str | None = None
    width: int | None = None
    height: int | None = None
    is_public_domain: bool = False
    fetched_at: datetime = field(default_factory=datetime.utcnow)
    tags: list[str] = field(default_factory=list)
    raw: dict = field(default_factory=dict, repr=False)
