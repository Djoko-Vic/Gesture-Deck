import pytest
from app.tracking.wave_detector import WaveDetector


def test_wave_detector_initialization():
    detector = WaveDetector()
    assert detector.buffer_size == 30
    assert len(detector.history) == 0


def test_wave_detector_reversals():
    detector = WaveDetector(buffer_size=30, min_reversals=3, min_amplitude=0.07, min_open_fingers=4)

    # Mock open palm normalized landmarks
    open_hand_lms = [{"x": 0.0, "y": 0.0, "z": 0.0} for _ in range(21)]
    # MCPs
    open_hand_lms[5] = {"x": -0.2, "y": -0.3, "z": 0.0}
    open_hand_lms[9] = {"x": 0.0, "y": -0.3, "z": 0.0}
    open_hand_lms[13] = {"x": 0.2, "y": -0.3, "z": 0.0}
    open_hand_lms[17] = {"x": 0.4, "y": -0.3, "z": 0.0}
    # PIPs
    open_hand_lms[6] = {"x": -0.2, "y": -0.5, "z": 0.0}
    open_hand_lms[10] = {"x": 0.0, "y": -0.5, "z": 0.0}
    open_hand_lms[14] = {"x": 0.2, "y": -0.5, "z": 0.0}
    open_hand_lms[18] = {"x": 0.4, "y": -0.5, "z": 0.0}
    # TIPs
    open_hand_lms[8] = {"x": -0.2, "y": -0.9, "z": 0.0}
    open_hand_lms[12] = {"x": 0.0, "y": -0.9, "z": 0.0}
    open_hand_lms[16] = {"x": 0.2, "y": -0.9, "z": 0.0}
    open_hand_lms[20] = {"x": 0.4, "y": -0.9, "z": 0.0}
    # Thumb
    open_hand_lms[2] = {"x": -0.3, "y": -0.1, "z": 0.0}
    open_hand_lms[3] = {"x": -0.4, "y": -0.2, "z": 0.0}
    open_hand_lms[4] = {"x": -0.6, "y": -0.3, "z": 0.0}

    # Simulate oscillatory left-right motion: 0.4 -> 0.6 -> 0.4 -> 0.6
    xs = [0.4, 0.45, 0.5, 0.55, 0.6, 0.55, 0.5, 0.45, 0.4, 0.45, 0.5, 0.55, 0.6, 0.55, 0.5, 0.45, 0.4, 0.45, 0.5, 0.55, 0.6]

    detected = False
    for i, x in enumerate(xs):
        raw_lms = [{"x": x, "y": 0.5, "z": 0.0} for _ in range(21)]
        is_wave, stats = detector.update(raw_lms, open_hand_lms, handedness="Right", timestamp=100.0 + i * 0.04)
        if is_wave:
            detected = True
            break

    assert detected is True
