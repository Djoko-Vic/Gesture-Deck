import math
from typing import List, Dict, Tuple
from .normalizer import euclidean_distance, euclidean_distance_2d


class FingerStates:
    def __init__(self, thumb: bool, index: bool, middle: bool, ring: bool, pinky: bool):
        self.thumb = thumb
        self.index = index
        self.middle = middle
        self.ring = ring
        self.pinky = pinky

    def as_list(self) -> List[bool]:
        return [self.thumb, self.index, self.middle, self.ring, self.pinky]

    def count_extended(self) -> int:
        return sum(self.as_list())

    def __repr__(self) -> str:
        return f"FingerStates(T={self.thumb}, I={self.index}, M={self.middle}, R={self.ring}, P={self.pinky})"


def detect_finger_states(norm_landmarks: List[Dict[str, float]], handedness: str = "Right") -> Tuple[FingerStates, Dict[str, any]]:
    """
    Determines whether each finger is UP (extended) or DOWN (folded/curled)
    using scale-normalized landmarks.
    
    Landmark Indices:
    0: Wrist
    1-4: Thumb (CMC, MCP, IP, TIP)
    5-8: Index (MCP, PIP, DIP, TIP)
    9-12: Middle (MCP, PIP, DIP, TIP)
    13-16: Ring (MCP, PIP, DIP, TIP)
    17-20: Pinky (MCP, PIP, DIP, TIP)
    """
    if not norm_landmarks or len(norm_landmarks) < 21:
        return FingerStates(False, False, False, False, False), {}

    wrist = norm_landmarks[0]
    
    # Finger indices tuples: (MCP, PIP, DIP, TIP)
    fingers = {
        "index": (5, 6, 7, 8),
        "middle": (9, 10, 11, 12),
        "ring": (13, 14, 15, 16),
        "pinky": (17, 18, 19, 20),
    }

    states: Dict[str, bool] = {}
    details: Dict[str, any] = {}

    # Check 4 non-thumb fingers
    for name, (mcp_idx, pip_idx, dip_idx, tip_idx) in fingers.items():
        mcp = norm_landmarks[mcp_idx]
        pip = norm_landmarks[pip_idx]
        tip = norm_landmarks[tip_idx]

        dist_wrist_tip = euclidean_distance(wrist, tip)
        dist_wrist_pip = euclidean_distance(wrist, pip)
        dist_mcp_tip = euclidean_distance(mcp, tip)
        dist_mcp_pip = euclidean_distance(mcp, pip)

        # Extended criteria:
        # 1. Tip is significantly further from wrist than PIP
        # 2. Tip is further from MCP than PIP is from MCP
        is_extended = (dist_wrist_tip > dist_wrist_pip * 1.12) and (dist_mcp_tip > dist_mcp_pip * 1.25)

        states[name] = bool(is_extended)
        details[name] = {
            "wrist_tip": round(dist_wrist_tip, 2),
            "wrist_pip": round(dist_wrist_pip, 2),
            "extended": bool(is_extended),
        }

    # Thumb detection
    # Thumb Tip = 4, Thumb IP = 3, Thumb MCP = 2, Index MCP = 5, Pinky MCP = 17
    thumb_tip = norm_landmarks[4]
    thumb_ip = norm_landmarks[3]
    thumb_mcp = norm_landmarks[2]
    index_mcp = norm_landmarks[5]
    pinky_mcp = norm_landmarks[17]

    dist_thumb_pinky = euclidean_distance(thumb_tip, pinky_mcp)
    dist_thumb_index_mcp = euclidean_distance(thumb_tip, index_mcp)
    dist_thumb_wrist = euclidean_distance(wrist, thumb_tip)
    dist_thumb_ip_wrist = euclidean_distance(wrist, thumb_ip)
    dist_thumb_mcp_wrist = euclidean_distance(wrist, thumb_mcp)

    # Thumb is extended when thumb tip is farther from wrist along thumb axis
    # and separated from fingers
    thumb_axis_extended = (dist_thumb_wrist > dist_thumb_ip_wrist * 1.03) or (dist_thumb_wrist > dist_thumb_mcp_wrist * 1.20)
    thumb_extended = thumb_axis_extended and (dist_thumb_index_mcp > 0.30 or dist_thumb_pinky > 0.40)

    states["thumb"] = bool(thumb_extended)
    details["thumb"] = {
        "dist_index_mcp": round(dist_thumb_index_mcp, 2),
        "dist_pinky_mcp": round(dist_thumb_pinky, 2),
        "extended": bool(thumb_extended),
    }

    # Palm orientation / normal check:
    # Cross product of vector Wrist->IndexMCP and Wrist->PinkyMCP
    v1_x = index_mcp.get("x", 0.0) - wrist.get("x", 0.0)
    v1_y = index_mcp.get("y", 0.0) - wrist.get("y", 0.0)
    v2_x = pinky_mcp.get("x", 0.0) - wrist.get("x", 0.0)
    v2_y = pinky_mcp.get("y", 0.0) - wrist.get("y", 0.0)
    normal_z = v1_x * v2_y - v1_y * v2_x

    # If handedness is Right (after mirror adjustment), positive/negative sign determines palm facing camera
    palm_facing_camera = normal_z > 0.05 if handedness == "Right" else normal_z < -0.05
    details["normal_z"] = round(normal_z, 3)
    details["palm_facing_camera"] = bool(palm_facing_camera)

    finger_states = FingerStates(
        thumb=states["thumb"],
        index=states["index"],
        middle=states["middle"],
        ring=states["ring"],
        pinky=states["pinky"],
    )

    return finger_states, details


def is_palm_facing_camera(norm_landmarks: List[Dict[str, float]], handedness: str = "Right") -> bool:
    """Convenience helper to check if palm is facing the webcam."""
    if not norm_landmarks or len(norm_landmarks) < 21:
        return False
    _, details = detect_finger_states(norm_landmarks, handedness)
    return details.get("palm_facing_camera", True)
