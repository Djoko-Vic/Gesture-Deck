from typing import List, Dict, Optional
from .finger_detector import detect_finger_states
from .gestures import classify_built_in_gesture


class ClutchTracker:
    """
    Tracks safety clutch state on the designated clutch hand (default Left Hand).
    
    Features:
    - N-frame consecutive hold required to ENGAGE (default: 4 frames).
    - M-frame hysteresis linger before DISENGAGE (default: 4 frames).
    - Supports configurable clutch pose ('open_palm' or 'fist').
    - Risky actions (timeline scrubbing) always enforce clutch engagement.
    """

    def __init__(
        self,
        clutch_pose: str = "open_palm",
        engage_frames: int = 4,
        linger_frames: int = 4,
    ):
        self.clutch_pose = clutch_pose
        self.engage_frames = engage_frames
        self.linger_frames = linger_frames

        self.consecutive_hits: int = 0
        self.remaining_linger: int = 0
        self.is_engaged: bool = False

    def reset(self) -> None:
        self.consecutive_hits = 0
        self.remaining_linger = 0
        self.is_engaged = False

    def update(
        self,
        norm_landmarks: Optional[List[Dict[str, float]]],
        handedness: str = "Left",
    ) -> Dict[str, any]:
        """
        Process clutch hand landmarks for the current frame.
        Returns clutch status dictionary.
        """
        if not norm_landmarks or len(norm_landmarks) < 21:
            # Clutch hand not visible in frame
            return self._handle_miss()

        # Classify clutch pose
        gesture_res = classify_built_in_gesture(norm_landmarks, handedness=handedness)
        current_pose = gesture_res.name

        pose_matches = False
        if self.clutch_pose == "open_palm":
            pose_matches = current_pose == "open_palm"
        elif self.clutch_pose == "fist":
            pose_matches = current_pose == "fist"
        else:
            pose_matches = current_pose == self.clutch_pose

        if pose_matches:
            self.consecutive_hits += 1
            if self.consecutive_hits >= self.engage_frames:
                self.is_engaged = True
                self.remaining_linger = self.linger_frames
        else:
            return self._handle_miss()

        return {
            "is_engaged": self.is_engaged,
            "pose": current_pose,
            "target_pose": self.clutch_pose,
            "consecutive_hits": self.consecutive_hits,
            "linger_remaining": self.remaining_linger,
        }

    def _handle_miss(self) -> Dict[str, any]:
        self.consecutive_hits = 0
        if self.remaining_linger > 0:
            self.remaining_linger -= 1
            self.is_engaged = True  # Still lingering
        else:
            self.is_engaged = False

        return {
            "is_engaged": self.is_engaged,
            "pose": "none",
            "target_pose": self.clutch_pose,
            "consecutive_hits": 0,
            "linger_remaining": self.remaining_linger,
        }
