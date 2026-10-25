import time
import math
from typing import List, Dict, Any, Tuple


class SyntheticHandGenerator:
    """
    Generates synthetic 21-landmark hand data for testing when no physical webcam
    is available or when mock_camera mode is active.
    Cycles through wake-wave, index-pointing-up (play/pause), horizontal-two-fingers (next),
    and pinch-and-drag.
    """

    def __init__(self):
        self.start_time = time.time()

    def get_frame(self) -> List[Dict[str, Any]]:
        t = time.time() - self.start_time
        hands = []

        # Cycle through modes every 10 seconds:
        # 0-3s: Wave (left-right oscillation of open palm to wake)
        # 3-5.5s: Index Pointing Up (Play / Pause)
        # 5.5-8.0s: Two fingers horizontal right (Next Track)
        # 8.0-10s: Pinch and drag
        phase = t % 10.0

        # Base wrist position (screen center-right)
        base_x = 0.65
        base_y = 0.60
        base_z = -0.1

        active_gesture = "open_palm"
        pinch_active = False

        if phase < 3.0:
            # Waving motion: sinusoidal oscillation
            wave_offset = 0.12 * math.sin(t * 8.0)
            base_x += wave_offset
            active_gesture = "open_palm"
        elif 3.0 <= phase < 5.5:
            # Index pointing up (Play / Pause)
            active_gesture = "play_pause"
        elif 5.5 <= phase < 8.0:
            # Two fingers pointing to the right (Next Track)
            active_gesture = "next"
        else:
            # Pinch and drag
            pinch_active = True
            active_gesture = "pinch"
            base_x += 0.08 * math.sin((phase - 8.0) * math.pi)

        right_landmarks = self._generate_hand_landmarks(
            wrist_x=base_x,
            wrist_y=base_y,
            wrist_z=base_z,
            gesture=active_gesture,
            is_right=True,
            pinch_active=pinch_active,
        )

        hands.append({
            "handedness": "Right",
            "confidence": 0.96,
            "landmarks": right_landmarks,
        })

        # Hand 2: Left Hand (Clutch Hand - holds open palm in bottom-left)
        left_landmarks = self._generate_hand_landmarks(
            wrist_x=0.25 + 0.02 * math.sin(t * 1.5),
            wrist_y=0.65,
            wrist_z=-0.1,
            gesture="open_palm",
            is_right=False,
            pinch_active=False,
        )

        hands.append({
            "handedness": "Left",
            "confidence": 0.94,
            "landmarks": left_landmarks,
        })

        return hands

    def _generate_hand_landmarks(
        self,
        wrist_x: float,
        wrist_y: float,
        wrist_z: float,
        gesture: str,
        is_right: bool = True,
        pinch_active: bool = False,
    ) -> List[Dict[str, float]]:
        sign = 1.0 if is_right else -1.0

        # 0: Wrist
        lms: List[Dict[str, float]] = [{"x": wrist_x, "y": wrist_y, "z": wrist_z}]

        # Thumb (1-4)
        t_curl = 0.0 if gesture in ("open_palm", "thumbs_up") else 0.08
        lms.append({"x": wrist_x - 0.04 * sign, "y": wrist_y - 0.04, "z": wrist_z})
        lms.append({"x": wrist_x - 0.08 * sign, "y": wrist_y - 0.08, "z": wrist_z})
        lms.append({"x": wrist_x - 0.11 * sign + t_curl, "y": wrist_y - 0.12, "z": wrist_z})
        if pinch_active:
            # Pinch thumb to index tip
            lms.append({"x": wrist_x - 0.02 * sign, "y": wrist_y - 0.20, "z": wrist_z})
        else:
            lms.append({"x": wrist_x - 0.14 * sign + t_curl, "y": wrist_y - 0.15, "z": wrist_z})

        # Index (5-8)
        # If gesture is 'next', index points horizontal right (+x)
        if gesture == "next":
            lms.append({"x": wrist_x + 0.05 * sign, "y": wrist_y - 0.06, "z": wrist_z})
            lms.append({"x": wrist_x + 0.12 * sign, "y": wrist_y - 0.06, "z": wrist_z})
            lms.append({"x": wrist_x + 0.18 * sign, "y": wrist_y - 0.06, "z": wrist_z})
            lms.append({"x": wrist_x + 0.25 * sign, "y": wrist_y - 0.06, "z": wrist_z})
        else:
            idx_folded = gesture in ("thumbs_up", "thumbs_down", "fist")
            idx_y_offset = 0.08 if idx_folded else 0.0
            lms.append({"x": wrist_x - 0.04 * sign, "y": wrist_y - 0.12, "z": wrist_z})
            lms.append({"x": wrist_x - 0.03 * sign, "y": wrist_y - 0.17 + idx_y_offset * 0.5, "z": wrist_z})
            lms.append({"x": wrist_x - 0.02 * sign, "y": wrist_y - 0.21 + idx_y_offset * 0.8, "z": wrist_z})
            if pinch_active:
                lms.append({"x": wrist_x - 0.015 * sign, "y": wrist_y - 0.20, "z": wrist_z})
            else:
                lms.append({"x": wrist_x - 0.02 * sign, "y": wrist_y - 0.25 + idx_y_offset, "z": wrist_z})

        # Middle (9-12)
        if gesture == "next":
            # Middle finger extended parallel to index pointing right
            lms.append({"x": wrist_x + 0.05 * sign, "y": wrist_y - 0.03, "z": wrist_z})
            lms.append({"x": wrist_x + 0.12 * sign, "y": wrist_y - 0.03, "z": wrist_z})
            lms.append({"x": wrist_x + 0.18 * sign, "y": wrist_y - 0.03, "z": wrist_z})
            lms.append({"x": wrist_x + 0.25 * sign, "y": wrist_y - 0.03, "z": wrist_z})
        else:
            mid_folded = gesture in ("play_pause", "thumbs_up", "thumbs_down", "fist")
            mid_y_offset = 0.09 if mid_folded else 0.0
            lms.append({"x": wrist_x, "y": wrist_y - 0.13, "z": wrist_z})
            lms.append({"x": wrist_x, "y": wrist_y - 0.18 + mid_y_offset * 0.5, "z": wrist_z})
            lms.append({"x": wrist_x, "y": wrist_y - 0.23 + mid_y_offset * 0.8, "z": wrist_z})
            lms.append({"x": wrist_x, "y": wrist_y - 0.27 + mid_y_offset, "z": wrist_z})

        # Ring (13-16) - folded for play_pause, next, pinch, fist
        ring_folded = gesture in ("play_pause", "next", "thumbs_up", "thumbs_down", "fist", "pinch")
        ring_y_offset = 0.09 if ring_folded else 0.0
        lms.append({"x": wrist_x + 0.04 * sign, "y": wrist_y - 0.12, "z": wrist_z})
        lms.append({"x": wrist_x + 0.04 * sign, "y": wrist_y - 0.17 + ring_y_offset * 0.5, "z": wrist_z})
        lms.append({"x": wrist_x + 0.04 * sign, "y": wrist_y - 0.21 + ring_y_offset * 0.8, "z": wrist_z})
        lms.append({"x": wrist_x + 0.04 * sign, "y": wrist_y - 0.24 + ring_y_offset, "z": wrist_z})

        # Pinky (17-20) - folded for play_pause, next, pinch, fist
        pky_folded = gesture in ("play_pause", "next", "thumbs_up", "thumbs_down", "fist", "pinch")
        pky_y_offset = 0.08 if pky_folded else 0.0
        lms.append({"x": wrist_x + 0.07 * sign, "y": wrist_y - 0.10, "z": wrist_z})
        lms.append({"x": wrist_x + 0.08 * sign, "y": wrist_y - 0.14 + pky_y_offset * 0.5, "z": wrist_z})
        lms.append({"x": wrist_x + 0.09 * sign, "y": wrist_y - 0.18 + pky_y_offset * 0.8, "z": wrist_z})
        lms.append({"x": wrist_x + 0.10 * sign, "y": wrist_y - 0.21 + pky_y_offset, "z": wrist_z})

        return lms
