import pytest
from app.tracking.normalizer import normalize_landmarks, euclidean_distance, euclidean_distance_2d


def test_normalize_empty_or_invalid():
    norm, scale, flat = normalize_landmarks([])
    assert norm == []
    assert scale == 1.0
    assert len(flat) == 63
    assert all(v == 0.0 for v in flat)


def test_normalize_wrist_centering():
    # Construct 21 landmarks where wrist is at (10, 20, 5)
    landmarks = [{"x": 10.0, "y": 20.0, "z": 5.0} for _ in range(21)]
    # Set middle MCP (index 9) at (10.0, 24.0, 5.0) -> dy = 4.0, scale = 4.0
    landmarks[9] = {"x": 10.0, "y": 24.0, "z": 5.0}
    
    norm, scale, flat = normalize_landmarks(landmarks)
    assert pytest.approx(scale, 0.001) == 4.0
    # Wrist should be normalized to (0, 0, 0)
    assert norm[0]["x"] == 0.0
    assert norm[0]["y"] == 0.0
    assert norm[0]["z"] == 0.0
    # Middle MCP should be normalized to (0, 1.0, 0)
    assert norm[9]["x"] == 0.0
    assert pytest.approx(norm[9]["y"], 0.001) == 1.0
    assert norm[9]["z"] == 0.0
    assert len(flat) == 63


def test_euclidean_distance():
    p1 = {"x": 0.0, "y": 0.0, "z": 0.0}
    p2 = {"x": 3.0, "y": 4.0, "z": 0.0}
    assert pytest.approx(euclidean_distance(p1, p2), 0.001) == 5.0
    assert pytest.approx(euclidean_distance_2d(p1, p2), 0.001) == 5.0
