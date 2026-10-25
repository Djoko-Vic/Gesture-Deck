import pytest
from app.tracking.gestures import classify_built_in_gesture
from app.tracking.state_machine import GestureStateMachine
from app.actions.dispatcher import ActionDispatcher
from app.trainer.gesture_trainer import GestureTrainer
from app.config import AppSettings


def test_classify_empty():
    res = classify_built_in_gesture([])
    assert res.name == "none"
    assert res.confidence == 0.0


def test_classify_fist():
    landmarks = [{"x": 0.0, "y": 0.0, "z": 0.0} for _ in range(21)]
    landmarks[5] = {"x": -0.2, "y": -0.3, "z": 0.0}
    landmarks[9] = {"x": 0.0, "y": -0.3, "z": 0.0}
    landmarks[13] = {"x": 0.2, "y": -0.3, "z": 0.0}
    landmarks[17] = {"x": 0.4, "y": -0.3, "z": 0.0}
    landmarks[6] = {"x": -0.2, "y": -0.4, "z": 0.0}
    landmarks[10] = {"x": 0.0, "y": -0.4, "z": 0.0}
    landmarks[14] = {"x": 0.2, "y": -0.4, "z": 0.0}
    landmarks[18] = {"x": 0.4, "y": -0.4, "z": 0.0}
    landmarks[8] = {"x": -0.2, "y": -0.2, "z": 0.0}
    landmarks[12] = {"x": 0.0, "y": -0.2, "z": 0.0}
    landmarks[16] = {"x": 0.2, "y": -0.2, "z": 0.0}
    landmarks[20] = {"x": 0.4, "y": -0.2, "z": 0.0}
    landmarks[4] = {"x": -0.1, "y": -0.1, "z": 0.0}

    res = classify_built_in_gesture(landmarks, handedness="Right")
    assert res.name == "fist"
    assert res.confidence >= 0.9


def test_classify_play_pause_index_up():
    landmarks = [{"x": 0.0, "y": 0.0, "z": 0.0} for _ in range(21)]
    landmarks[5] = {"x": -0.1, "y": -0.3, "z": 0.0}
    landmarks[9] = {"x": 0.0, "y": -0.3, "z": 0.0}
    landmarks[13] = {"x": 0.1, "y": -0.3, "z": 0.0}
    landmarks[17] = {"x": 0.2, "y": -0.3, "z": 0.0}
    landmarks[6] = {"x": -0.1, "y": -0.5, "z": 0.0}
    landmarks[7] = {"x": -0.1, "y": -0.7, "z": 0.0}
    landmarks[8] = {"x": -0.1, "y": -0.9, "z": 0.0}
    landmarks[10] = {"x": 0.0, "y": -0.4, "z": 0.0}
    landmarks[12] = {"x": 0.0, "y": -0.2, "z": 0.0}
    landmarks[14] = {"x": 0.1, "y": -0.4, "z": 0.0}
    landmarks[16] = {"x": 0.1, "y": -0.2, "z": 0.0}
    landmarks[18] = {"x": 0.2, "y": -0.4, "z": 0.0}
    landmarks[20] = {"x": 0.2, "y": -0.2, "z": 0.0}
    landmarks[4] = {"x": -0.2, "y": -0.2, "z": 0.0}

    res = classify_built_in_gesture(landmarks, handedness="Right")
    assert res.name == "play_pause"
    assert res.confidence >= 0.85


def test_classify_peace_sign_next():
    landmarks = [{"x": 0.0, "y": 0.0, "z": 0.0} for _ in range(21)]
    landmarks[5] = {"x": -0.1, "y": -0.3, "z": 0.0}
    landmarks[9] = {"x": 0.1, "y": -0.3, "z": 0.0}
    landmarks[13] = {"x": 0.2, "y": -0.3, "z": 0.0}
    landmarks[17] = {"x": 0.3, "y": -0.3, "z": 0.0}
    landmarks[6] = {"x": -0.2, "y": -0.5, "z": 0.0}
    landmarks[8] = {"x": -0.3, "y": -0.9, "z": 0.0}
    landmarks[10] = {"x": 0.2, "y": -0.5, "z": 0.0}
    landmarks[12] = {"x": 0.3, "y": -0.9, "z": 0.0}
    landmarks[14] = {"x": 0.2, "y": -0.4, "z": 0.0}
    landmarks[16] = {"x": 0.2, "y": -0.2, "z": 0.0}
    landmarks[18] = {"x": 0.3, "y": -0.4, "z": 0.0}
    landmarks[20] = {"x": 0.3, "y": -0.2, "z": 0.0}
    landmarks[4] = {"x": -0.1, "y": -0.2, "z": 0.0}

    res = classify_built_in_gesture(landmarks, handedness="Right")
    assert res.name == "next"
    assert res.confidence >= 0.90


