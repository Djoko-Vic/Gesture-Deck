import { AppSettings, SystemStatus, CustomGesture, MediaTarget } from "./types";

const API_BASE = "http://localhost:8000";

export async function fetchStatus(): Promise<SystemStatus> {
  const res = await fetch(`${API_BASE}/api/status`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Status fetch failed: ${res.statusText}`);
  return res.json();
}

export async function fetchSettings(): Promise<AppSettings> {
  const res = await fetch(`${API_BASE}/api/settings`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Settings fetch failed: ${res.statusText}`);
  return res.json();
}

export async function saveSettings(settings: AppSettings): Promise<{ status: string; settings: AppSettings }> {
  const res = await fetch(`${API_BASE}/api/settings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settings),
  });
  if (!res.ok) throw new Error(`Settings update failed: ${res.statusText}`);
  return res.json();
}

export async function resetSettingsApi(): Promise<{ status: string; settings: AppSettings }> {
  const res = await fetch(`${API_BASE}/api/settings/reset`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`Settings reset failed: ${res.statusText}`);
  return res.json();
}

export async function triggerAction(action: string, params?: Record<string, any>): Promise<any> {
  const res = await fetch(`${API_BASE}/api/actions/trigger`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, params }),
  });
  if (!res.ok) throw new Error(`Action dispatch failed: ${res.statusText}`);
  return res.json();
}

export async function fetchContext(): Promise<{ window_title: string; profile: string }> {
  const res = await fetch(`${API_BASE}/api/context`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Context fetch failed: ${res.statusText}`);
  return res.json();
}

export async function setTargetProfileApi(profile: string): Promise<any> {
  const res = await fetch(`${API_BASE}/api/context/profile`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ profile }),
  });
  if (!res.ok) throw new Error(`Set profile failed: ${res.statusText}`);
  return res.json();
}

export async function setMediaDetectionApi(enabled: boolean): Promise<any> {
  const res = await fetch(`${API_BASE}/api/context/toggle-inspection`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ enabled }),
  });
  if (!res.ok) throw new Error(`Toggle inspection failed: ${res.statusText}`);
  return res.json();
}

export async function startRecordingGesture(label: string, target_samples: number = 30): Promise<any> {
  const res = await fetch(`${API_BASE}/api/trainer/record`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ label, target_samples }),
  });
  if (!res.ok) throw new Error(`Start record failed: ${res.statusText}`);
  return res.json();
}

export async function cancelRecordingGesture(): Promise<any> {
  const res = await fetch(`${API_BASE}/api/trainer/cancel`, { method: "POST" });
  if (!res.ok) throw new Error(`Cancel record failed: ${res.statusText}`);
  return res.json();
}

export async function trainGestureModel(): Promise<any> {
  const res = await fetch(`${API_BASE}/api/trainer/train`, { method: "POST" });
  if (!res.ok) throw new Error(`Model train failed: ${res.statusText}`);
  return res.json();
}

export async function fetchGestures(): Promise<{
  gestures: CustomGesture[];
  is_recording: boolean;
  recording_label: string | null;
  classes: string[];
}> {
  const res = await fetch(`${API_BASE}/api/trainer/gestures`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Gestures fetch failed: ${res.statusText}`);
  return res.json();
}

export async function deleteCustomGesture(name: string): Promise<any> {
  const res = await fetch(`${API_BASE}/api/trainer/gestures/${encodeURIComponent(name)}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error(`Gesture delete failed: ${res.statusText}`);
  return res.json();
}

export async function mapCustomGestureAction(gesture_name: string, action: string, params?: Record<string, any>): Promise<any> {
  const res = await fetch(`${API_BASE}/api/trainer/map`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ gesture_name, action, params }),
  });
  if (!res.ok) throw new Error(`Map action failed: ${res.statusText}`);
  return res.json();
}

export async function fetchAvailableTargets(): Promise<{
  targets: MediaTarget[];
  selected_target_id: string;
  media_detection_enabled: boolean;
}> {
  const res = await fetch(`${API_BASE}/api/context/targets`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Targets fetch failed: ${res.statusText}`);
  return res.json();
}

export async function setTargetApi(target_id: string): Promise<any> {
  const res = await fetch(`${API_BASE}/api/context/target`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ target_id }),
  });
  if (!res.ok) throw new Error(`Set target failed: ${res.statusText}`);
  return res.json();
}

export async function setCameraStateApi(requested: boolean): Promise<any> {
  const res = await fetch(`${API_BASE}/api/camera/state`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ requested }),
  });
  if (!res.ok) throw new Error(`Set camera state failed: ${res.statusText}`);
  return res.json();
}
