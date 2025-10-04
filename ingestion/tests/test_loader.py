import math
from datetime import datetime

from ingestion.load_to_db import build_payload, generate_embedding
from ingestion.models import ArtworkRecord, ImageVariants


def make_record() -> ArtworkRecord:
    return ArtworkRecord(
        source="met",
        source_id="123",
        title="Test",
        artist="Tester",
        period=["Modern"],
        styles=["Painting"],
        subjects=["Test"],
        license="CC0",
        rights="",
        credit_line="Test Line",
        image=ImageVariants(feed="feed.jpg", detail_iiif="detail", full="full.jpg"),
        iiif_manifest_url="manifest",
        iiif_image_base="base",
        width=100,
        height=200,
        is_public_domain=True,
        fetched_at=datetime.utcnow(),
    )


def test_generate_embedding_is_normalized():
    record = make_record()
    vector = generate_embedding(record, dims=16)
    assert len(vector) == 16
    magnitude = math.sqrt(sum(component * component for component in vector))
    assert math.isclose(magnitude, 1.0, rel_tol=1e-6)


def test_build_payload_maps_fields():
    record = make_record()
    embedding = [0.5, 0.5]
    payload = build_payload(record, embedding, model="clip")
    assert payload["source"] == record.source
    assert payload["sourceId"] == record.source_id
    assert payload["imageUrl1080"] == record.image.feed
    assert payload["embedding"] == embedding
    assert payload["embeddingModel"] == "clip"
    assert payload["imageDetail"]["full"] == record.image.full