def test_classify_three_fingers_previous():
    landmarks = [{"x": 0.0, "y": 0.0, "z": 0.0} for _ in range(21)]
    landmarks[5] = {"x": -0.1, "y": -0.3, "z": 0.0}
    landmarks[9] = {"x": 0.1, "y": -0.3, "z": 0.0}
    landmarks[13] = {"x": 0.3, "y": -0.3, "z": 0.0}
    landmarks[17] = {"x": 0.5, "y": -0.3, "z": 0.0}
    landmarks[6] = {"x": -0.2, "y": -0.5, "z": 0.0}
    landmarks[8] = {"x": -0.3, "y": -0.9, "z": 0.0}
    landmarks[10] = {"x": 0.1, "y": -0.5, "z": 0.0}
    landmarks[12] = {"x": 0.1, "y": -0.9, "z": 0.0}
    landmarks[14] = {"x": 0.3, "y": -0.5, "z": 0.0}
    landmarks[16] = {"x": 0.3, "y": -0.9, "z": 0.0}
    landmarks[18] = {"x": 0.5, "y": -0.4, "z": 0.0}
    landmarks[20] = {"x": 0.5, "y": -0.2, "z": 0.0}
    landmarks[4] = {"x": -0.1, "y": -0.2, "z": 0.0}

    res = classify_built_in_gesture(landmarks, handedness="Right")
    assert res.name == "previous"
    assert res.confidence >= 0.90


def test_classify_open_palm_neutral():
    landmarks = [{"x": 0.0, "y": 0.0, "z": 0.0} for _ in range(21)]
    landmarks[5] = {"x": -0.2, "y": -0.3, "z": 0.0}
    landmarks[9] = {"x": 0.0, "y": -0.3, "z": 0.0}
    landmarks[13] = {"x": 0.2, "y": -0.3, "z": 0.0}
    landmarks[17] = {"x": 0.4, "y": -0.3, "z": 0.0}
    landmarks[6] = {"x": -0.2, "y": -0.5, "z": 0.0}
    landmarks[10] = {"x": 0.0, "y": -0.5, "z": 0.0}
    landmarks[14] = {"x": 0.2, "y": -0.5, "z": 0.0}
    landmarks[18] = {"x": 0.4, "y": -0.5, "z": 0.0}
    landmarks[8] = {"x": -0.2, "y": -0.9, "z": 0.0}
    landmarks[12] = {"x": 0.0, "y": -0.9, "z": 0.0}
    landmarks[16] = {"x": 0.2, "y": -0.9, "z": 0.0}
    landmarks[20] = {"x": 0.4, "y": -0.9, "z": 0.0}
    landmarks[4] = {"x": -0.6, "y": -0.3, "z": 0.0}

    res = classify_built_in_gesture(landmarks, handedness="Right")
    assert res.name == "open_palm"


def test_state_machine_wake_grace_period():
    settings = AppSettings(wake_grace_ms=1500, clutch_enabled=False)
    sm = GestureStateMachine(settings, ActionDispatcher(), GestureTrainer())

    index_up_hand = {
        "handedness": "Right",
        "confidence": 0.95,
        "landmarks": [{"x": 0.5, "y": 0.5, "z": 0.0} for _ in range(21)],
    }
    sm.wake_state = "ACTIVE"
    sm.wake_transition_time = 1000.0
    now = 1000.5

    tel = sm.process_frame([index_up_hand], timestamp=now)
    assert tel["in_grace_period"] is True
    assert tel["action_event"] is None

    tel_after = sm.process_frame([index_up_hand], timestamp=1002.0)
    assert tel_after["in_grace_period"] is False


