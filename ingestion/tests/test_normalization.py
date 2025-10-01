from ingestion.met_client import normalize_met_item
from ingestion.aic_client import normalize_aic_item
from ingestion.pipeline import record_to_artwork_payload


def test_normalize_met_item_maps_fields():
    raw = {
        "objectID": 123,
        "title": "Sunflowers",
        "artistDisplayName": "Vincent van Gogh",
        "isPublicDomain": True,
        "primaryImage": "https://example.org/full.jpg",
        "primaryImageSmall": "https://example.org/small.jpg",
        "tags": [{"term": "Post-Impressionism"}],
        "creditLine": "Gift",
        "rightsAndReproduction": "Public Domain",
    }

    record = normalize_met_item(raw)
    assert record is not None
    assert record.source == "met"
    assert record.source_id == "123"
    assert record.image.feed == "https://example.org/small.jpg"
    assert record.is_public_domain is True


def test_normalize_aic_item_filters_non_public_domain():
    raw = {
        "id": 42,
        "title": "Water Lilies",
        "artist_title": "Claude Monet",
        "image_id": "abc",
        "is_public_domain": False,
    }

    assert normalize_aic_item(raw) is None


def test_pipeline_payload_round_trip():
    raw = {
        "objectID": 321,
        "title": "Starry Night",
        "artistDisplayName": "Vincent van Gogh",
        "isPublicDomain": True,
        "primaryImage": "https://example.com/full.jpg",
        "primaryImageSmall": "https://example.com/feed.jpg",
    }
    record = normalize_met_item(raw)
    payload = record_to_artwork_payload(record)
    assert payload["source"] == "met"
    assert payload["sourceId"] == "321"
    assert payload["imageUrl1080"] == "https://example.com/feed.jpg"
