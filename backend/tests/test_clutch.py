import pytest
from app.tracking.clutch import ClutchTracker


def test_clutch_engage_and_linger():
    tracker = ClutchTracker(clutch_pose="open_palm", engage_frames=3, linger_frames=2)
    assert not tracker.is_engaged

    # Create mock open palm landmarks
    # For open palm, fingertips are extended
    landmarks = [{"x": 0.0, "y": 0.0, "z": 0.0} for _ in range(21)]
    # MCPs
    landmarks[5] = {"x": -0.2, "y": -0.3, "z": 0.0}
    landmarks[9] = {"x": 0.0, "y": -0.3, "z": 0.0}
    landmarks[13] = {"x": 0.2, "y": -0.3, "z": 0.0}
    landmarks[17] = {"x": 0.4, "y": -0.3, "z": 0.0}
    # PIPs
    landmarks[6] = {"x": -0.2, "y": -0.5, "z": 0.0}
    landmarks[10] = {"x": 0.0, "y": -0.5, "z": 0.0}
    landmarks[14] = {"x": 0.2, "y": -0.5, "z": 0.0}
    landmarks[18] = {"x": 0.4, "y": -0.5, "z": 0.0}
    # TIPs
    landmarks[8] = {"x": -0.2, "y": -0.9, "z": 0.0}
    landmarks[12] = {"x": 0.0, "y": -0.9, "z": 0.0}
    landmarks[16] = {"x": 0.2, "y": -0.9, "z": 0.0}
    landmarks[20] = {"x": 0.4, "y": -0.9, "z": 0.0}
    # Thumb
    landmarks[2] = {"x": -0.3, "y": -0.1, "z": 0.0}
    landmarks[3] = {"x": -0.4, "y": -0.2, "z": 0.0}
    landmarks[4] = {"x": -0.6, "y": -0.3, "z": 0.0}

    # Frame 1: hit 1
    res = tracker.update(landmarks, handedness="Left")
    assert res["consecutive_hits"] == 1
    assert not res["is_engaged"]

    # Frame 2: hit 2
    res = tracker.update(landmarks, handedness="Left")
    assert res["consecutive_hits"] == 2
    assert not res["is_engaged"]

    # Frame 3: hit 3 -> engaged!
    res = tracker.update(landmarks, handedness="Left")
    assert res["consecutive_hits"] == 3
    assert res["is_engaged"]

    # Frame 4: miss -> lingers (linger 2 -> 1)
    res = tracker.update(None, handedness="Left")
    assert res["is_engaged"]
    assert res["linger_remaining"] == 1

    # Frame 5: miss -> lingers (linger 1 -> 0)
    res = tracker.update(None, handedness="Left")
    assert res["is_engaged"]
    assert res["linger_remaining"] == 0

    # Frame 6: miss -> disengaged!
    res = tracker.update(None, handedness="Left")
    assert not res["is_engaged"]