def test_state_machine_neutral_reset():
    settings = AppSettings(wake_grace_ms=0, clutch_enabled=False, cooldown_ms=300)
    sm = GestureStateMachine(settings, ActionDispatcher(), GestureTrainer())
    sm.wake_state = "ACTIVE"
    sm.wake_transition_time = 0.0

    # Build index pointing up landmarks
    landmarks = [{"x": 0.0, "y": 0.0, "z": 0.0} for _ in range(21)]
    landmarks[5] = {"x": -0.1, "y": -0.3, "z": 0.0}
    landmarks[9] = {"x": 0.0, "y": -0.3, "z": 0.0}
    landmarks[13] = {"x": 0.1, "y": -0.3, "z": 0.0}
    landmarks[17] = {"x": 0.2, "y": -0.3, "z": 0.0}
    landmarks[6] = {"x": -0.1, "y": -0.5, "z": 0.0}
    landmarks[7] = {"x": -0.1, "y": -0.7, "z": 0.0}
    landmarks[8] = {"x": -0.1, "y": -0.9, "z": 0.0}
    landmarks[10] = {"x": 0.0, "y": -0.4, "z": 0.0}
    landmarks[12] = {"x": 0.0, "y": -0.2, "z": 0.0}
    landmarks[14] = {"x": 0.1, "y": -0.4, "z": 0.0}
    landmarks[16] = {"x": 0.1, "y": -0.2, "z": 0.0}
    landmarks[18] = {"x": 0.2, "y": -0.4, "z": 0.0}
    landmarks[20] = {"x": 0.2, "y": -0.2, "z": 0.0}
    landmarks[4] = {"x": -0.2, "y": -0.2, "z": 0.0}

    hand_data = [{"handedness": "Right", "confidence": 0.95, "landmarks": landmarks}]

    # Feed 4 stable frames to fire play_pause
    t = 10.0
    fired_count = 0
    for i in range(4):
        res = sm.process_frame(hand_data, timestamp=t + i * 0.05)
        if res["action_event"]:
            fired_count += 1

    assert fired_count == 1
    assert sm.last_fired_gesture == "play_pause"

    # Continue holding the same pose for another 2 seconds
    # It must NOT repeat-fire!
    for i in range(10):
        res = sm.process_frame(hand_data, timestamp=t + 1.0 + i * 0.1)
        assert res["action_event"] is None


def test_youtube_dispatch_actions():
    dispatcher = ActionDispatcher(target_profile_override="youtube")
    # Verify all YouTube actions dispatch successfully without error
    res_pp = dispatcher.dispatch("play_pause")
    assert res_pp["success"] is True
    assert res_pp["action"] == "play_pause"

    res_next = dispatcher.dispatch("next")
    assert res_next["success"] is True
    assert res_next["action"] == "next"

    res_prev = dispatcher.dispatch("previous")
    assert res_prev["success"] is True
    assert res_prev["action"] == "previous"

    res_vol_up = dispatcher.dispatch("volume_up")
    assert res_vol_up["success"] is True

    res_vol_down = dispatcher.dispatch("volume_down")
    assert res_vol_down["success"] is True

    res_seek = dispatcher.dispatch("seek_delta", {"delta_seconds": 15.0})
    assert res_seek["success"] is True


def test_natural_thumbs_up_gesture():
    # 4 fingers folded, thumb pointing upwards
    lms = [{"x": 0.0, "y": 0.0, "z": 0.0} for _ in range(21)]
    lms[5] = {"x": -0.05, "y": -0.3, "z": 0.0}; lms[8] = {"x": -0.05, "y": -0.25, "z": 0.0}
    lms[9] = {"x": 0.0, "y": -0.3, "z": 0.0}; lms[12] = {"x": 0.0, "y": -0.25, "z": 0.0}
    lms[13] = {"x": 0.05, "y": -0.3, "z": 0.0}; lms[16] = {"x": 0.05, "y": -0.25, "z": 0.0}
    lms[17] = {"x": 0.1, "y": -0.3, "z": 0.0}; lms[20] = {"x": 0.1, "y": -0.25, "z": 0.0}
    lms[6] = {"x": -0.05, "y": -0.38, "z": 0.0}
    lms[10] = {"x": 0.0, "y": -0.38, "z": 0.0}
    lms[14] = {"x": 0.05, "y": -0.38, "z": 0.0}
    lms[18] = {"x": 0.1, "y": -0.38, "z": 0.0}
    lms[1] = {"x": -0.06, "y": -0.1, "z": 0.0}
    lms[2] = {"x": -0.07, "y": -0.2, "z": 0.0}
    lms[3] = {"x": -0.07, "y": -0.35, "z": 0.0}
    lms[4] = {"x": -0.07, "y": -0.50, "z": 0.0}

    from app.tracking.normalizer import normalize_landmarks
    norm, _, _ = normalize_landmarks(lms)
    res = classify_built_in_gesture(norm, "Right")
    assert res.name == "thumbs_up"
    assert res.confidence >= 0.85
