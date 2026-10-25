import os
import time
import threading
import asyncio
from pathlib import Path
from typing import Optional, List, Dict, Any
import cv2
import numpy as np

import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision

from .state_machine import GestureStateMachine
from .mock_camera import SyntheticHandGenerator
from ..ws_manager import ConnectionManager
from ..config import AppSettings

MODEL_PATH = Path(__file__).resolve().parent.parent / "models" / "hand_landmarker.task"


class HandTrackerPipeline:
    """
    High-Performance Background Tracking Pipeline:
    - Runs on a dedicated OS worker thread at target 30 FPS.
    - Handles physical webcam capture or falls back to synthetic mock hand generator.
    - Mirrors webcam frames for intuitive user experience.
    - Rectifies handedness labels to match physical anatomy.
    - Runs GestureStateMachine and broadcasts telemetry over WebSocket without blocking async loop.
    """

    def __init__(
        self,
        settings: AppSettings,
        state_machine: GestureStateMachine,
        ws_manager: ConnectionManager,
        async_loop: asyncio.AbstractEventLoop,
    ):
        self.settings = settings
        self.state_machine = state_machine
        self.ws_manager = ws_manager
        self.async_loop = async_loop

        self.running: bool = False
        self.thread: Optional[threading.Thread] = None
        self.cap: Optional[cv2.VideoCapture] = None
        self.landmarker = None
        self.synthetic_gen = SyntheticHandGenerator()

        self.camera_active: bool = False
        self.is_mock_active: bool = False
        self.camera_requested: bool = False
        self.fps_actual: float = 0.0

        self._init_landmarker()

    def set_camera_requested(self, requested: bool) -> None:
        self.camera_requested = requested
        print(f"[Tracker] Camera requested state changed: {requested}")

    def _init_landmarker(self) -> None:
        """Initialize MediaPipe HandLandmarker from task bundle."""
        if not MODEL_PATH.exists():
            MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
            url = "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task"
            print(f"[Tracker] Downloading model bundle from {url}...")
            import urllib.request
            urllib.request.urlretrieve(url, str(MODEL_PATH))

        base_options = python.BaseOptions(model_asset_path=str(MODEL_PATH))
        options = vision.HandLandmarkerOptions(
            base_options=base_options,
            running_mode=vision.RunningMode.IMAGE,
            num_hands=2,
            min_hand_detection_confidence=self.settings.min_confidence,
            min_hand_presence_confidence=0.5,
            min_tracking_confidence=0.5,
        )
        self.landmarker = vision.HandLandmarker.create_from_options(options)
        print("[Tracker] MediaPipe HandLandmarker initialized successfully.")

    def start(self) -> None:
        if self.running:
            return
        self.running = True
        self.thread = threading.Thread(target=self._run_loop, name="GestureDeck-TrackerThread", daemon=True)
        self.thread.start()
        print("[Tracker] Background tracking thread started (camera on standby).")

    def stop(self) -> None:
        self.running = False
        if self.thread and self.thread.is_alive():
            self.thread.join(timeout=2.0)
        if self.cap:
            try:
                self.cap.release()
            except Exception:
                pass
            self.cap = None
        print("[Tracker] Background tracking thread stopped.")

    def _open_camera(self) -> bool:
        if not self.camera_requested:
            return False

        if self.settings.mock_camera:
            print("[Tracker] mock_camera enabled in settings; using synthetic hand generator.")
            self.camera_active = False
            self.is_mock_active = True
            return False

        try:
            print(f"[Tracker] Attempting to open webcam index {self.settings.camera_index}...")
            cap = cv2.VideoCapture(self.settings.camera_index)
            if cap.isOpened():
                # Configure resolution and buffer size
                cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
                cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
                cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
                ret, test_frame = cap.read()
                if ret and test_frame is not None:
                    self.cap = cap
                    self.camera_active = True
                    self.is_mock_active = False
                    print(f"[Tracker] Successfully opened webcam #{self.settings.camera_index} ({test_frame.shape[1]}x{test_frame.shape[0]})")
                    return True
                cap.release()
        except Exception as e:
            print(f"[Tracker] Webcam open error: {e}")

        print("[Tracker] Real webcam unavailable. Falling back to synthetic mock camera.")
        self.camera_active = False
        self.is_mock_active = True
        return False

    def _run_loop(self) -> None:
        target_interval = 1.0 / max(15, self.settings.target_fps)
        frame_count = 0
        fps_timer = time.time()

        while self.running:
            loop_start = time.time()

            # If HUD is not active, ensure camera is released and sleep
            if not self.camera_requested:
                if self.cap:
                    try:
                        self.cap.release()
                    except Exception:
                        pass
                    self.cap = None
                    self.camera_active = False
                    self.is_mock_active = False
                    print("[Tracker] Camera released (HUD standby).")
                time.sleep(0.1)
                continue

            # If camera requested but not yet opened, open it
            if not self.camera_active and not self.is_mock_active:
                self._open_camera()

            hands_data: List[Dict[str, Any]] = []

            if self.camera_active and self.cap:
                ret, frame = self.cap.read()
                if not ret or frame is None:
                    print("[Tracker] Frame read failed; falling back to mock generator.")
                    self.camera_active = False
                    self.is_mock_active = True
                else:
                    # Mirror frame horizontally for intuitive interaction
                    # (user moves hand right -> hand on right of screen)
                    mirrored = cv2.flip(frame, 1)
                    rgb = cv2.cvtColor(mirrored, cv2.COLOR_BGR2RGB)
                    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)

                    try:
                        result = self.landmarker.detect(mp_image)
                        if result and result.hand_landmarks:
                            for idx, landmarks_proto in enumerate(result.hand_landmarks):
                                # Determine raw handedness
                                raw_handedness = "Right"
                                conf = 0.95
                                if idx < len(result.handedness) and len(result.handedness[idx]) > 0:
                                    cat = result.handedness[idx][0]
                                    raw_handedness = cat.category_name
                                    conf = float(cat.score)

                                # MIRRORING HANDEDNESS INVERSION:
                                # When an image is horizontally mirrored, MediaPipe's intrinsic "Left"
                                # matches the physical user's real Right hand, and "Right" matches real Left hand.
                                physical_handedness = "Right" if raw_handedness == "Left" else "Left"

                                lms = [{"x": float(lm.x), "y": float(lm.y), "z": float(lm.z)} for lm in landmarks_proto]

                                hands_data.append({
                                    "handedness": physical_handedness,
                                    "confidence": conf,
                                    "landmarks": lms,
                                })
                    except Exception as e:
                        print(f"[Tracker] Detection error: {e}")

            if self.is_mock_active:
                hands_data = self.synthetic_gen.get_frame()

            # Process state machine
            now = time.time()
            telemetry = self.state_machine.process_frame(hands_data, timestamp=now)
            telemetry["camera_type"] = "webcam" if self.camera_active else "synthetic_mock"
            telemetry["camera_requested"] = self.camera_requested
            telemetry["camera_active"] = self.camera_active
            telemetry["fps"] = round(self.fps_actual, 1)

            # Broadcast packet over WebSocket safely
            if self.async_loop and self.async_loop.is_running():
                asyncio.run_coroutine_threadsafe(
                    self.ws_manager.broadcast_json(telemetry),
                    self.async_loop,
                )

            # Calculate actual FPS
            frame_count += 1
            if (now - fps_timer) >= 1.0:
                self.fps_actual = frame_count / (now - fps_timer)
                frame_count = 0
                fps_timer = now

            # Throttle to target FPS
            elapsed = time.time() - loop_start
            sleep_time = target_interval - elapsed
            if sleep_time > 0:
                time.sleep(sleep_time)
