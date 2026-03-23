import cv2
import os
import sys
import contextlib
import time
import threading
import base64
import queue
import shutil
import numpy as np
from PIL import Image
from ultralytics import YOLO
from concurrent.futures import ThreadPoolExecutor
from playsound import playsound

# ── Suppress the noisy "Disabling PyTorch" stderr from transformers ──────────
with open(os.devnull, 'w') as _devnull, contextlib.redirect_stderr(_devnull):
    import torch
    from facenet_pytorch import MTCNN, InceptionResnetV1

# ─────────────────────────────────────────────────────────────────────────────
# FaceNet singleton — loaded once so every CameraEngine shares the same weights.
# ─────────────────────────────────────────────────────────────────────────────
_DEVICE = torch.device('cuda:0' if torch.cuda.is_available() else 'cpu')
print(f"[FaceNet] Loading models on: {_DEVICE}")

_MTCNN = MTCNN(
    keep_all=True,
    device=_DEVICE,
    post_process=True,
    select_largest=False,
    min_face_size=40,
)
_RESNET = InceptionResnetV1(pretrained='vggface2').eval().to(_DEVICE)

FACENET_THRESHOLD = 0.70
print("[FaceNet] Models ready.")


class CameraEngine:
    def __init__(self, model_path='../model/S Model/best.pt', source=0):

        # ── Activity Detection ───────────────────────────────────────────────
        self.model = YOLO(model_path)
        try:
            if torch.cuda.is_available():
                self.model.to('cuda')
                print("[YOLO] GPU initialised.")
        except Exception:
            pass

        self.source = source
        self.cap = cv2.VideoCapture(source)
        self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 800)
        self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 600)

        self.frame_queue = queue.Queue(maxsize=1)
        self.alert_queue = queue.Queue()
        self.running     = False
        self.thread      = None

        # Modes: "detection" | "search" | "both"
        self.mode = "detection"

        self.class_names      = list(self.model.names.values())
        self.class_thresholds = {name: 0.5 for name in self.class_names}

        # ── Person Search (FaceNet embedding) ────────────────────────────────
        self.target_face_embedding = None

        self.sound_path = os.path.abspath(
            os.path.join(os.path.dirname(__file__), '..', 'sound', 'drop.mp3')
        )

        # Cooldowns
        self.last_activity_alert = 0.0
        self.activity_cooldown   = 3.0
        self.last_search_alert   = 0.0
        self.search_cooldown     = 1.5
        self.last_sound_time     = 0.0
        self.sound_cooldown      = 5

        self.executor = None  # ThreadPoolExecutor, init'd in start()

        # Audio
        self.class_sounds         = {name: False for name in self.class_names}
        self.search_sound_enabled = True
        self.sound_enabled        = True

        # Persistent target
        data_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'data'))
        os.makedirs(data_dir, exist_ok=True)
        self.persistent_path = os.path.join(data_dir, 'persistent_target.jpg')
        self._load_persistent_target()

    # ── Internal helpers ─────────────────────────────────────────────────────

    def _load_persistent_target(self):
        if os.path.exists(self.persistent_path):
            print(f"[FaceNet] Restoring persistent target from {self.persistent_path}")
            self.set_search_target(self.persistent_path, persist=False)

    def _play_alert_sound(self):
        try:
            if os.path.exists(self.sound_path):
                playsound(self.sound_path)
        except Exception as e:
            print(f"[Sound] Error: {e}")

    # ── Public API ───────────────────────────────────────────────────────────

    def get_class_names(self) -> list:
        return self.class_names

    def get_thresholds(self) -> dict:
        return dict(self.class_thresholds)

    def set_thresholds(self, thresholds: dict):
        for name, val in thresholds.items():
            self.class_thresholds[name] = float(val)

    def set_mode(self, mode: str):
        if mode in ["detection", "search", "both"]:
            self.mode = mode

    def get_class_sounds(self) -> dict:
        return dict(self.class_sounds)

    def set_class_sounds(self, sounds: dict):
        for name, val in sounds.items():
            if name in self.class_sounds:
                self.class_sounds[name] = bool(val)
        print(f"[Audio] Class sounds: {self.class_sounds}")

    def set_search_sound_enabled(self, enabled: bool):
        self.search_sound_enabled = enabled

    def set_sound_enabled(self, enabled: bool):
        self.sound_enabled = enabled

    # ── FaceNet target enrolment ─────────────────────────────────────────────

    def set_search_target(self, image_path: str, persist: bool = True) -> bool:
        try:
            if persist and image_path != self.persistent_path:
                shutil.copy(image_path, self.persistent_path)
                image_path = self.persistent_path

            print(f"[FaceNet] Loading target: {image_path}")
            pil_img     = Image.open(image_path).convert('RGB')
            face_tensor = _MTCNN(pil_img)

            if face_tensor is None:
                print("[FaceNet] No face detected in target image.")
                return False

            if face_tensor.dim() == 4:
                face_tensor = face_tensor[0]

            with torch.no_grad():
                embedding = _RESNET(face_tensor.unsqueeze(0).to(_DEVICE))

            self.target_face_embedding = embedding
            print(f"[FaceNet] Target enrolled. Embedding shape: {embedding.shape}")
            return True

        except Exception as e:
            print(f"[FaceNet] set_search_target error: {e}")
            import traceback; traceback.print_exc()
            return False

    def clear_search_target(self):
        self.target_face_embedding = None
        if os.path.exists(self.persistent_path):
            try: os.remove(self.persistent_path)
            except Exception: pass

    # ── Camera lifecycle ─────────────────────────────────────────────────────

    def start(self):
        if not self.running:
            if self.executor is None:
                self.executor = ThreadPoolExecutor(max_workers=2)
            if self.cap is None or not self.cap.isOpened():
                self.cap = cv2.VideoCapture(self.source)
            self.running = True
            self.thread  = threading.Thread(target=self._run, daemon=True)
            self.thread.start()

    def stop(self):
        print("[Engine] Stopping…")
        self.running = False
        if self.thread:
            if self.thread.is_alive():
                try: self.thread.join(timeout=0.5)
                except RuntimeError: pass
            self.thread = None
        if self.cap:
            try:
                if self.cap.isOpened():
                    self.cap.release()
                    print("[Engine] Camera released.")
            except Exception as e:
                print(f"[Engine] Release error: {e}")
            self.cap = None
        if self.executor:
            try: self.executor.shutdown(wait=False)
            except Exception: pass
            self.executor = None

    def restart(self):
        self.stop()
        time.sleep(0.3)
        self.start()

    # ── Per-frame inference workers ──────────────────────────────────────────

    def _process_detections(self, frame):
        detections = []
        if self.mode in ["detection", "both"]:
            results = self.model(frame, verbose=False)
            for box in results[0].boxes:
                label = self.model.names[int(box.cls[0])]
                conf  = float(box.conf[0])
                if conf >= self.class_thresholds.get(label, 0.5):
                    detections.append({
                        "label":      label,
                        "confidence": conf,
                        "box":        box.xyxy[0].tolist(),
                    })
        return detections

    def _process_face_search(self, frame):
        if self.mode not in ["search", "both"]:
            return False, None
        if self.target_face_embedding is None:
            return False, None
        try:
            pil_frame = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
            boxes, _  = _MTCNN.detect(pil_frame)

            if boxes is None or len(boxes) == 0:
                return False, None

            face_tensors = _MTCNN(pil_frame)
            if face_tensors is None:
                return False, None
            if face_tensors.dim() == 3:
                face_tensors = face_tensors.unsqueeze(0)

            with torch.no_grad():
                embeddings = _RESNET(face_tensors.to(_DEVICE))

            for i, embedding in enumerate(embeddings):
                sim = torch.nn.functional.cosine_similarity(
                    self.target_face_embedding,
                    embedding.unsqueeze(0)
                ).item()
                print(f"[FaceNet] Face {i} similarity: {sim:.3f}")
                if sim > FACENET_THRESHOLD:
                    return True, [int(b) for b in boxes[i]]

        except Exception as e:
            print(f"[FaceNet] _process_face_search error: {e}")

        return False, None

    # ── Main camera loop (non-blocking inference) ────────────────────────────

    def _run(self):
        frame_counter        = 0
        last_detections      = []
        last_is_target_match = False
        last_face_box        = None

        # Futures for the in-flight inference tasks
        pending_det  = None
        pending_face = None

        DANGER = {'weapons', 'weapon', 'violence', 'pistol', 'knife', 'guns', 'person with knife'}

        while self.running:
            frame_counter += 1

            # ── Flush stale camera buffer ─────────────────────────────────
            for _ in range(4):
                self.cap.grab()

            ret, frame = self.cap.retrieve()
            if not ret:
                ret, frame = self.cap.read()
            if not ret:
                time.sleep(0.005)
                continue

            frame         = cv2.resize(frame, (800, 600))
            display_frame = frame.copy()

            if not self.executor:
                time.sleep(0.005)
                continue

            # ── Collect inference results when ready (NEVER block) ────────
            if pending_det is not None and pending_det.done():
                try:    last_detections = pending_det.result()
                except Exception: pass
                pending_det = None

            if pending_face is not None and pending_face.done():
                try:    last_is_target_match, last_face_box = pending_face.result()
                except Exception: pass
                pending_face = None

            # ── Fire new inference every 5th frame (only when prev is done) ─
            if frame_counter % 5 == 0 and pending_det is None and pending_face is None:
                try:
                    pending_det  = self.executor.submit(self._process_detections, frame.copy())
                    pending_face = self.executor.submit(self._process_face_search,  frame.copy())
                except (RuntimeError, AttributeError):
                    if not self.running: break

            # ── Draw overlays ─────────────────────────────────────────────
            for d in last_detections:
                x1, y1, x2, y2 = [int(v) for v in d["box"]]
                color = (0, 0, 255) if d["label"].lower() in DANGER else (0, 255, 0)
                cv2.rectangle(display_frame, (x1, y1), (x2, y2), color, 2)
                cv2.putText(display_frame, f"{d['label']} {d['confidence']:.2f}",
                            (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)

            if last_is_target_match and last_face_box:
                x1, y1, x2, y2 = last_face_box
                cx = (x1 + x2) // 2
                cy = (y1 + y2) // 2
                r  = int(max(x2 - x1, y2 - y1) * 0.65)
                cv2.circle(display_frame, (cx, cy), r, (0, 0, 255), 3)

            # ── Alerts ────────────────────────────────────────────────────
            now           = time.time()
            trigger_alert = False

            if last_detections and (now - self.last_activity_alert > self.activity_cooldown):
                self.last_activity_alert = now
                trigger_alert = True
                print(f"[Alert] Activity: {[d['label'] for d in last_detections]}")
                if any(self.class_sounds.get(d['label'], True) for d in last_detections):
                    if now - self.last_sound_time > self.sound_cooldown:
                        self.last_sound_time = now
                        threading.Thread(target=self._play_alert_sound, daemon=True).start()

            if last_is_target_match and (now - self.last_search_alert > self.search_cooldown):
                self.last_search_alert = now
                trigger_alert = True
                print("[Alert] TARGET FACE MATCHED!")
                if self.search_sound_enabled and (now - self.last_sound_time > self.sound_cooldown):
                    self.last_sound_time = now
                    threading.Thread(target=self._play_alert_sound, daemon=True).start()

            if trigger_alert:
                _, buf = cv2.imencode('.jpg', display_frame, [cv2.IMWRITE_JPEG_QUALITY, 50])
                self.alert_queue.put({
                    "timestamp":              time.strftime("%H:%M:%S"),
                    "detections":             last_detections,
                    "image":                  base64.b64encode(buf).decode('utf-8'),
                    "is_person_search_match": last_is_target_match,
                })

            # ── Push frame to stream queue (non-blocking) ─────────────────
            _, buf = cv2.imencode('.jpg', display_frame, [cv2.IMWRITE_JPEG_QUALITY, 65])
            if self.frame_queue.full():
                try:    self.frame_queue.get_nowait()
                except queue.Empty: pass
            try:    self.frame_queue.put_nowait(buf.tobytes())
            except queue.Full:  pass

    # ── Output API ───────────────────────────────────────────────────────────

    def get_frame(self):
        try:    return self.frame_queue.get(timeout=1)
        except queue.Empty: return None

    def get_alerts(self):
        res = []
        while not self.alert_queue.empty():
            res.append(self.alert_queue.get())
        return res
