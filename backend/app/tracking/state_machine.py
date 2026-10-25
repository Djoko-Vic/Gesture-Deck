import time
from typing import List, Dict, Any, Optional, Tuple
from .normalizer import normalize_landmarks
from .wave_detector import WaveDetector
from .clutch import ClutchTracker
from .gestures import classify_built_in_gesture, GestureResult
from ..trainer.gesture_trainer import GestureTrainer
from ..actions.dispatcher import ActionDispatcher
from ..config import AppSettings


class GestureStateMachine:
    """
    Central Coordinator for hand gestures:
    - Wake System (Wave to wake, fist to sleep, inactivity timeout)
    - Wake Grace Period (ignores all commands for 1.5s after waking to prevent accidental triggers)
    - Left-hand clutch safety debounce & hysteresis
    - Stability filter & cooldown for right-hand commands
    - Neutral reset: prevents repeat-firing until pose is released for at least 300ms (except volume repeat)
    - Pinch-and-drag scrubbing timeline (release commits seek)
    - Custom gesture ML classification & action dispatch
    """

    def __init__(
        self,
        settings: AppSettings,
        action_dispatcher: ActionDispatcher,
        trainer: GestureTrainer,
    ):
        self.settings = settings
        self.dispatcher = action_dispatcher
        self.trainer = trainer

        # State: SLEEPING or ACTIVE
        self.wake_state: str = "SLEEPING"
        self.last_active_time: float = time.time()
        self.wake_transition_time: float = 0.0
        self.wake_event_pending: Optional[Dict[str, Any]] = None

        # Subsystems
        self.wave_detector = WaveDetector()
        self.clutch_tracker = ClutchTracker(
            clutch_pose=settings.clutch_pose,
            engage_frames=4,
            linger_frames=4,
        )

        # Fist-hold sleep detector
        self.fist_start_time: Optional[float] = None
        self.fist_hold_duration: float = 1.0  # seconds

        # Command debounce, confirm window, and cooldown
        self.candidate_gesture: Optional[str] = None
        self.candidate_frames: int = 0
        self.candidate_start_time: Optional[float] = None
        self.min_candidate_frames: int = 4
        self.last_action_fired_time: float = 0.0
        self.last_global_action_time: float = 0.0
        self.gesture_dropout_count: int = 0

        # Neutral reset tracking
        self.last_fired_gesture: Optional[str] = None
        self.pose_left_time: Optional[float] = None
        self.neutral_reset_delay: float = 0.30  # 300ms leave-pose requirement

        # Volume slow-repeat tracking (every 600ms while held)
        self.volume_last_repeat_time: float = 0.0
        self.volume_repeat_interval: float = 0.60

        # Scrubbing state & Pinch Hysteresis
        self.is_scrubbing: bool = False
        self.is_pinched: bool = False
        self.pinch_candidate_start: Optional[float] = None
        self.pinch_release_start: Optional[float] = None
        self.pinch_dropout_count: int = 0
        self.clutch_lost_start: Optional[float] = None
        self.scrub_anchor_x: float = 0.0
        self.smoothed_drag_x: Optional[float] = None
        self.current_scrub_delta: float = 0.0

        # Action history / last event
        self.last_fired_action: Optional[Dict[str, Any]] = None

    def update_settings(self, settings: AppSettings) -> None:
        self.settings = settings
        self.clutch_tracker.clutch_pose = settings.clutch_pose

    def process_frame(
        self,
        hands_data: List[Dict[str, Any]],
        timestamp: Optional[float] = None,
    ) -> Dict[str, Any]:
        """
        Processes tracked hands for one frame and returns the comprehensive telemetry packet.
        """
        now = timestamp or time.time()
        action_event: Optional[Dict[str, Any]] = None

        # Separate Left and Right hands
        left_hand = None
        right_hand = None

        processed_hands: List[Dict[str, Any]] = []

        for hand in hands_data:
            handedness = hand.get("handedness", "Right")
            raw_lms = hand.get("landmarks", [])
            norm_lms, palm_scale, flat_features = normalize_landmarks(raw_lms)

            hand_dict = {
                "handedness": handedness,
                "confidence": hand.get("confidence", 0.9),
                "landmarks": raw_lms,
                "norm_landmarks": norm_lms,
                "palm_scale": round(palm_scale, 4),
                "flat_features": flat_features,
            }
            processed_hands.append(hand_dict)

            if handedness == "Left":
                left_hand = hand_dict
            else:
                right_hand = hand_dict

        # If only 1 hand detected and labeled Left, but no Right hand,
        # allow it to drive wake wave or gestures if clutch is disabled
        primary_hand = right_hand or (left_hand if not self.settings.clutch_enabled else None)

        # -------------------------------------------------------------
        # 1. Update Left-Hand Clutch
        # -------------------------------------------------------------
        clutch_status = self.clutch_tracker.update(
            left_hand["norm_landmarks"] if left_hand else None,
            handedness="Left",
        )
        is_clutch_engaged = clutch_status["is_engaged"]

        # -------------------------------------------------------------
        # 2. Wave Detection (Can wake from either hand)
        # -------------------------------------------------------------
        eval_hand = primary_hand or left_hand
        wave_detected = False
        if eval_hand:
            wave_detected, wave_stats = self.wave_detector.update(
                eval_hand["landmarks"],
                eval_hand["norm_landmarks"],
                handedness=eval_hand["handedness"],
                timestamp=now,
            )

        # -------------------------------------------------------------
        # 3. Wake State Machine Transitions
        # -------------------------------------------------------------
        if self.wake_state == "SLEEPING":
            if wave_detected:
                self.wake_state = "ACTIVE"
                self.last_active_time = now
                self.wake_transition_time = now  # Start wake grace period
                self.last_fired_gesture = None
                self.pose_left_time = now
                action_event = {
                    "type": "wake_state",
                    "state": "ACTIVE",
                    "reason": "wave",
                    "timestamp": now,
                }
                self.last_fired_action = action_event
        elif self.wake_state == "ACTIVE":
            # Check Inactivity Timeout
            elapsed_inactive = now - self.last_active_time
            if elapsed_inactive >= self.settings.inactivity_timeout:
                self.wake_state = "SLEEPING"
                action_event = {
                    "type": "wake_state",
                    "state": "SLEEPING",
                    "reason": "timeout",
                    "timestamp": now,
                }
                self.last_fired_action = action_event

        # Check Wake Grace Period
        wake_grace_sec = self.settings.wake_grace_ms / 1000.0
        in_grace_period = (now - self.wake_transition_time) < wake_grace_sec

        # -------------------------------------------------------------
        # 4. Gesture Evaluation (Right Hand / Primary Hand)
        # -------------------------------------------------------------
        detected_gesture = "none"
        confidence = 0.0
        is_pinch = False
        pinch_distance = 1.0

        if primary_hand and self.wake_state == "ACTIVE":
            norm_lms = primary_hand["norm_landmarks"]
            raw_lms = primary_hand["landmarks"]
            flat_features = primary_hand["flat_features"]

            # Step 4a: Check Built-In Gestures
            g_res: GestureResult = classify_built_in_gesture(norm_lms, handedness=primary_hand["handedness"])
            detected_gesture = g_res.name
            confidence = g_res.confidence
            is_pinch = g_res.is_pinch
            pinch_distance = g_res.pinch_distance

            # If recording active in trainer, feed sample
            if self.trainer.is_recording and len(flat_features) == 63:
                self.trainer.add_recording_sample(flat_features)

            # Step 4b: Fist Held -> Sleep condition
            if detected_gesture == "fist":
                if self.fist_start_time is None:
                    self.fist_start_time = now
                elif (now - self.fist_start_time) >= self.fist_hold_duration:
                    self.wake_state = "SLEEPING"
                    self.fist_start_time = None
                    action_event = {
                        "type": "wake_state",
                        "state": "SLEEPING",
                        "reason": "fist_hold",
                        "timestamp": now,
                    }
                    self.last_fired_action = action_event
            else:
                self.fist_start_time = None

            # Step 4c: Timeline Scrubbing with Pinch Hysteresis, Smoothing & Deadzone
            pinch_on = getattr(self.settings, "pinch_on", 0.40)
            pinch_off = getattr(self.settings, "pinch_off", 0.55)
            pinch_confirm_sec = getattr(self.settings, "pinch_confirm_ms", 100) / 1000.0
            pinch_release_sec = getattr(self.settings, "pinch_release_ms", 120) / 1000.0

            if pinch_distance <= pinch_on:
                self.pinch_release_start = None
                if not self.is_pinched:
                    if self.pinch_candidate_start is None:
                        self.pinch_candidate_start = now
                    elif (now - self.pinch_candidate_start) >= pinch_confirm_sec:
                        self.is_pinched = True
                        self.pinch_candidate_start = None
                        self.pinch_dropout_count = 0
                else:
                    self.pinch_dropout_count = 0
            elif pinch_distance >= pinch_off:
                self.pinch_candidate_start = None
                if self.is_pinched:
                    if self.pinch_release_start is None:
                        self.pinch_release_start = now
                    elif (now - self.pinch_release_start) >= pinch_release_sec:
                        self.is_pinched = False
                        self.pinch_release_start = None
            else:
                # Inside hysteresis gap: maintain current state
                self.pinch_candidate_start = None
                self.pinch_release_start = None
                self.pinch_dropout_count = 0

            is_pinch = self.is_pinched

            # Clutch dropout grace handling (500ms tolerance if clutch drops mid-drag)
            clutch_dropout_sec = 0.50
            if is_clutch_engaged:
                self.clutch_lost_start = None
                clutch_effective = True
            else:
                if self.is_scrubbing:
                    if self.clutch_lost_start is None:
                        self.clutch_lost_start = now
                    clutch_effective = (now - self.clutch_lost_start) <= clutch_dropout_sec
                else:
                    clutch_effective = False

            clutch_allows_scrub = clutch_effective or not self.settings.clutch_enabled
            wrist_x = raw_lms[0].get("x", 0.5)

            if is_pinch and clutch_allows_scrub and not in_grace_period:
                if not self.is_scrubbing:
                    # Pinch grab initiation: record anchor
                    self.is_scrubbing = True
                    self.scrub_anchor_x = wrist_x
                    self.smoothed_drag_x = wrist_x
                    self.current_scrub_delta = 0.0
                else:
                    # Active drag with exponential smoothing
                    alpha = getattr(self.settings, "drag_smoothing", 0.30)
                    self.smoothed_drag_x = alpha * wrist_x + (1.0 - alpha) * (self.smoothed_drag_x if self.smoothed_drag_x is not None else wrist_x)
                    raw_delta_x = self.smoothed_drag_x - self.scrub_anchor_x

                    # Deadzone filter
                    deadzone = getattr(self.settings, "drag_deadzone", 0.02)
                    if abs(raw_delta_x) <= deadzone:
                        self.current_scrub_delta = 0.0
                    else:
                        sign = 1.0 if raw_delta_x > 0 else -1.0
                        mag = abs(raw_delta_x) - deadzone
                        # Non-linear easing curve for fine control near center
                        norm = min(1.0, mag / 0.35)
                        curved = (norm ** 1.3)
                        max_range = getattr(self.settings, "scrub_range_seconds", 60.0)
                        self.current_scrub_delta = round(sign * curved * max_range * self.settings.scrub_sensitivity, 1)

                self.last_active_time = now
            else:
                if self.is_scrubbing:
                    # Pinch Released -> Commit Seek Action!
                    # Releasing fingers (even opening palm) should commit the seek
                    is_cancel = (primary_hand is None)
                    if not is_cancel and abs(self.current_scrub_delta) >= 1.0:
                        disp_res = self.dispatcher.dispatch(
                            "seek_delta",
                            {"delta_seconds": self.current_scrub_delta},
                        )
                        action_event = disp_res
                        self.last_fired_action = disp_res
                        self.last_active_time = now
                    self.is_scrubbing = False
                    self.current_scrub_delta = 0.0
                    self.smoothed_drag_x = None

            # Step 4d: If built-in gesture is none or unknown, test Custom ML Model
            if detected_gesture in ("none", "unknown") and self.trainer.model is not None:
                ml_label, ml_conf = self.trainer.predict(flat_features)
                if ml_label != "unknown":
                    detected_gesture = ml_label
                    confidence = ml_conf

            # ---------------------------------------------------------
            # Step 4e: Neutral Reset Tracking with Configurable Release
            # ---------------------------------------------------------
            release_sec = getattr(self.settings, "release_ms", 300) / 1000.0
            if detected_gesture != self.last_fired_gesture:
                if self.pose_left_time is None:
                    self.pose_left_time = now
                elif (now - self.pose_left_time) >= release_sec:
                    # Hand has left previous pose for >= release_ms; reset neutral lock
                    self.last_fired_gesture = None
            else:
                self.pose_left_time = None

            # ---------------------------------------------------------
            # Step 4f: Gesture Stability, Confirm Window & Cooldown
            # ---------------------------------------------------------
            clutch_allows_action = is_clutch_engaged if self.settings.clutch_enabled else True
            is_actionable = detected_gesture not in ("none", "fist", "pinch", "open_palm", "peace_up")

            confirm_progress = 0.0

            if is_actionable and not self.is_scrubbing and not in_grace_period:
                if detected_gesture == self.candidate_gesture:
                    self.candidate_frames += 1
                    if self.candidate_start_time is None:
                        self.candidate_start_time = now
                else:
                    self.candidate_gesture = detected_gesture
                    self.candidate_frames = 1
                    self.candidate_start_time = now

                # Per-action confirm window target
                base_confirm_ms = getattr(self.settings, "confirm_ms", 250)
                if detected_gesture in ("thumbs_up", "thumbs_down"):
                    target_confirm_ms = min(base_confirm_ms, 180)
                else:
                    target_confirm_ms = base_confirm_ms

                held_time_ms = (now - self.candidate_start_time) * 1000.0
                confirm_progress = min(1.0, held_time_ms / max(50.0, float(target_confirm_ms)))

                # Cooldown per action
                if detected_gesture in ("thumbs_up", "thumbs_down"):
                    cooldown_sec = 0.50
                else:
                    cooldown_sec = max(0.4, self.settings.cooldown_ms / 1000.0)

                # Global lockout check
                global_lockout_sec = getattr(self.settings, "global_lockout_ms", 400) / 1000.0
                is_globally_unlocked = (now - self.last_global_action_time) >= global_lockout_sec

                is_volume_action = detected_gesture in ("thumbs_up", "thumbs_down")
                has_confirmed = (held_time_ms >= target_confirm_ms) or (self.candidate_frames >= 4 and held_time_ms >= 140.0)

                if is_volume_action:
                    # Volume can repeat slowly (~600ms) while held
                    can_fire = (
                        has_confirmed
                        and (now - self.volume_last_repeat_time) >= self.volume_repeat_interval
                        and clutch_allows_action
                        and is_globally_unlocked
                    )
                else:
                    # Non-volume actions require neutral reset (must have left pose)
                    is_neutral_cleared = (self.last_fired_gesture is None)
                    can_fire = (
                        has_confirmed
                        and (now - self.last_action_fired_time) >= cooldown_sec
                        and is_neutral_cleared
                        and clutch_allows_action
                        and is_globally_unlocked
                    )

                if can_fire:
                    self.last_action_fired_time = now
                    self.last_global_action_time = now
                    self.last_active_time = now  # Reset inactivity timeout
                    self.last_fired_gesture = detected_gesture
                    self.pose_left_time = None
                    self.candidate_start_time = None
                    confirm_progress = 0.0

                    if is_volume_action:
                        self.volume_last_repeat_time = now

                    # Resolve action name
                    action_name = self._resolve_action(detected_gesture)
                    if action_name and action_name != "none":
                        disp_res = self.dispatcher.dispatch(action_name)
                        action_event = disp_res
                        self.last_fired_action = disp_res
            else:
                if not self.is_scrubbing and detected_gesture != "fist":
                    self.candidate_gesture = None
                    self.candidate_frames = 0
                    self.candidate_start_time = None
        else:
            self.fist_start_time = None
            self.candidate_gesture = None
            self.candidate_frames = 0
            self.candidate_start_time = None
            confirm_progress = 0.0
            if self.is_scrubbing:
                self.is_scrubbing = False
                self.current_scrub_delta = 0.0
                self.smoothed_drag_x = None

        # Calculate remaining inactivity timeout in seconds
        timeout_rem = max(0.0, self.settings.inactivity_timeout - (now - self.last_active_time))
        if self.wake_state == "SLEEPING":
            timeout_rem = 0.0

        ctx = self.dispatcher.get_context()

        return {
            "type": "telemetry",
            "wake_state": self.wake_state,
            "in_grace_period": in_grace_period,
            "timeout_remaining": round(timeout_rem, 1),
            "active_gesture": detected_gesture,
            "confidence": round(confidence, 2),
            "confirm_progress": round(confirm_progress, 2),
            "is_pinch": is_pinch,
            "pinch_distance": round(pinch_distance, 3),
            "pinch": {
                "is_pinched": self.is_pinched,
                "distance": round(pinch_distance, 3),
                "pinch_on": getattr(self.settings, "pinch_on", 0.40),
                "pinch_off": getattr(self.settings, "pinch_off", 0.55),
            },
            "clutch": {
                "enabled": self.settings.clutch_enabled,
                "is_engaged": is_clutch_engaged,
                "pose": clutch_status.get("pose", "none"),
                "target_pose": self.settings.clutch_pose,
            },
            "scrub": {
                "is_scrubbing": self.is_scrubbing,
                "delta_seconds": round(self.current_scrub_delta, 1),
                "anchor_x": round(self.scrub_anchor_x, 3),
                "smoothed_x": round(self.smoothed_drag_x or 0.0, 3),
            },
            "context": {
                "active_profile": ctx.get("profile", "generic"),
                "window_title": ctx.get("window_title", "Desktop"),
                "target_profile": ctx.get("target_profile_override", "auto"),
                "selected_target_id": ctx.get("selected_target_id", "auto"),
                "available_targets": ctx.get("available_targets", []),
                "media_detection_enabled": ctx.get("media_detection_enabled", False),
            },
            "hands": processed_hands,
            "action_event": action_event,
            "timestamp": now,
        }


    def _resolve_action(self, gesture: str) -> Optional[str]:
        """Maps gesture name to action key."""
        # Check custom mappings first
        if gesture in self.trainer.mappings:
            return self.trainer.mappings[gesture].get("action")

        # Built-in gesture mappings per specification
        built_in_maps = {
            "play_pause": "play_pause",
            "next": "next",
            "previous": "previous",
            "thumbs_up": "volume_up",
            "thumbs_down": "volume_down",
        }
        return built_in_maps.get(gesture)
