export interface Landmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export interface HandData {
  handedness: "Left" | "Right";
  confidence: number;
  landmarks: Landmark[];
  norm_landmarks?: Landmark[];
  palm_scale?: number;
  flat_features?: number[];
}

export interface ClutchStatus {
  enabled: boolean;
  is_engaged: boolean;
  pose: string;
  target_pose: string;
}

export interface ScrubStatus {
  is_scrubbing: boolean;
  delta_seconds: number;
  anchor_x?: number;
  smoothed_x?: number;
}

export interface PinchStatus {
  is_pinched: boolean;
  distance: number;
  pinch_on: number;
  pinch_off: number;
}

export interface ActionEvent {
  action?: string;
  type?: string;
  state?: string;
  reason?: string;
  success?: boolean;
  message?: string;
  profile?: string;
  timestamp: number;
}

export interface MediaTarget {
  id: string;
  label: string;
  title: string;
  artist?: string;
  status?: string;
  type: "auto" | "mpris" | "profile";
  app?: string;
  bus?: string;
}

export interface TelemetryPacket {
  type: "telemetry";
  wake_state: "ACTIVE" | "SLEEPING";
  in_grace_period?: boolean;
  timeout_remaining: number;
  active_gesture: string;
  confidence: number;
  confirm_progress?: number;
  is_pinch: boolean;
  pinch_distance: number;
  pinch?: PinchStatus;
  clutch: ClutchStatus;
  scrub: ScrubStatus;
  hands: HandData[];
  action_event?: ActionEvent | null;
  timestamp: number;
  camera_type?: "webcam" | "synthetic_mock";
  camera_requested?: boolean;
  camera_active?: boolean;
  fps?: number;
  context?: {
    active_profile: string;
    window_title: string;
    target_profile?: string;
    selected_target_id?: string;
    available_targets?: MediaTarget[];
    media_detection_enabled?: boolean;
  };
}

export interface AppSettings {
  inactivity_timeout: number;
  clutch_enabled: boolean;
  clutch_pose: string;
  sensitivity: number;
  cooldown_ms: number;
  camera_index: number;
  mock_camera: boolean;
  target_fps: number;
  wake_grace_ms?: number;
  scrub_sensitivity: number;
  min_confidence: number;
  
  // Pinch & Drag Tuning
  pinch_threshold?: number;
  pinch_on?: number;
  pinch_off?: number;
  pinch_confirm_ms?: number;
  pinch_release_ms?: number;
  drag_deadzone?: number;
  drag_smoothing?: number;
  scrub_range_seconds?: number;
  dropout_frames?: number;
  confirm_ms?: number;
  release_ms?: number;
  global_lockout_ms?: number;

  media_detection_enabled?: boolean;
  target_profile?: string;
  spotify_client_id?: string | null;
  spotify_client_secret?: string | null;
  spotify_redirect_uri?: string | null;
}

export interface SystemStatus {
  status: string;
  wake_state: string;
  camera_requested?: boolean;
  camera_active: boolean;
  is_mock_active: boolean;
  fps: number;
  active_profile: string;
  target_profile?: string;
  selected_target_id?: string;
  available_targets?: MediaTarget[];
  media_detection_enabled?: boolean;
  window_title: string;
  spotify_connected: boolean;
  youtube_bridge?: {
    connected: boolean;
    title?: string;
    url?: string;
  };
  recent_actions: ActionEvent[];
}

export interface CustomGesture {
  name: string;
  sample_count: number;
  mapping: {
    action: string;
    params?: Record<string, any>;
  };
}
