from fastapi.testclient import TestClient
from unittest.mock import MagicMock
from app.main import app
import app.main as main_module


def test_camera_state_and_stream_endpoints():
    client = TestClient(app)
    
    # Verify camera state endpoint
    resp = client.get("/api/camera/state")
    assert resp.status_code == 200
    data = resp.json()
    assert "requested" in data
    assert "active" in data

    # Verify camera frame when frame is available
    mock_pipeline = MagicMock()
    mock_pipeline.latest_frame_jpeg = b"\xff\xd8\xff\xe0mockjpegframe"
    mock_pipeline.camera_requested = True
    
    with patch_pipeline(mock_pipeline):
        frame_resp = client.get("/api/camera/frame.jpg")
        assert frame_resp.status_code == 200
        assert frame_resp.headers["content-type"] == "image/jpeg"
        assert frame_resp.content == b"\xff\xd8\xff\xe0mockjpegframe"


class patch_pipeline:
    def __init__(self, pipeline):
        self.pipeline = pipeline
        self.orig = None

    def __enter__(self):
        self.orig = main_module.tracker_pipeline
        main_module.tracker_pipeline = self.pipeline

    def __exit__(self, exc_type, exc_val, exc_tb):
        main_module.tracker_pipeline = self.orig
