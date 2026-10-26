import os
import json
import asyncio
from contextlib import asynccontextmanager
from typing import Dict, Any, Optional, List
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.responses import StreamingResponse, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .config import load_settings, save_settings, AppSettings
from .ws_manager import ConnectionManager
from .actions.dispatcher import ActionDispatcher
from .actions.spotify_client import SpotifyManager
from .trainer.gesture_trainer import GestureTrainer
from .tracking.state_machine import GestureStateMachine
from .tracking.hand_tracker import HandTrackerPipeline

# Global singletons
settings: AppSettings = load_settings()
spotify_manager = SpotifyManager(
    client_id=settings.spotify_client_id,
    client_secret=settings.spotify_client_secret,
    redirect_uri=settings.spotify_redirect_uri,
)
dispatcher = ActionDispatcher(
    spotify_manager=spotify_manager,
    media_detection_enabled=settings.media_detection_enabled,
    target_profile_override=settings.target_profile,
)
dispatcher.default_seek_seconds = getattr(settings, "pinch_seek_seconds", 10.0)
trainer = GestureTrainer(confidence_threshold=settings.min_confidence)
state_machine = GestureStateMachine(settings=settings, action_dispatcher=dispatcher, trainer=trainer)
ws_manager = ConnectionManager()
tracker_pipeline: Optional[HandTrackerPipeline] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global tracker_pipeline
    loop = asyncio.get_running_loop()
    print("[Main] Initializing GestureDeck HandTrackerPipeline (camera on standby)...")

    def on_action(event):
        if ws_manager.active_connections:
            asyncio.run_coroutine_threadsafe(
                ws_manager.broadcast_json({"type": "action_event", "event": event}),
                loop,
            )

    dispatcher.add_listener(on_action)

    tracker_pipeline = HandTrackerPipeline(
        settings=settings,
        state_machine=state_machine,
        ws_manager=ws_manager,
        async_loop=loop,
    )
    tracker_pipeline.start()
    yield
    print("[Main] Shutting down GestureDeck services...")
    if tracker_pipeline:
        tracker_pipeline.stop()


