import math
from typing import List, Dict, Optional, Tuple
from .finger_detector import detect_finger_states, FingerStates
from .normalizer import euclidean_distance


class GestureResult:
    def __init__(
        self,
        name: str,
        confidence: float,
        is_pinch: bool = False,
        pinch_distance: float = 1.0,
        finger_states: Optional[FingerStates] = None,
        details: Optional[Dict[str, any]] = None,
    ):
        self.name = name
        self.confidence = confidence
        self.is_pinch = is_pinch
        self.pinch_distance = pinch_distance
        self.finger_states = finger_states
        self.details = details or {}

    def to_dict(self) -> Dict[str, any]:
        return {
            "name": self.name,
            "confidence": round(self.confidence, 2),
            "is_pinch": self.is_pinch,
            "pinch_distance": round(self.pinch_distance, 3),
            "finger_states": self.finger_states.as_list() if self.finger_states else [],
            "details": self.details,
        }


def classify_built_in_gesture(
    norm_landmarks: List[Dict[str, float]],
    handedness: str = "Right",
    pinch_threshold: float = 0.40,
) -> GestureResult:
    """
    Classifies right-hand normalized landmarks per GestureDeck specification:
    - play_pause: Index finger ONLY extended, pointing UP (middle, ring, pinky folded, thumb relaxed).
    - next: Index + middle extended & held together, pointing RIGHT from user's POV (within 30 deg of x-axis).
    - previous: Index + middle extended & held together, pointing LEFT from user's POV (within 30 deg of x-axis).
    - thumbs_up / thumbs_down: Thumb extended, 4 fingers folded, pointing up/down.
    - fist: Closed fist (held for 1s puts controller to sleep).
    - open_palm: Neutral pose with NO ACTION (safe to hold after waving).
    - peace_up: Normal peace sign pointing up does NOTHING.
    Also computes pinch distance (thumb tip 4 to index tip 8).
    """
    if not norm_landmarks or len(norm_landmarks) < 21:
        return GestureResult(name="none", confidence=0.0)

    finger_states, details = detect_finger_states(norm_landmarks, handedness)
    extended_count = finger_states.count_extended()

    # Calculate pinch distance (Thumb tip 4 to Index tip 8)
    thumb_tip = norm_landmarks[4]
    index_tip = norm_landmarks[8]
    pinch_dist = euclidean_distance(thumb_tip, index_tip)
    is_pinch = pinch_dist < pinch_threshold

    # Calculate thumb orientation for thumbs up / thumbs down
    wrist = norm_landmarks[0]
    thumb_mcp = norm_landmarks[2]
    # In normalized space: negative Y is towards top of frame, positive Y is downwards
    thumb_dy = thumb_tip.get("y", 0.0) - thumb_mcp.get("y", 0.0)

    # 1. Thumbs Up: 4 fingers folded, thumb pointing upwards (dy < -0.18 or thumb tip well above wrist)
    if (
        not finger_states.index
        and not finger_states.middle
        and not finger_states.ring
        and not finger_states.pinky
        and (thumb_dy < -0.18 or (thumb_tip.get("y", 0.0) - wrist.get("y", 0.0)) < -0.30)
    ):
        confidence = min(1.0, 0.85 + abs(thumb_dy) * 0.3)
        return GestureResult(
            name="thumbs_up",
            confidence=confidence,
            is_pinch=is_pinch,
            pinch_distance=pinch_dist,
            finger_states=finger_states,
            details={"thumb_dy": round(thumb_dy, 3)},
        )

    # 2. Thumbs Down: 4 fingers folded, thumb pointing downwards (dy > 0.18)
    if (
        not finger_states.index
        and not finger_states.middle
        and not finger_states.ring
        and not finger_states.pinky
        and (thumb_dy > 0.18 or (thumb_tip.get("y", 0.0) - wrist.get("y", 0.0)) > 0.15)
    ):
        confidence = min(1.0, 0.85 + abs(thumb_dy) * 0.3)
        return GestureResult(
            name="thumbs_down",
            confidence=confidence,
            is_pinch=is_pinch,
            pinch_distance=pinch_dist,
            finger_states=finger_states,
            details={"thumb_dy": round(thumb_dy, 3)},
        )

    # 3. Closed Fist: all fingers folded (extended_count == 0 or 4 fingers folded with thumb neutral)
    if (
        extended_count == 0
        or (
            not finger_states.index
            and not finger_states.middle
            and not finger_states.ring
            and not finger_states.pinky
            and -0.18 <= thumb_dy <= 0.18
        )
    ):
        return GestureResult(
            name="fist",
            confidence=0.95,
            is_pinch=is_pinch,
            pinch_distance=pinch_dist,
            finger_states=finger_states,
        )

    # 4. Play/Pause: Index finger ONLY extended, pointing UP (middle, ring, pinky folded, thumb relaxed)
    index_mcp = norm_landmarks[5]
    index_dx = index_tip.get("x", 0.0) - index_mcp.get("x", 0.0)
    index_dy = index_tip.get("y", 0.0) - index_mcp.get("y", 0.0)

    if (
        finger_states.index
        and not finger_states.middle
        and not finger_states.ring
        and not finger_states.pinky
        and index_dy < -0.20
        and abs(index_dx) < 0.40
    ):
        confidence = min(1.0, 0.85 + abs(index_dy) * 0.3)
        return GestureResult(
            name="play_pause",
            confidence=confidence,
            is_pinch=is_pinch,
            pinch_distance=pinch_dist,
            finger_states=finger_states,
            details={"index_dy": round(index_dy, 3), "index_dx": round(index_dx, 3)},
        )

    # 5. Next Track: Peace sign (Index + Middle extended pointing generally UP, Ring & Pinky folded)
    if (
        finger_states.index
        and finger_states.middle
        and not finger_states.ring
        and not finger_states.pinky
        and index_dy < -0.10
    ):
        return GestureResult(
            name="next",
            confidence=0.95,
            is_pinch=is_pinch,
            pinch_distance=pinch_dist,
            finger_states=finger_states,
            details={"gesture": "peace_sign_next", "index_dy": round(index_dy, 3)},
        )

    # 6. Previous Track: Three fingers (Index + Middle + Ring extended pointing generally UP, Pinky folded)
    if (
        finger_states.index
        and finger_states.middle
        and finger_states.ring
        and not finger_states.pinky
        and index_dy < -0.10
    ):
        return GestureResult(
            name="previous",
            confidence=0.95,
            is_pinch=is_pinch,
            pinch_distance=pinch_dist,
            finger_states=finger_states,
            details={"gesture": "three_fingers_previous", "index_dy": round(index_dy, 3)},
        )


    # 6. Open Palm: all fingers extended. Neutral pose with NO ACTION (safe to hold after waving)
    if (
        finger_states.index
        and finger_states.middle
        and finger_states.ring
        and finger_states.pinky
        and not is_pinch
    ):
        conf = 0.95 if finger_states.thumb else 0.85
        return GestureResult(
            name="open_palm",
            confidence=conf,
            is_pinch=is_pinch,
            pinch_distance=pinch_dist,
            finger_states=finger_states,
            details={"neutral": True},
        )

    # 7. Fallback Pinch
    if is_pinch:
        return GestureResult(
            name="pinch",
            confidence=0.88,
            is_pinch=True,
            pinch_distance=pinch_dist,
            finger_states=finger_states,
        )

    return GestureResult(
        name="none",
        confidence=0.3,
        is_pinch=is_pinch,
        pinch_distance=pinch_dist,
        finger_states=finger_states,
    )
