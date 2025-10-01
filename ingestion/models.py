from dataclasses import dataclass, field
from datetime import datetime
from typing import List, Optional


@dataclass(frozen=True)
class ImageVariants:
    feed: Optional[str] = None
    detail_iiif: Optional[str] = None
    full: Optional[str] = None


@dataclass(frozen=True)
class ArtworkRecord:
    source: str
    source_id: str
    title: Optional[str]
    artist: Optional[str]
    period: List[str] = field(default_factory=list)
    styles: List[str] = field(default_factory=list)
    subjects: List[str] = field(default_factory=list)
    license: Optional[str] = None
    rights: Optional[str] = None
    credit_line: Optional[str] = None
    image: ImageVariants = field(default_factory=ImageVariants)
    iiif_manifest_url: Optional[str] = None
    iiif_image_base: Optional[str] = None
    width: Optional[int] = None
    height: Optional[int] = None
    is_public_domain: bool = False
    fetched_at: datetime = field(default_factory=datetime.utcnow)
    tags: List[str] = field(default_factory=list)
    raw: dict = field(default_factory=dict, repr=False)