app = FastAPI(
    title="GestureDeck API",
    description="Local Hand Gesture Media Controller Backend",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi.staticfiles import StaticFiles
ext_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../extension"))
if os.path.isdir(ext_dir):
    app.mount("/static/extension", StaticFiles(directory=ext_dir), name="extension")


# -------------------------------------------------------------
# WebSocket Telemetry Stream
# -------------------------------------------------------------
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            # Receive client messages / commands
            raw_text = await websocket.receive_text()
            try:
                data = json.loads(raw_text)
            except Exception:
                continue

            cmd_type = data.get("type")
            if cmd_type == "ping":
                await websocket.send_text(json.dumps({"type": "pong", "time": data.get("time")}))
            elif cmd_type in ("register", "bridge_hello"):
                client_type = data.get("client", "hud")
                await ws_manager.update_meta(websocket, {
                    "client_type": client_type,
                    "title": data.get("title", ""),
                    "url": data.get("url", ""),
                })
                if client_type == "youtube_bridge":
                    await websocket.send_text(json.dumps({
                        "type": "bridge_ack",
                        "status": "connected",
                        "settings": settings.model_dump(),
                    }))
                    await ws_manager.broadcast_json({
                        "type": "bridge_status",
                        "bridge": ws_manager.get_bridge_info(),
                    })
                elif client_type == "hud":
                    if tracker_pipeline:
                        tracker_pipeline.set_camera_requested(True)
            elif cmd_type == "set_wake":
                target_state = data.get("state", "ACTIVE")
                state_machine.wake_state = target_state
                state_machine.last_active_time = asyncio.get_event_loop().time()
                if target_state == "ACTIVE":
                    state_machine.wake_transition_time = state_machine.last_active_time
            elif cmd_type == "trigger_action":
                action_name = data.get("action")
                if action_name:
                    res = dispatcher.dispatch(action_name, data.get("params"))
                    await websocket.send_text(json.dumps({"type": "action_result", "result": res}))
            elif cmd_type == "set_media_detection":
                enabled = bool(data.get("enabled", False))
                dispatcher.set_media_detection(enabled)
                settings.media_detection_enabled = enabled
                save_settings(settings)
                await websocket.send_text(json.dumps({
                    "type": "context_update",
                    "context": dispatcher.get_context()
                }))
            elif cmd_type == "set_target":
                target_id = str(data.get("target_id", "auto"))
                dispatcher.set_selected_target(target_id)
                await websocket.send_text(json.dumps({
                    "type": "context_update",
                    "context": dispatcher.get_context()
                }))
            elif cmd_type == "set_target_profile":
                target = str(data.get("profile", "auto"))
                dispatcher.set_target_profile(target)
                settings.target_profile = target
                save_settings(settings)
                await websocket.send_text(json.dumps({
                    "type": "context_update",
                    "context": dispatcher.get_context()
                }))
            elif cmd_type == "set_camera":
                req = bool(data.get("enabled", True))
                if tracker_pipeline:
                    tracker_pipeline.set_camera_requested(req)
                await websocket.send_text(json.dumps({
                    "type": "camera_update",
                    "camera_requested": req,
                    "camera_active": tracker_pipeline.camera_active if tracker_pipeline else False
                }))
    except WebSocketDisconnect:
        await ws_manager.disconnect(websocket)
    except Exception as e:
        await ws_manager.disconnect(websocket)
    finally:
        # If all HUD sessions closed, immediately release camera hardware
        if tracker_pipeline and not ws_manager.has_hud_clients():
            tracker_pipeline.set_camera_requested(False)


# -------------------------------------------------------------
# REST Endpoints
# -------------------------------------------------------------
@app.get("/api/status")
def get_status():
    ctx = dispatcher.get_context()
    return {
        "status": "online",
        "wake_state": state_machine.wake_state,
        "camera_requested": tracker_pipeline.camera_requested if tracker_pipeline else False,
        "camera_active": tracker_pipeline.camera_active if tracker_pipeline else False,
        "is_mock_active": tracker_pipeline.is_mock_active if tracker_pipeline else True,
        "fps": round(tracker_pipeline.fps_actual, 1) if tracker_pipeline else 0.0,
        "active_profile": ctx["profile"],
        "target_profile": ctx["target_profile_override"],
        "selected_target_id": ctx.get("selected_target_id", "auto"),
        "available_targets": ctx.get("available_targets", []),
        "media_detection_enabled": ctx["media_detection_enabled"],
        "window_title": ctx["window_title"],
        "spotify_connected": spotify_manager.is_connected(),
        "youtube_bridge": ws_manager.get_bridge_info(),
        "recent_actions": dispatcher.action_history[-10:],
    }


@app.get("/api/settings")
def get_settings():
    return settings.model_dump()


@app.post("/api/settings")
def update_settings(new_settings: AppSettings):
    global settings
    settings = new_settings
    save_settings(settings)
    state_machine.update_settings(settings)
    trainer.confidence_threshold = settings.min_confidence
    dispatcher.set_media_detection(settings.media_detection_enabled)
    dispatcher.set_target_profile(settings.target_profile)
    dispatcher.default_seek_seconds = getattr(settings, "pinch_seek_seconds", 10.0)
    if tracker_pipeline:
        tracker_pipeline.settings = settings
    return {"status": "updated", "settings": settings.model_dump()}


@app.post("/api/settings/reset")
def reset_settings():
    global settings
    settings = AppSettings()
    save_settings(settings)
    state_machine.update_settings(settings)
    trainer.confidence_threshold = settings.min_confidence
    dispatcher.set_media_detection(settings.media_detection_enabled)
    dispatcher.set_target_profile(settings.target_profile)
    dispatcher.default_seek_seconds = getattr(settings, "pinch_seek_seconds", 10.0)
    if tracker_pipeline:
        tracker_pipeline.settings = settings
    return {"status": "reset", "settings": settings.model_dump()}


class SetProfileRequest(BaseModel):
    profile: str


@app.post("/api/context/profile")
def set_target_profile(req: SetProfileRequest):
    dispatcher.set_target_profile(req.profile)
    settings.target_profile = req.profile
    save_settings(settings)
    return {"status": "ok", "context": dispatcher.get_context()}


class ToggleInspectionRequest(BaseModel):
    enabled: bool


@app.post("/api/context/toggle-inspection")
def toggle_inspection(req: ToggleInspectionRequest):
    dispatcher.set_media_detection(req.enabled)
    settings.media_detection_enabled = req.enabled
    save_settings(settings)
    return {"status": "ok", "context": dispatcher.get_context()}


class SetTargetRequest(BaseModel):
    target_id: str


@app.get("/api/context/targets")
def get_available_targets():
    return {
        "targets": dispatcher.window_detector.get_available_targets(),
        "selected_target_id": dispatcher.selected_target_id,
        "media_detection_enabled": dispatcher.window_detector.is_enabled,
    }


@app.post("/api/context/target")
def set_target(req: SetTargetRequest):
    dispatcher.set_selected_target(req.target_id)
    return {"status": "ok", "context": dispatcher.get_context()}


class CameraStateRequest(BaseModel):
    requested: bool


@app.get("/api/camera/state")
def get_camera_state():
    return {
        "requested": tracker_pipeline.camera_requested if tracker_pipeline else False,
        "active": tracker_pipeline.camera_active if tracker_pipeline else False,
        "fps": round(tracker_pipeline.fps_actual, 1) if tracker_pipeline else 0.0,
    }


@app.post("/api/camera/state")
def set_camera_state(req: CameraStateRequest):
    if tracker_pipeline:
        tracker_pipeline.set_camera_requested(req.requested)
    return {
        "status": "ok",
        "requested": req.requested,
        "active": tracker_pipeline.camera_active if tracker_pipeline else False,
    }


@app.get("/api/camera/stream")
async def get_camera_stream():
    """
    Live multipart/x-mixed-replace MJPEG webcam stream.
    Directly compatible with HTML <img> elements.
    """
    if tracker_pipeline and not tracker_pipeline.camera_requested:
        tracker_pipeline.set_camera_requested(True)

    async def stream_generator():
        while True:
            if tracker_pipeline and tracker_pipeline.latest_frame_jpeg:
                frame_data = tracker_pipeline.latest_frame_jpeg
                yield (
                    b"--frame\r\n"
                    b"Content-Type: image/jpeg\r\n"
                    b"Content-Length: " + str(len(frame_data)).encode() + b"\r\n\r\n" +
                    frame_data + b"\r\n"
                )
            await asyncio.sleep(0.033)  # ~30fps stream

    return StreamingResponse(
        stream_generator(),
        media_type="multipart/x-mixed-replace; boundary=frame",
        headers={
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Expires": "0",
            "Connection": "close",
        },
    )


@app.get("/api/camera/frame.jpg")
def get_camera_frame():
    """Returns the latest single camera frame as JPEG."""
    if tracker_pipeline and tracker_pipeline.latest_frame_jpeg:
        return Response(content=tracker_pipeline.latest_frame_jpeg, media_type="image/jpeg")
    raise HTTPException(status_code=503, detail="Camera frame not ready")


class TriggerActionRequest(BaseModel):
    action: str
    params: Optional[Dict[str, Any]] = None


@app.post("/api/actions/trigger")
def trigger_action(req: TriggerActionRequest):
    res = dispatcher.dispatch(req.action, req.params)
    return res


@app.get("/api/context")
def get_context():
    return dispatcher.get_context()



# -------------------------------------------------------------
# Custom Gesture Trainer Endpoints
# -------------------------------------------------------------
class RecordRequest(BaseModel):
    label: str
    target_samples: int = 30


@app.post("/api/trainer/record")
def start_recording(req: RecordRequest):
    res = trainer.start_recording(req.label, req.target_samples)
    return res


@app.post("/api/trainer/cancel")
def cancel_recording():
    return trainer.cancel_recording()


@app.post("/api/trainer/train")
def train_model():
    res = trainer.train_model()
    return res


@app.get("/api/trainer/gestures")
def list_gestures():
    return {
        "gestures": trainer.list_gestures(),
        "is_recording": trainer.is_recording,
        "recording_label": trainer.recording_label,
        "classes": trainer.classes_,
    }


@app.delete("/api/trainer/gestures/{name}")
def delete_gesture(name: str):
    success = trainer.delete_gesture(name)
    if not success:
        raise HTTPException(status_code=404, detail=f"Gesture '{name}' not found")
    return {"status": "deleted", "name": name}


class MapActionRequest(BaseModel):
    gesture_name: str
    action: str
    params: Optional[Dict[str, Any]] = None


@app.post("/api/trainer/map")
def map_action(req: MapActionRequest):
    res = trainer.map_gesture_action(req.gesture_name, req.action, req.params)
    return res
