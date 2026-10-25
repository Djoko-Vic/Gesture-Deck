import os
import json
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple
import numpy as np
from sklearn.neighbors import KNeighborsClassifier
from sklearn.ensemble import RandomForestClassifier
import joblib

DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

GESTURES_FILE = DATA_DIR / "gestures.json"
MAPPINGS_FILE = DATA_DIR / "mappings.json"
MODEL_FILE = DATA_DIR / "gesture_model.joblib"


class GestureTrainer:
    """
    Manages custom gesture collection, persistent storage, Scikit-Learn training,
    and runtime prediction with confidence gating.
    """

    def __init__(self, confidence_threshold: float = 0.75):
        self.confidence_threshold = confidence_threshold
        self.gestures_data: Dict[str, List[List[float]]] = {}
        self.mappings: Dict[str, Dict[str, Any]] = {}
        self.model: Optional[Any] = None
        self.classes_: List[str] = []

        # Recording session state
        self.recording_label: Optional[str] = None
        self.target_samples: int = 30
        self.recorded_samples: List[List[float]] = []
        self.is_recording: bool = False

        self._load_data()
        self._load_model()

    def _load_data(self) -> None:
        if GESTURES_FILE.exists():
            try:
                with open(GESTURES_FILE, "r", encoding="utf-8") as f:
                    self.gestures_data = json.load(f)
            except Exception as e:
                print(f"[Trainer] Error loading gestures: {e}")
                self.gestures_data = {}

        if MAPPINGS_FILE.exists():
            try:
                with open(MAPPINGS_FILE, "r", encoding="utf-8") as f:
                    self.mappings = json.load(f)
            except Exception as e:
                print(f"[Trainer] Error loading mappings: {e}")
                self.mappings = {}

    def _save_data(self) -> None:
        try:
            with open(GESTURES_FILE, "w", encoding="utf-8") as f:
                json.dump(self.gestures_data, f, indent=2)
            with open(MAPPINGS_FILE, "w", encoding="utf-8") as f:
                json.dump(self.mappings, f, indent=2)
        except Exception as e:
            print(f"[Trainer] Error saving gestures/mappings: {e}")

    def _load_model(self) -> None:
        if MODEL_FILE.exists():
            try:
                saved = joblib.load(MODEL_FILE)
                self.model = saved.get("model")
                self.classes_ = saved.get("classes", [])
                print(f"[Trainer] Loaded custom gesture model with classes: {self.classes_}")
            except Exception as e:
                print(f"[Trainer] Could not load model: {e}")
                self.model = None

    def start_recording(self, label: str, target_samples: int = 30) -> Dict[str, Any]:
        """Start a new recording session for a gesture label."""
        self.recording_label = label.strip()
        self.target_samples = target_samples
        self.recorded_samples = []
        self.is_recording = True
        return {
            "status": "recording_started",
            "label": self.recording_label,
            "target": self.target_samples,
            "current": 0,
        }

    def add_recording_sample(self, flat_landmarks: List[float]) -> Dict[str, Any]:
        """Add a landmark sample during active recording."""
        if not self.is_recording or not self.recording_label:
            return {"is_recording": False, "count": 0, "target": 0}

        if len(flat_landmarks) == 63:
            self.recorded_samples.append(flat_landmarks)

        count = len(self.recorded_samples)
        done = count >= self.target_samples

        if done:
            # Save samples to dataset
            if self.recording_label not in self.gestures_data:
                self.gestures_data[self.recording_label] = []
            self.gestures_data[self.recording_label].extend(self.recorded_samples)
            self._save_data()
            self.is_recording = False
            label_saved = self.recording_label
            self.recording_label = None
            return {
                "is_recording": False,
                "count": count,
                "target": self.target_samples,
                "done": True,
                "message": f"Successfully recorded {count} samples for '{label_saved}'",
            }

        return {
            "is_recording": True,
            "count": count,
            "target": self.target_samples,
            "done": False,
        }

    def cancel_recording(self) -> Dict[str, Any]:
        self.is_recording = False
        self.recording_label = None
        self.recorded_samples = []
        return {"status": "recording_cancelled"}

    def train_model(self) -> Dict[str, Any]:
        """Train a KNN/RandomForest classifier on all recorded samples."""
        X: List[List[float]] = []
        y: List[str] = []

        for label, samples in self.gestures_data.items():
            if len(samples) < 5:
                continue
            for s in samples:
                if len(s) == 63:
                    X.append(s)
                    y.append(label)

        unique_labels = list(set(y))
        if len(unique_labels) < 2:
            return {
                "success": False,
                "error": f"Need at least 2 distinct gestures with >= 5 samples each to train. Found: {unique_labels}",
            }

        X_arr = np.array(X, dtype=np.float32)
        y_arr = np.array(y)

        # Train a distance-weighted KNN (fast, accurate for landmark geometry)
        n_neighbors = min(5, min([y.count(l) for l in unique_labels]))
        clf = KNeighborsClassifier(n_neighbors=max(1, n_neighbors), weights="distance")
        clf.fit(X_arr, y_arr)

        self.model = clf
        self.classes_ = list(clf.classes_)

        # Persist model
        joblib.dump({"model": clf, "classes": self.classes_}, MODEL_FILE)

        return {
            "success": True,
            "classes": self.classes_,
            "total_samples": len(X),
            "message": f"Trained classifier on {len(X)} samples across {len(self.classes_)} gestures.",
        }

    def predict(self, flat_landmarks: List[float]) -> Tuple[str, float]:
        """
        Classifies 63-dim flat landmarks.
        Returns (predicted_label, confidence).
        Returns ("unknown", 0.0) if confidence < confidence_threshold.
        """
        if not self.model or len(flat_landmarks) != 63 or not self.classes_:
            return "unknown", 0.0

        try:
            sample = np.array([flat_landmarks], dtype=np.float32)
            probs = self.model.predict_proba(sample)[0]
            max_idx = int(np.argmax(probs))
            confidence = float(probs[max_idx])
            label = str(self.classes_[max_idx])

            if confidence >= self.confidence_threshold:
                return label, confidence
            return "unknown", confidence
        except Exception:
            return "unknown", 0.0

    def list_gestures(self) -> List[Dict[str, Any]]:
        """List all custom gestures, sample counts, and their mapped action."""
        result = []
        for name, samples in self.gestures_data.items():
            mapping = self.mappings.get(name, {"action": "none"})
            result.append({
                "name": name,
                "sample_count": len(samples),
                "mapping": mapping,
            })
        return result

    def delete_gesture(self, name: str) -> bool:
        """Delete a gesture and its mappings."""
        deleted = False
        if name in self.gestures_data:
            del self.gestures_data[name]
            deleted = True
        if name in self.mappings:
            del self.mappings[name]
            deleted = True
        if deleted:
            self._save_data()
            # If classes_ contained it, retrain or clear
            if name in self.classes_:
                if len(self.gestures_data) >= 2:
                    self.train_model()
                else:
                    self.model = None
                    self.classes_ = []
                    if MODEL_FILE.exists():
                        MODEL_FILE.unlink()
        return deleted

    def map_gesture_action(self, gesture_name: str, action: str, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Map a gesture to an action."""
        self.mappings[gesture_name] = {
            "action": action,
            "params": params or {},
        }
        self._save_data()
        return {"status": "mapped", "gesture": gesture_name, "action": action}
