import asyncio
import json
from typing import Set, Dict, Any
from fastapi import WebSocket
from starlette.websockets import WebSocketState


class ConnectionManager:
    """Manages WebSocket connections and safely broadcasts telemetry packets to clients."""

    def __init__(self):
        self.active_connections: Set[WebSocket] = set()
        self._lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        async with self._lock:
            self.active_connections.add(websocket)
        print(f"[WS] Client connected. Active clients: {len(self.active_connections)}")

    async def disconnect(self, websocket: WebSocket) -> None:
        async with self._lock:
            self.active_connections.discard(websocket)
        print(f"[WS] Client disconnected. Active clients: {len(self.active_connections)}")

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
