import os
import json
from pathlib import Path
from typing import Optional
from pydantic import BaseModel, Field

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)
SETTINGS_FILE = DATA_DIR / "settings.json"


class AppSettings(BaseModel):
    inactivity_timeout: float = Field(default=8.0, ge=2.0, le=60.0, description="Seconds of inactivity before sleeping")
    clutch_enabled: bool = Field(default=True, description="When true, commands require left-hand clutch")
    clutch_pose: str = Field(default="open_palm", description="Required pose for clutch: 'open_palm' or 'fist'")
    sensitivity: float = Field(default=1.0, ge=0.5, le=2.0, description="Gesture detection sensitivity factor")
    cooldown_ms: int = Field(default=800, ge=300, le=3000, description="Action cooldown in milliseconds")
    camera_index: int = Field(default=0, ge=0, description="Webcam device index")
    mock_camera: bool = Field(default=False, description="Use synthetic hand generator if true or camera fails")
    target_fps: int = Field(default=30, ge=15, le=60, description="Target processing and streaming framerate")
    wake_grace_ms: int = Field(default=1500, ge=0, le=5000, description="Grace period in ms after waking where all commands are ignored")
    scrub_sensitivity: float = Field(default=1.0, ge=0.2, le=3.0, description="Timeline scrub speed multiplier")
    min_confidence: float = Field(default=0.75, ge=0.5, le=0.99, description="Minimum ML confidence threshold")

    # Pinch & Drag Hysteresis, Smoothing & Tuning
    pinch_threshold: float = Field(default=0.40, ge=0.20, le=0.80, description="Grab distance threshold for pinch")
    pinch_on: float = Field(default=0.40, ge=0.20, le=0.70, description="Hysteresis grab threshold for pinch")
    pinch_off: float = Field(default=0.55, ge=0.30, le=0.90, description="Hysteresis release threshold for pinch")
    pinch_confirm_ms: int = Field(default=100, ge=0, le=500, description="Milliseconds pinch must hold before grab")
    pinch_release_ms: int = Field(default=120, ge=0, le=500, description="Milliseconds pinch release must hold before commit")
    drag_deadzone: float = Field(default=0.02, ge=0.0, le=0.10, description="Horizontal drag deadzone as fraction of screen")
    drag_smoothing: float = Field(default=0.30, ge=0.05, le=0.90, description="Smoothing factor for drag position")
    scrub_range_seconds: float = Field(default=60.0, ge=15.0, le=300.0, description="Maximum seek range across comfortable sweep")
    dropout_frames: int = Field(default=6, ge=1, le=15, description="Allowed frames to maintain state during brief tracking dropout")
    confirm_ms: int = Field(default=250, ge=50, le=1500, description="Gesture hold duration in ms before firing")
    release_ms: int = Field(default=300, ge=100, le=1500, description="Pose leave duration in ms required before re-firing")
    global_lockout_ms: int = Field(default=400, ge=0, le=2000, description="Lockout window in ms after any action fires")
    
    # Context-Aware Site Target & Inspection Switch
    media_detection_enabled: bool = Field(default=False, description="When false, window and video info inspection is disabled until switched on")
    target_profile: str = Field(default="auto", description="Active profile target: 'auto', 'youtube', 'spotify', or 'generic'")
    
    # Spotify Web API (Optional)
    spotify_client_id: Optional[str] = None
    spotify_client_secret: Optional[str] = None
    spotify_redirect_uri: Optional[str] = "http://localhost:8000/api/spotify/callback"


def load_settings() -> AppSettings:
    """Load settings from JSON file or return defaults."""
    if SETTINGS_FILE.exists():
        try:
            with open(SETTINGS_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                return AppSettings(**data)
        except Exception as e:
            print(f"[Settings] Error loading settings from {SETTINGS_FILE}: {e}. Using defaults.")
    settings = AppSettings()
    save_settings(settings)
    return settings


def save_settings(settings: AppSettings) -> None:
    """Persist settings to JSON file."""
    try:
        with open(SETTINGS_FILE, "w", encoding="utf-8") as f:
            f.write(settings.model_dump_json(indent=2))
    except Exception as e:
        print(f"[Settings] Error saving settings to {SETTINGS_FILE}: {e}")
