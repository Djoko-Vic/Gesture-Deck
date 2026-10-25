import time
from collections import deque
from typing import List, Dict, Tuple, Optional
from .finger_detector import detect_finger_states


class WaveDetector:
    """
    Detects a waving hand gesture:
    1. Tracks wrist X positions over a rolling ~1.0 second buffer (default 30 frames).
    2. Identifies directional reversals (peaks and valleys in X motion).
    3. Requires at least 3 reversals with a minimum amplitude threshold.
    4. Requires an open palm facing the camera.
    """

    def __init__(
        self,
        buffer_size: int = 30,
        min_reversals: int = 3,
        min_amplitude: float = 0.07,  # normalized frame width (0.0 to 1.0)
        min_open_fingers: int = 4,    # At least 4 extended fingers (open palm)
    ):
        self.buffer_size = buffer_size
        self.min_reversals = min_reversals
        self.min_amplitude = min_amplitude
        self.min_open_fingers = min_open_fingers

        # Deque of (timestamp, wrist_x, palm_open)
        self.history: deque = deque(maxlen=buffer_size)
        self.last_wave_time: float = 0.0
        self.wave_cooldown: float = 1.5  # Seconds between wave triggers

    def reset(self) -> None:
        self.history.clear()

    def update(
        self,
        raw_landmarks: List[Dict[str, float]],
        norm_landmarks: List[Dict[str, float]],
        handedness: str = "Right",
        timestamp: Optional[float] = None,
    ) -> Tuple[bool, Dict[str, any]]:
        """
        Feed a new frame into the wave detector.
        Returns (is_wave_detected, stats_dict)
        """
        if timestamp is None:
            timestamp = time.time()

        if not raw_landmarks or len(raw_landmarks) < 21:
            # When hand is missing, decay history
            if len(self.history) > 0 and (timestamp - self.history[-1][0]) > 0.5:
                self.history.clear()
            return False, {"reversals": 0, "amplitude": 0.0, "is_open": False}

        wrist_x = raw_landmarks[0].get("x", 0.5)

        # Check if hand has open palm
        finger_states, details = detect_finger_states(norm_landmarks, handedness)
        extended_count = finger_states.count_extended()
        is_open = extended_count >= self.min_open_fingers and details.get("palm_facing_camera", True)

        self.history.append((timestamp, wrist_x, is_open))

        # Need at least half buffer to evaluate wave pattern (~0.5s of tracking)
        if len(self.history) < 12:
            return False, {"reversals": 0, "amplitude": 0.0, "is_open": is_open}

        # Check time span of history; trim samples older than 1.2 seconds
        now = timestamp
        while len(self.history) > 0 and (now - self.history[0][0]) > 1.2:
            self.history.popleft()

        if len(self.history) < 12:
            return False, {"reversals": 0, "amplitude": 0.0, "is_open": is_open}

        # Check proportion of frames where palm was open
        open_ratio = sum(1 for _, _, open_flag in self.history if open_flag) / len(self.history)
        if open_ratio < 0.65:
            return False, {"reversals": 0, "amplitude": 0.0, "is_open": is_open, "open_ratio": round(open_ratio, 2)}

        # Extract X sequence and compute velocity signs
        x_vals = [x for _, x, _ in self.history]
        dx_vals = [x_vals[i] - x_vals[i - 1] for i in range(1, len(x_vals))]

        # Filter noise with simple deadzone
        deadzone = 0.005
        filtered_signs = []
        for dx in dx_vals:
            if dx > deadzone:
                filtered_signs.append(1)
            elif dx < -deadzone:
                filtered_signs.append(-1)

        if len(filtered_signs) < 4:
            return False, {"reversals": 0, "amplitude": 0.0, "is_open": is_open}

        # Count sign reversals (direction changes)
        reversals = 0
        last_sign = filtered_signs[0]
        reversal_points = [x_vals[0]]

        for i in range(1, len(filtered_signs)):
            if filtered_signs[i] != last_sign:
                reversals += 1
                last_sign = filtered_signs[i]
                reversal_points.append(x_vals[i])
        reversal_points.append(x_vals[-1])

        # Calculate peak-to-peak amplitude
        amplitude = max(x_vals) - min(x_vals)

        stats = {
            "reversals": reversals,
            "amplitude": round(amplitude, 3),
            "is_open": is_open,
            "open_ratio": round(open_ratio, 2),
        }

        # Evaluate wave trigger condition
        if (
            reversals >= self.min_reversals
            and amplitude >= self.min_amplitude
            and (now - self.last_wave_time) > self.wave_cooldown
        ):
            self.last_wave_time = now
            self.history.clear()  # reset after successful trigger
            return True, stats

        return False, stats
