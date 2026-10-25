import pytest
from app.tracking.normalizer import euclidean_distance
from app.tracking.gestures import classify_built_in_gesture


def test_pinch_distance_calculation():
    p1 = {"x": 0.1, "y": 0.2, "z": 0.0}
    p2 = {"x": 0.1, "y": 0.3, "z": 0.0}
    dist = euclidean_distance(p1, p2)
    assert pytest.approx(dist, 0.001) == 0.1


def test_pinch_detection():
    # Build a 21-landmark mock hand where thumb tip (4) and index tip (8) are touching
    landmarks = [{"x": 0.0, "y": 0.0, "z": 0.0} for _ in range(21)]
    landmarks[4] = {"x": 0.2, "y": 0.4, "z": 0.0}
    landmarks[8] = {"x": 0.21, "y": 0.41, "z": 0.0}  # ~0.014 distance

    result = classify_built_in_gesture(landmarks, handedness="Right", pinch_threshold=0.24)
    assert result.is_pinch is True
    assert result.pinch_distance < 0.05

    # Move index tip away
    landmarks[8] = {"x": 0.5, "y": 0.8, "z": 0.0}
    result_far = classify_built_in_gesture(landmarks, handedness="Right", pinch_threshold=0.24)
    assert result_far.is_pinch is False
    assert result_far.pinch_distance > 0.3
