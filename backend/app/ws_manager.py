import asyncio
import json
from typing import Set, Dict, Any, Optional
from fastapi import WebSocket
from starlette.websockets import WebSocketState


class ConnectionManager:
    """Manages WebSocket connections and safely broadcasts telemetry packets to clients."""

    def __init__(self):
        self.active_connections: Set[WebSocket] = set()
        self.client_meta: Dict[WebSocket, Dict[str, Any]] = {}
        self._lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket, meta: Optional[Dict[str, Any]] = None) -> None:
        await websocket.accept()
        async with self._lock:
            self.active_connections.add(websocket)
            self.client_meta[websocket] = meta or {"client_type": "hud"}
        print(f"[WS] Client connected ({self.client_meta[websocket].get('client_type')}). Active clients: {len(self.active_connections)}")

    async def update_meta(self, websocket: WebSocket, meta: Dict[str, Any]) -> None:
        async with self._lock:
            if websocket in self.client_meta:
                self.client_meta[websocket].update(meta)
            else:
                self.client_meta[websocket] = meta

    async def disconnect(self, websocket: WebSocket) -> None:
        async with self._lock:
            self.active_connections.discard(websocket)
            self.client_meta.pop(websocket, None)
        print(f"[WS] Client disconnected. Active clients: {len(self.active_connections)}")

    def get_bridge_info(self) -> Dict[str, Any]:
        for meta in self.client_meta.values():
            if meta.get("client_type") == "youtube_bridge":
                return {
                    "connected": True,
                    "title": meta.get("title", "YouTube Video"),
                    "url": meta.get("url", ""),
                }
        return {"connected": False, "title": "", "url": ""}

    def has_hud_clients(self) -> bool:
        return any(meta.get("client_type", "hud") == "hud" for meta in self.client_meta.values())

    async def broadcast_json(self, data: Dict[str, Any]) -> None:
        """Broadcasts dictionary as JSON to all connected clients."""
        if not self.active_connections:
            return

        text = json.dumps(data)
        async with self._lock:
            dead_connections = set()
            for connection in list(self.active_connections):
                try:
                    if connection.client_state == WebSocketState.CONNECTED:
                        await connection.send_text(text)
                    else:
                        dead_connections.add(connection)
                except Exception:
                    dead_connections.add(connection)

            if dead_connections:
                self.active_connections.difference_update(dead_connections)
                for dc in dead_connections:
                    self.client_meta.pop(dc, None)
