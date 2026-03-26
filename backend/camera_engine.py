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
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.image import MIMEImage
from dotenv import load_dotenv
import requests

load_dotenv()

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

class CameraFeed:
    """Represents a single camera stream and its processing loop."""
    def __init__(self, feed_id, source, engine):
        self.feed_id = feed_id
        self.source = source # int (device index) or "remote"
        self.engine = engine
        self.cap = None
        self.frame_queue = queue.Queue(maxsize=1)
        self.remote_queue = queue.Queue(maxsize=1)
        self.running = False
        self.thread = None
        
        # Internal state for this specific feed
        self.frame_counter = 0
        self.last_detections = []
        self.last_is_target_match = False
        self.last_face_box = None
        self.pending_det = None
        self.pending_face = None

    def start(self):
        if self.running: return
        if self.source != "remote":
            self.cap = cv2.VideoCapture(self.source)
            self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 800)
            self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 600)
        
        self.running = True
        self.thread = threading.Thread(target=self._run, daemon=True)
        self.thread.start()
        print(f"[Feed-{self.feed_id}] Started source: {self.source}")

    def stop(self):
        self.running = False
        if self.thread and self.thread.is_alive():
            self.thread.join(timeout=0.5)
        if self.cap:
            self.cap.release()
            self.cap = None
        print(f"[Feed-{self.feed_id}] Stopped.")

    def push_remote_frame(self, frame_bytes: bytes):
        if self.source != "remote": return
        if self.remote_queue.full():
            try: self.remote_queue.get_nowait()
            except queue.Empty: pass
        self.remote_queue.put(frame_bytes)

    def _run(self):
        DANGER = {'weapons', 'weapon', 'violence', 'pistol', 'knife', 'guns', 'person with knife'}
        
        while self.running:
            self.frame_counter += 1
            frame = None

            if self.source == "remote":
                try:
                    raw_bytes = self.remote_queue.get(timeout=1.0)
                    frame = cv2.imdecode(np.frombuffer(raw_bytes, np.uint8), cv2.IMREAD_COLOR)
                except queue.Empty:
                    continue
            else:
                if not self.cap or not self.cap.isOpened():
                    time.sleep(0.1)
                    continue
                # Flush stale buffer
                for _ in range(4): self.cap.grab()
                ret, frame = self.cap.retrieve()
                if not ret:
                    ret, frame = self.cap.read()
                if not ret:
                    time.sleep(0.01)
                    continue

            if frame is None: continue
            
            frame = cv2.resize(frame, (800, 600))
            display_frame = frame.copy()

            # ── Collect inference results when ready (NEVER block) ────────
            if self.pending_det is not None and self.pending_det.done():
                try: self.last_detections = self.pending_det.result()
                except Exception: pass
                self.pending_det = None

            if self.pending_face is not None and self.pending_face.done():
                try: self.last_is_target_match, self.last_face_box = self.pending_face.result()
                except Exception: pass
                self.pending_face = None

            # ── Fire new inference every 5th frame (only when prev is done) ─
            if self.frame_counter % 5 == 0 and self.pending_det is None and self.pending_face is None:
                if self.engine.executor:
                    try:
                        self.pending_det = self.engine.executor.submit(self.engine._process_detections, frame.copy())
                        self.pending_face = self.engine.executor.submit(self.engine._process_face_search, frame.copy())
                    except (RuntimeError, AttributeError):
                        if not self.running: break

            # ── Draw overlays ─────────────────────────────────────────────
            for d in self.last_detections:
                x1, y1, x2, y2 = [int(v) for v in d["box"]]
                color = (0, 0, 255) if d["label"].lower() in DANGER else (0, 255, 0)
                cv2.rectangle(display_frame, (x1, y1), (x2, y2), color, 2)
                cv2.putText(display_frame, f"{d['label']} {d['confidence']:.2f}",
                            (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)

            if self.last_is_target_match and self.last_face_box:
                x1, y1, x2, y2 = self.last_face_box
                cx, cy = (x1 + x2) // 2, (y1 + y2) // 2
                r = int(max(x2 - x1, y2 - y1) * 0.65)
                cv2.circle(display_frame, (cx, cy), r, (0, 0, 255), 3)

            # ── Alerts ────────────────────────────────────────────────────
            self.engine._handle_alerts(self.feed_id, display_frame, self.last_detections, self.last_is_target_match)

            # ── Push frame to stream queue ────────────────────────────────
            _, buf = cv2.imencode('.jpg', display_frame, [cv2.IMWRITE_JPEG_QUALITY, 65])
            if self.frame_queue.full():
                try: self.frame_queue.get_nowait()
                except queue.Empty: pass
            try: self.frame_queue.put_nowait(buf.tobytes())
            except queue.Full: pass

class CameraEngine:
    def __init__(self, model_path='../model/S Model/best.pt', source=0):
        self.model = YOLO(model_path)
        try:
            if torch.cuda.is_available():
                self.model.to('cuda')
                print("[YOLO] GPU initialised.")
        except Exception: pass

        self.source_config = source # 0, "remote", or "hybrid"
        self.feeds = {} # id -> CameraFeed
        self.alert_queue = queue.Queue()
        self.running = False
        self.mode = "detection" # "detection" | "search" | "both"
        
        self.class_names = list(self.model.names.values())
        self.class_thresholds = {name: 0.5 for name in self.class_names}
        self.target_face_embedding = None

        self.sound_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'sound', 'drop.mp3'))
        
        # Cooldowns and settings
        self.last_activity_alert = 0.0
        self.activity_cooldown = 3.0
        self.last_search_alert = 0.0
        self.search_cooldown = 1.5
        self.last_sound_time = 0.0
        self.sound_cooldown = 5
        self.executor = None
        
        self.class_sounds = {name: False for name in self.class_names}
        self.search_sound_enabled = True
        self.sound_enabled = True
        self.email_enabled = True
        self.last_email_time = 0.0
        
        self.email_sender = os.getenv("SMTP_EMAIL")
        self.email_password = os.getenv("SMTP_PASSWORD")
        self.smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))

        self.camera_id = os.getenv("CAMERA_ID", "CAM-01-DYNAMIC")
        self.camera_lat, self.camera_lon = self._auto_localize()

        # Persistent target
        data_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'data'))
        os.makedirs(data_dir, exist_ok=True)
        self.persistent_path = os.path.join(data_dir, 'persistent_target.jpg')
        self._load_persistent_target()

    def _auto_localize(self):
        try:
            res = requests.get("http://ip-api.com/json/", timeout=5).json()
            if res.get("status") == "success":
                return str(res.get("lat")), str(res.get("lon"))
        except Exception: pass
        return os.getenv("CAMERA_LAT", "31.4504"), os.getenv("CAMERA_LON", "73.1350")

    def _load_persistent_target(self):
        if os.path.exists(self.persistent_path):
            self.set_search_target(self.persistent_path, persist=False)

    def _play_alert_sound(self):
        try:
            if os.path.exists(self.sound_path): playsound(self.sound_path)
        except Exception: pass

    def _send_email_alert(self, feed_id, frame_buf, detections, is_search_match=False):
        if not self.email_sender or not self.email_password: return
        try:
            msg = MIMEMultipart()
            subject = f"🚨 SmartSurv [{feed_id}]: SECURITY ALERT 🚨"
            if is_search_match: subject = f"🎯 SmartSurv [{feed_id}]: TARGET LOCATED 🎯"
            msg['Subject'], msg['From'], msg['To'] = subject, self.email_sender, self.email_sender
            
            threats = [d['label'] for d in detections]
            body = f"<h2>Alert from Feed: {feed_id}</h2><p><b>Detectors:</b> {', '.join(threats) if threats else 'Search'}</p>"
            msg.attach(MIMEText(body, 'html'))
            msg.attach(MIMEImage(frame_buf, name="incident.jpg"))

            if self.smtp_port == 465:
                with smtplib.SMTP_SSL(self.smtp_server, self.smtp_port, timeout=10) as s:
                    s.login(self.email_sender, self.email_password); s.send_message(msg)
            else:
                with smtplib.SMTP(self.smtp_server, self.smtp_port, timeout=10) as s:
                    s.starttls(); s.login(self.email_sender, self.email_password); s.send_message(msg)
        except Exception as e: print(f"[Email] Error: {e}")

    def _handle_alerts(self, feed_id, display_frame, detections, is_search_match):
        now = time.time()
        triggered = False
        
        # Activity Alert
        if detections and (now - self.last_activity_alert > self.activity_cooldown):
            self.last_activity_alert = now
            triggered = True
            if any(self.class_sounds.get(d['label'], True) for d in detections):
                if now - self.last_sound_time > self.sound_cooldown:
                    self.last_sound_time = now
                    threading.Thread(target=self._play_alert_sound, daemon=True).start()

        # Search Alert
        if is_search_match and (now - self.last_search_alert > self.search_cooldown):
            self.last_search_alert = now
            triggered = True
            if self.search_sound_enabled and (now - self.last_sound_time > self.sound_cooldown):
                self.last_sound_time = now
                threading.Thread(target=self._play_alert_sound, daemon=True).start()

        if triggered:
            _, buf = cv2.imencode('.jpg', display_frame, [cv2.IMWRITE_JPEG_QUALITY, 50])
            frame_bytes = buf.tobytes()
            if self.email_enabled and (now - self.last_email_time > 30):
                self.last_email_time = now
                threading.Thread(target=self._send_email_alert, args=(feed_id, frame_bytes, detections, is_search_match), daemon=True).start()
            
            self.alert_queue.put({
                "feed_id": feed_id,
                "timestamp": time.strftime("%H:%M:%S"),
                "detections": detections,
                "image": base64.b64encode(buf).decode('utf-8'),
                "is_person_search_match": is_search_match,
                "location": {"id": f"{self.camera_id}-{feed_id}", "lat": self.camera_lat, "lon": self.camera_lon}
            })

    def _process_detections(self, frame):
        detections = []
        if self.mode in ["detection", "both"]:
            results = self.model(frame, verbose=False)
            for box in results[0].boxes:
                label = self.model.names[int(box.cls[0])]
                conf = float(box.conf[0])
                if conf >= self.class_thresholds.get(label, 0.5):
                    detections.append({"label": label, "confidence": conf, "box": box.xyxy[0].tolist()})
        return detections

    def _process_face_search(self, frame):
        if self.mode not in ["search", "both"] or self.target_face_embedding is None:
            return False, None
        try:
            pil_frame = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
            boxes, _ = _MTCNN.detect(pil_frame)
            if boxes is None or len(boxes) == 0: return False, None
            face_tensors = _MTCNN(pil_frame)
            if face_tensors is None: return False, None
            if face_tensors.dim() == 3: face_tensors = face_tensors.unsqueeze(0)
            with torch.no_grad():
                embeddings = _RESNET(face_tensors.to(_DEVICE))
            for i, embedding in enumerate(embeddings):
                sim = torch.nn.functional.cosine_similarity(self.target_face_embedding, embedding.unsqueeze(0)).item()
                if sim > FACENET_THRESHOLD: return True, [int(b) for b in boxes[i]]
        except Exception: pass
        return False, None

    # Public API
    def start(self):
        if self.running: return
        self.executor = ThreadPoolExecutor(max_workers=4)
        self.running = True
        self._sync_feeds()

    def stop(self):
        self.running = False
        for feed in list(self.feeds.values()): feed.stop()
        self.feeds.clear()
        if self.executor: self.executor.shutdown(wait=False); self.executor = None

    def restart(self, source=None):
        if source is not None: self.source_config = source
        self.stop(); time.sleep(0.3); self.start()

    def _sync_feeds(self):
        """Update active feeds based on source_config."""
        should_have = []
        if self.source_config == "hybrid":
            should_have.append(("local", 0))
            # Remote feeds are added dynamically as they connect
        elif self.source_config == "remote":
            # Remote only mode
            pass
        else:
            # Assume it's a device index (default 0)
            try:
                idx = int(self.source_config)
                should_have.append(("local", idx))
            except: pass

        # Create missing local feeds
        for f_type, f_src in should_have:
            fid = f"camera-{f_src}"
            if fid not in self.feeds:
                f = CameraFeed(fid, f_src, self)
                self.feeds[fid] = f
                if self.running: f.start()

    def push_remote_frame(self, frame_bytes: bytes, client_id: str = "remote-1"):
        if self.source_config not in ["remote", "hybrid"]: return
        fid = f"remote-{client_id}"
        if fid not in self.feeds:
            f = CameraFeed(fid, "remote", self)
            self.feeds[fid] = f
            if self.running: f.start()
        self.feeds[fid].push_remote_frame(frame_bytes)

    def get_frame(self, feed_id=None):
        if not feed_id:
            # Return first available frame if no ID
            if not self.feeds: return None
            feed_id = list(self.feeds.keys())[0]
        if feed_id in self.feeds:
            return self.feeds[feed_id].frame_queue.get(timeout=1.0) if not self.feeds[feed_id].frame_queue.empty() else None
        return None

    def get_active_feeds(self):
        return list(self.feeds.keys())

    def get_alerts(self):
        res = []
        while not self.alert_queue.empty(): res.append(self.alert_queue.get())
        return res

    # Global settings setters
    def set_mode(self, mode): self.mode = mode
    def set_thresholds(self, t): self.class_thresholds.update({k: float(v) for k, v in t.items()})
    def set_class_sounds(self, s): self.class_sounds.update({k: bool(v) for k, v in s.items()})
    def set_search_sound_enabled(self, e): self.search_sound_enabled = e
    def set_sound_enabled(self, e): self.sound_enabled = e
    def set_email_enabled(self, e): self.email_enabled = e
    def get_class_names(self): return self.class_names
    def get_thresholds(self): return dict(self.class_thresholds)
    def get_class_sounds(self): return dict(self.class_sounds)

    def set_search_target(self, image_path: str, persist: bool = True) -> bool:
        try:
            if persist and image_path != self.persistent_path:
                shutil.copy(image_path, self.persistent_path)
                image_path = self.persistent_path
            pil_img = Image.open(image_path).convert('RGB')
            face_tensor = _MTCNN(pil_img)
            if face_tensor is None: return False
            if face_tensor.dim() == 4: face_tensor = face_tensor[0]
            with torch.no_grad():
                embedding = _RESNET(face_tensor.unsqueeze(0).to(_DEVICE))
            self.target_face_embedding = embedding
            return True
        except Exception: return False

    def clear_search_target(self):
        self.target_face_embedding = None
        if os.path.exists(self.persistent_path):
            try: os.remove(self.persistent_path)
            except: pass
