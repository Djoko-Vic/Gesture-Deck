import math
from typing import List, Dict, Any, Tuple

def normalize_landmarks(raw_landmarks: List[Dict[str, float]]) -> Tuple[List[Dict[str, float]], float, List[float]]:
    """
    Normalizes 21 hand landmarks:
    1. Translates all landmarks relative to Wrist (landmark 0).
    2. Scales by palm size (Euclidean distance between Wrist and Middle MCP [landmark 9]).
    
    Returns:
        (normalized_landmarks, palm_scale, flat_features_63)
    """
    if not raw_landmarks or len(raw_landmarks) != 21:
        return [], 1.0, [0.0] * 63

    wrist = raw_landmarks[0]
    wx, wy, wz = wrist.get("x", 0.0), wrist.get("y", 0.0), wrist.get("z", 0.0)

    # Reference middle knuckle (MCP index 9) for palm scale
    middle_mcp = raw_landmarks[9]
    dx = middle_mcp.get("x", 0.0) - wx
    dy = middle_mcp.get("y", 0.0) - wy
    dz = middle_mcp.get("z", 0.0) - wz
    palm_scale = math.sqrt(dx * dx + dy * dy + dz * dz)

    # Fallback to Index MCP (index 5) if middle MCP distance is degenerate
    if palm_scale < 1e-4:
        index_mcp = raw_landmarks[5]
        idx_dx = index_mcp.get("x", 0.0) - wx
        idx_dy = index_mcp.get("y", 0.0) - wy
        idx_dz = index_mcp.get("z", 0.0) - wz
        palm_scale = math.sqrt(idx_dx * idx_dx + idx_dy * idx_dy + idx_dz * idx_dz)

    if palm_scale < 1e-4:
        palm_scale = 1.0

    normalized: List[Dict[str, float]] = []
    flat_features: List[float] = []

    for pt in raw_landmarks:
        nx = (pt.get("x", 0.0) - wx) / palm_scale
        ny = (pt.get("y", 0.0) - wy) / palm_scale
        nz = (pt.get("z", 0.0) - wz) / palm_scale
        
        normalized.append({
            "x": nx,
            "y": ny,
            "z": nz,
            "visibility": pt.get("visibility", 1.0)
        })
        flat_features.extend([nx, ny, nz])

    return normalized, palm_scale, flat_features


def euclidean_distance(p1: Dict[str, float], p2: Dict[str, float]) -> float:
    """Calculate 3D Euclidean distance between two landmarks."""
    dx = p1.get("x", 0.0) - p2.get("x", 0.0)
    dy = p1.get("y", 0.0) - p2.get("y", 0.0)
    dz = p1.get("z", 0.0) - p2.get("z", 0.0)
    return math.sqrt(dx * dx + dy * dy + dz * dz)


def euclidean_distance_2d(p1: Dict[str, float], p2: Dict[str, float]) -> float:
    """Calculate 2D (X, Y) Euclidean distance between two landmarks."""
    dx = p1.get("x", 0.0) - p2.get("x", 0.0)
    dy = p1.get("y", 0.0) - p2.get("y", 0.0)
    return math.sqrt(dx * dx + dy * dy)
