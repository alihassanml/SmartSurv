import cv2
import os
import sys
import contextlib
import time
import threading
import base64
import queue
import shutil
import subprocess
import logging
import json as _json
import numpy as np

# Suppress OpenCV noise
os.environ["OPENCV_VIDEOIO_PRIORITY_MSMF"] = "0"
os.environ["OPENCV_LOG_LEVEL"] = "OFF"
from PIL import Image
from ultralytics import YOLO
from concurrent.futures import ThreadPoolExecutor
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.image import MIMEImage
from dotenv import load_dotenv
import requests
import open_clip

load_dotenv()

# ── Suppress the noisy "Disabling PyTorch" stderr from transformers ──────────
with open(os.devnull, 'w') as _devnull, contextlib.redirect_stderr(_devnull):
    import torch
    from facenet_pytorch import MTCNN, InceptionResnetV1

# ── Device selection: GPU if available, else CPU ─────────────────────────────
_DEVICE_GPU = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
print(f"[Device] Using: {_DEVICE_GPU}" + (f" ({torch.cuda.get_device_name(0)})" if _DEVICE_GPU.type == 'cuda' else ""))

# ─── FaceNet (Moved to GPU for maximum speed) ───────────────────────────────
_MTCNN = MTCNN(
    keep_all=True,
    device=_DEVICE_GPU, 
    post_process=True,
    select_largest=False,
    min_face_size=40, # Slightly smaller for better range
)
_RESNET = InceptionResnetV1(pretrained='vggface2').eval().to(_DEVICE_GPU)

FACENET_THRESHOLD = 0.70
print(f"[FaceNet] Models initialized on: {_DEVICE_GPU}")

print(f"[CLIP] Loading ViT-B-32 on: {_DEVICE_GPU}...")
_CLIP_MODEL, _, _CLIP_PREPROCESS = open_clip.create_model_and_transforms(
    'ViT-B-32',
    pretrained='laion2b_s34b_b79k',
    device=_DEVICE_GPU
)
_CLIP_TOKENIZER = open_clip.get_tokenizer('ViT-B-32')
print(f"[CLIP] Model initialized on: {_DEVICE_GPU}")

DANGER = ["person", "knife", "gun", "fire", "cell phone"]

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
        self.consecutive_failures = 0
        
        # Internal state for this specific feed
        self.frame_counter = 0
        self.last_detections = []
        self.last_is_target_match = False
        self.last_face_box = None
        self.pending_det = None
        self.pending_face = None
        self.quality = 65 # Default starting quality
        
        self.last_activity_alert = 0
        self.latest_frame = np.zeros((480, 640, 3), dtype=np.uint8)
        cv2.putText(self.latest_frame, "INITIALIZING FEED...", (160, 240), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (100, 100, 100), 2)
        
        



    def start(self):
        if self.running: return
        if self.source == "remote":
            pass  # Remote feeds receive frames via push_remote_frame
        elif isinstance(self.source, int):
            # Local USB/webcam
            if sys.platform.startswith('win'):
                print(f"[Feed-{self.feed_id}] Opening with CAP_MSMF...")
                self.cap = cv2.VideoCapture(self.source, cv2.CAP_MSMF)
                if not self.cap or not self.cap.isOpened():
                    print(f"[Feed-{self.feed_id}] MSMF Failed, trying CAP_DSHOW...")
                    self.cap = cv2.VideoCapture(self.source, cv2.CAP_DSHOW)
            else:
                self.cap = cv2.VideoCapture(self.source)

            if self.cap and self.cap.isOpened():
                self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
                self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
                self.cap.set(cv2.CAP_PROP_BUFFERSIZE, 3)
                self.cap.set(cv2.CAP_PROP_FPS, 30)
            else:
                print(f"[Feed-{self.feed_id}] ERROR: Could not open camera: {self.source}")
                self.running = False
                return
        else:
            # URL camera (RTSP / HTTP MJPEG)
            print(f"[Feed-{self.feed_id}] Opening URL: {self.source}")
            os.environ["OPENCV_FFMPEG_CAPTURE_OPTIONS"] = "rtsp_transport;tcp|fflags;nobuffer"
            self.cap = cv2.VideoCapture(self.source, cv2.CAP_FFMPEG)
            if not self.cap or not self.cap.isOpened():
                print(f"[Feed-{self.feed_id}] ERROR: Could not open URL: {self.source}")
                self.running = False
                return

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
        try:
            if self.remote_queue.full():
                try: self.remote_queue.get_nowait()
                except queue.Empty: pass
            self.remote_queue.put_nowait(frame_bytes)
        except queue.Full:
            pass

    def _run(self):
        DANGER = {'weapons', 'weapon', 'violence', 'pistol', 'knife', 'guns', 'person with knife'}
        
        try:
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
                        time.sleep(0.5)
                        self.consecutive_failures += 1
                        if self.consecutive_failures > 50:
                            print(f"[Feed-{self.feed_id}] FATAL: Camera not opened.")
                            break
                        continue
                        
                    # Buffer clearing logic for local cameras to prevent lag
                    if isinstance(self.source, int):
                        # Skip only 1 frame to stay real-time without losing fluidity
                        self.cap.grab()
                    
                    ret, frame = self.cap.read()
                    if not ret:
                        self.consecutive_failures += 1
                        if self.consecutive_failures > 150: 
                            print(f"[Feed-{self.feed_id}] DISCONNECTED (Max failures).")
                            break
                        time.sleep(0.01)
                        continue
                    self.consecutive_failures = 0

                if frame is None: continue
                
                # ── Measure throughput ──────────────────────────────────────────
                loop_start = time.time()
                display_frame = frame.copy()

                # ── Collect inference results when ready (NEVER block) ────────
                if self.pending_det is not None and self.pending_det.done():
                    try:
                        # Update detections and handle tracking continuity
                        self.last_detections = self.pending_det.result()
                    except Exception: pass
                    self.pending_det = None

                if self.pending_face is not None and self.pending_face.done():
                    try:
                        self.last_is_target_match, self.last_face_box = self.pending_face.result()
                    except Exception: pass
                    self.pending_face = None

                # ── Fire new inference (SMOOTH TRACKING MODE) ──
                # Reduced skip to 2 frames for higher responsiveness.
                # We use YOLO's track method to maintain object persistence.
                if self.frame_counter % 2 == 0 and self.pending_det is None:
                    if self.engine.executor:
                        try:
                            # Run with persist=True for smoother ID tracking
                            self.pending_det = self.engine.executor.submit(self.engine._process_detections, frame.copy())
                        except (RuntimeError, AttributeError):
                            if not self.running: break

                # ── Face Search (FAST GPU MODE) ──
                # Synchronized with tracking for a cohesive feel.
                if self.frame_counter % 2 == 0 and self.pending_face is None:
                    if self.engine.executor:
                        try:
                            self.pending_face = self.engine.executor.submit(self.engine._process_face_search, frame.copy(), self.feed_id)
                        except (RuntimeError, AttributeError):
                            if not self.running: break


                # ── Draw overlays ─────────────────────────────────────────────
                # We draw the latest known detections. Since we reduced skip to 2, 
                # the lag is now imperceptible ( < 60ms on GPU ).
                for d in self.last_detections:
                    x1, y1, x2, y2 = [int(v) for v in d["box"]]
                    # Use thicker, more professional borders
                    color = (0, 0, 255) if d["label"].lower() in DANGER else (0, 255, 133)
                    cv2.rectangle(display_frame, (x1, y1), (x2, y2), color, 2, cv2.LINE_AA)
                    
                    # Modern label design
                    label_text = f"{d['label'].upper()} {int(d['confidence']*100)}%"
                    (tw, th), _ = cv2.getTextSize(label_text, cv2.FONT_HERSHEY_SIMPLEX, 0.4, 1)
                    cv2.rectangle(display_frame, (x1, y1 - th - 10), (x1 + tw + 10, y1), color, -1)
                    cv2.putText(display_frame, label_text, (x1 + 5, y1 - 7),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 255, 255), 1, cv2.LINE_AA)

                if self.last_is_target_match and self.last_face_box:
                    if isinstance(self.last_face_box, list) and len(self.last_face_box) > 0 and not isinstance(self.last_face_box[0], int):
                        for face in self.last_face_box:
                            x1, y1, x2, y2 = [int(v) for v in face['box']]
                            is_target = face.get('is_target', False)
                            is_focused = face.get('is_focused', False)
                            
                            if self.engine.privacy_mode and not (is_target or is_focused):
                                face_roi = display_frame[y1:y2, x1:x2]
                                if face_roi.size > 0:
                                    blur = cv2.GaussianBlur(face_roi, (51, 51), 30)
                                    display_frame[y1:y2, x1:x2] = blur
                                    cv2.putText(display_frame, "REDACTED", (x1, y1 - 5), 
                                                cv2.FONT_HERSHEY_SIMPLEX, 0.35, (255, 255, 255), 1)
                            
                            if is_target or is_focused:
                                # Premium corner-style target markers
                                color = (0, 0, 255) if is_target else (0, 255, 255)
                                w, h = x2 - x1, y2 - y1
                                length = int(min(w, h) * 0.25)
                                # Top Left
                                cv2.line(display_frame, (x1, y1), (x1 + length, y1), color, 2)
                                cv2.line(display_frame, (x1, y1), (x1, y1 + length), color, 2)
                                # Top Right
                                cv2.line(display_frame, (x2, y1), (x2 - length, y1), color, 2)
                                cv2.line(display_frame, (x2, y1), (x2, y1 + length), color, 2)
                                # Bottom Left
                                cv2.line(display_frame, (x1, y2), (x1 + length, y2), color, 2)
                                cv2.line(display_frame, (x1, y2), (x1, y2 - length), color, 2)
                                # Bottom Right
                                cv2.line(display_frame, (x2, y2), (x2 - length, y2), color, 2)
                                cv2.line(display_frame, (x2, y2), (x2, y2 - length), color, 2)

                                tag = f"TARGET: {face.get('id')}" if is_target else f"FOCUS: {face.get('id')}"
                                cv2.putText(display_frame, tag, (x1, y1 - 10), 
                                            cv2.FONT_HERSHEY_SIMPLEX, 0.45, color, 1, cv2.LINE_AA)
                    else:
                        x1, y1, x2, y2 = self.last_face_box
                        cv2.rectangle(display_frame, (x1, y1), (x2, y2), (0, 255, 133), 2, cv2.LINE_AA)

                # ── Handle Alerts & Re-ID ────────────────────────────────────
                # ── Draw HUD (Latency & Performance) ─────────────────────────
                latency_ms = (time.time() - loop_start) * 1000
                inf_tag = "CUDA" if torch.cuda.is_available() else "CPU"
                fps_tag = f"FPS: {int(1.0/(time.time() - loop_start + 0.001))} | LAT: {latency_ms:.1f}ms"
                fps_tag = f"SRC: {int(getattr(self.cap, 'get', lambda x: 30)(cv2.CAP_PROP_FPS) or 30)}FPS" if self.source != "remote" else "REMOTE"
                
                # Tactical Glass-Style HUD in corner
                overlay = display_frame.copy()
                cv2.rectangle(overlay, (5, 5), (170, 32), (30, 20, 10), -1)
                cv2.addWeighted(overlay, 0.6, display_frame, 0.4, 0, display_frame)
                cv2.rectangle(display_frame, (5, 5), (170, 32), (150, 100, 50), 1)
                
                cv2.putText(display_frame, f"{inf_tag} | {fps_tag}", (12, 22),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.38, (0, 255, 133), 1, cv2.LINE_AA)

                self.engine._handle_alerts(self.feed_id, display_frame, self.last_detections, self.last_is_target_match)

                # ── Update latest raw frame for WebRTC ───────────────────────
                self.latest_frame = display_frame

                # ── Adaptive Quality (Netflix-style) ─────────────────────────
                # Dynamically adjust JPEG quality based on processing latency
                elapsed = time.time() - loop_start
                if elapsed > 0.10: # System is struggling ( < 10 FPS capability )
                    self.quality = max(25, self.quality - 5)
                elif elapsed < 0.04: # System is fast ( > 25 FPS capability )
                    self.quality = min(85, self.quality + 1)

                # ── Push frame to stream queue ────────────────────────────────
                _, buf = cv2.imencode('.jpg', display_frame, [cv2.IMWRITE_JPEG_QUALITY, self.quality])
                if self.frame_queue.full():
                    try: self.frame_queue.get_nowait()
                    except queue.Empty: pass
                try: self.frame_queue.put_nowait(buf.tobytes())
                except queue.Full: pass
        except Exception as e:
            print(f"[Feed-{self.feed_id}] CRITICAL ERROR in loop: {e}")
        finally:
            self.running = False
            print(f"[Feed-{self.feed_id}] Thread exiting.")




class CameraEngine:
    def __init__(self, model_path='../model/S2 Model/best.pt', source=0):
        self.model = YOLO(model_path)
        # Initialize on GPU if available
        self.model.to(_DEVICE_GPU)
        print(f"[YOLO] Initialized on: {_DEVICE_GPU}")

        self.source_config = source # 0, "remote", or "hybrid"
        self.feeds = {} # id -> CameraFeed
        self.alert_queue = queue.Queue()
        self.person_events_queue = queue.Queue()  # streams detected persons with face crops
        self.running = False
        self.mode = "detection" # "detection" | "search" | "both"
        
        self.class_names = list(self.model.names.values())
        self.class_thresholds = {name: 0.5 for name in self.class_names}
        self.watchlist = {} # name -> embedding
        self.reid_buffer = [] # list of {"id": str, "embedding": tensor, "last_feed": str, "last_seen": float}
        self.reid_threshold = 0.75
        self.reid_lock = threading.Lock()
        self.focused_person_id = None # PID currently under active monitoring focus


        self.sound_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'sound', 'drop.mp3'))
        self.privacy_mode = False # Blurs unauthorized faces in live view

        # Cooldowns and settings
        self.last_activity_alert = 0.0
        self.activity_cooldown = 3.0
        self.last_search_alert = 0.0
        self.search_cooldown = 1.5
        self.last_sound_time = 0.0
        self.sound_cooldown = 1.0  # Reduced from 5s to 1s for responsive audio feedback
        self.sound_played_events = set() # Track IDs of persons who already beeped this session
        self.executor = None

        # ── Dedicated sound subprocess ────────────────────────────────────────
        # MP3 alert beep runs in a separate OS process.
        # Uses subprocess.Popen (not multiprocessing) to avoid the Windows
        # 'spawn' bootstrapping issue that re-imports main.py on process start.
        # Commands are sent as JSON lines to the worker's stdin.
        _worker_script = os.path.abspath(os.path.join(os.path.dirname(__file__), 'sound_worker.py'))
        _no_window = subprocess.CREATE_NO_WINDOW if sys.platform == 'win32' else 0
        self._sound_cmd_queue = queue.Queue(maxsize=10)  # internal thread-safe queue
        try:
            self._sound_proc = subprocess.Popen(
                [sys.executable, _worker_script],
                stdin=subprocess.PIPE,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                creationflags=_no_window,
            )
            print(f'[Sound] Worker process started (PID {self._sound_proc.pid}).')
            # Writer thread: drains _sound_cmd_queue → writes JSON to subprocess stdin
            self._sound_writer_thread = threading.Thread(target=self._sound_writer, daemon=True)
            self._sound_writer_thread.start()
        except Exception as e:
            print(f'[Sound] Failed to start worker process: {e}')
            self._sound_proc = None

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

        # Persistent targets
        self.watchlist_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'data', 'watchlist'))
        os.makedirs(self.watchlist_dir, exist_ok=True)
        self._load_watchlist()

    def _load_watchlist(self):
        if not os.path.exists(self.watchlist_dir): return
        for filename in os.listdir(self.watchlist_dir):
            if filename.endswith(('.jpg', '.jpeg', '.png')):
                name = os.path.splitext(filename)[0]
                self.add_to_watchlist(name, os.path.join(self.watchlist_dir, filename), persist=False)


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

    def _sound_writer(self):
        """Daemon thread: drains _sound_cmd_queue and writes JSON commands to sound worker stdin."""
        while True:
            try:
                cmd = self._sound_cmd_queue.get()
                if cmd is None:  # shutdown sentinel
                    break
                if self._sound_proc and self._sound_proc.stdin:
                    line = _json.dumps(cmd) + '\n'
                    self._sound_proc.stdin.write(line.encode())
                    self._sound_proc.stdin.flush()
            except Exception as e:
                print(f'[Sound] Writer error: {e}')

    def _play_alert_sound(self):
        """Queue an MP3 alert beep to the sound worker process (non-blocking)."""
        if not self.sound_enabled or not self._sound_proc:
            print(f"[Sound] Skipped: enabled={self.sound_enabled}, proc={self._sound_proc is not None}")
            return
        try:
            self._sound_cmd_queue.put_nowait({'cmd': 'play', 'path': self.sound_path})
            print(f"[Sound] Queued: {self.sound_path}")
        except queue.Full:
            pass  # drop if queue is full — audio is best-effort

    def _send_email_alert(self, feed_id, frame_buf, detections, is_search_match=False):
        if not self.email_sender or not self.email_password: return
        try:
            msg = MIMEMultipart()
            timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
            
            # Dynamic Subject based on detection type
            if is_search_match:
                subject = f"🎯 TARGET LOCATED | {feed_id} | SmartSurv"
            elif any(d['label'].lower() in ["knife", "gun"] for d in detections):
                subject = f"🚨 CRITICAL THREAT: WEAPON | {feed_id} | SmartSurv"
            else:
                subject = f"🔔 Activity Detected | {feed_id} | SmartSurv"
                
            msg['Subject'], msg['From'], msg['To'] = subject, self.email_sender, self.email_sender
            
            threats = [f"{d['label'].upper()} ({round(d['confidence'] * 100)}%)" for d in detections]
            threat_list_html = "".join([f"<li><b>{t}</b></li>" for t in threats])
            
            body = f"""
            <div style="font-family: sans-serif; max-width: 600px; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
                <div style="background: #191c1e; padding: 20px; color: #2480ff; text-align: center;">
                    <h1 style="margin: 0; font-size: 24px;">SmartSurv Security</h1>
                    <p style="margin: 5px 0 0; color: #74777d; font-size: 12px; letter-spacing: 2px;">AUTOMATED INCIDENT ALERT</p>
                </div>
                <div style="padding: 24px; background: #ffffff;">
                    <div style="margin-bottom: 20px;">
                        <span style="display: inline-block; padding: 4px 12px; background: #f0f4f8; color: #191c1e; font-size: 10px; font-weight: bold; border-radius: 4px; text-transform: uppercase;">
                            {"WATCHLIST_MATCH" if is_search_match else "AUTONOMOUS_DETECTION"}
                        </span>
                    </div>
                    <p style="color: #44474c; font-size: 14px; line-height: 1.6;">
                        An incident was captured on <b>{feed_id}</b> at <b>{timestamp}</b>.
                    </p>
                    
                    <h3 style="color: #191c1e; font-size: 16px; margin-top: 24px;">Detected Activity:</h3>
                    <ul style="color: #44474c; font-size: 14px;">
                        {threat_list_html if threats else "<li>Biometric Match (Watchlist)</li>"}
                    </ul>
                    
                    <p style="color: #74777d; font-size: 12px; margin-top: 20px; font-style: italic;">
                        Please log in to the SmartSurv Control Center for real-time verification and response.
                    </p>
                </div>
                <div style="background: #f8f9fa; padding: 15px; border-top: 1px solid #e0e0e0; text-align: center;">
                    <p style="margin: 0; color: #adb5bd; font-size: 10px;">
                        &copy; SmartSurv AI Surveillance System | Confidential Information
                    </p>
                </div>
            </div>
            """
            msg.attach(MIMEText(body, 'html'))
            
            # Attach evidence image
            image = MIMEImage(frame_buf, name="incident.jpg")
            image.add_header('Content-ID', '<incident_image>')
            msg.attach(image)

            if self.smtp_port == 465:
                with smtplib.SMTP_SSL(self.smtp_server, self.smtp_port, timeout=10) as s:
                    s.login(self.email_sender, self.email_password); s.send_message(msg)
            else:
                with smtplib.SMTP(self.smtp_server, self.smtp_port, timeout=10) as s:
                    s.starttls(); s.login(self.email_sender, self.email_password); s.send_message(msg)
            print(f"[Email] Alert sent for {feed_id}")
        except Exception as e: print(f"[Email] Error: {e}")

    def _handle_alerts(self, feed_id, display_frame, detections, is_search_match):
        now = time.time()
        triggered = False
        
        # Activity Alert (Object Detection)
        if detections:
            # We track "object" alert cooldown globally as objects don't have stable IDs yet
            if (now - self.last_activity_alert > self.activity_cooldown):
                self.last_activity_alert = now
                triggered = True
                should_play_sound = self.sound_enabled or any(self.class_sounds.get(d['label'], False) for d in detections)
                if should_play_sound and (now - self.last_sound_time > 10.0): # 10s gap for same-object repeat
                    self.last_sound_time = now
                    self._play_alert_sound()

        # Search Alert (person/watchlist match)
        if is_search_match:
            # Extract person ID if available from the search result
            person_id = "unknown"
            if isinstance(is_search_match, list) and len(is_search_match) > 0:
                person_id = is_search_match[0].get('id', 'unknown')
            elif isinstance(is_search_match, dict):
                person_id = is_search_match.get('id', 'unknown')
            elif isinstance(is_search_match, str):
                person_id = is_search_match

            if person_id not in self.sound_played_events:
                # Play sound ONLY ONCE per person encounter
                self.sound_played_events.add(person_id)
                triggered = True
                if (self.search_sound_enabled or self.sound_enabled) and (now - self.last_sound_time > self.sound_cooldown):
                    self.last_sound_time = now
                    self._play_alert_sound()
            else:
                # Still trigger the 'alert' (for the log) but don't re-play the sound
                if (now - self.last_search_alert > self.search_cooldown):
                    self.last_search_alert = now
                    triggered = True

        if triggered:
            # Prevent log spam: Only record same person once every 2 minutes
            if is_search_match:
                last_log = getattr(self, f"last_log_{person_id}", 0)
                if (now - last_log < 60):
                    triggered = False
            
            if triggered:
                if is_search_match: setattr(self, f"last_log_{person_id}", now)
                try:
                    _, buf = cv2.imencode('.jpg', display_frame, [cv2.IMWRITE_JPEG_QUALITY, 50])
                    frame_bytes = buf.tobytes()
                    if self.email_enabled and (now - self.last_email_time > 30):
                        self.last_email_time = now
                        threading.Thread(target=self._send_email_alert, args=(feed_id, frame_bytes, detections, is_search_match), daemon=True).start()

                    alert = {
                        "feed_id": feed_id,
                        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
                        "detections": [{"label": d["label"], "confidence": float(d["confidence"]), "box": [float(v) for v in d["box"]]} for d in detections],
                        "image": base64.b64encode(buf).decode('utf-8'),
                        "is_person_search_match": bool(is_search_match),
                        "backend_ts": now * 1000, # ms since epoch
                        "location": {"id": f"{self.camera_id}-{feed_id}", "lat": self.camera_lat, "lon": self.camera_lon}
                    }
                    self.alert_queue.put(alert)
                    
                    # Enhanced Logging
                    reason = "WATCHLIST_MATCH" if is_search_match else f"DETECTED:{[d['label'] for d in detections]}"
                    print(f"[Alert] Queued — feed={feed_id} reason={reason} (q:{self.alert_queue.qsize()})")
                except Exception as e:
                    print(f"[Alert] Error building alert: {e}")

    def _process_detections(self, frame):
        detections = []
        if self.mode in ["detection", "both"]:
            # Use .track() for smoother persistence and motion stability
            results = self.model.track(frame, persist=True, verbose=False, imgsz=640, device=_DEVICE_GPU, tracker="botsort.yaml")
            if results and results[0].boxes:
                for box in results[0].boxes:
                    label = self.model.names[int(box.cls[0])]
                    conf = float(box.conf[0])
                    
                    # Special threshold for danger items (Recall > Precision for safety)
                    threshold = self.class_thresholds.get(label, 0.5)
                    if label.lower() in ["knife", "gun"]:
                        threshold = 0.25 # Be more sensitive to weapons
                    
                    if conf >= threshold:
                        detections.append({"label": label, "confidence": conf, "box": box.xyxy[0].tolist()})
        return detections

    def _process_face_search(self, frame, feed_id):
        if self.mode not in ["search", "both"]:
            # Still run Re-ID even in detection-only mode to populate person panel
            pass
        try:
            pil_frame = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
            # Single MTCNN pass: detect boxes and extract aligned faces at once
            boxes, probs = _MTCNN.detect(pil_frame)
            if boxes is None or len(boxes) == 0: return False, []
            # Extract aligned face crops from pre-detected boxes (no re-detection)
            face_tensors = _MTCNN.extract(pil_frame, boxes, save_path=None)
            if face_tensors is None: return False, []
            if not isinstance(face_tensors, torch.Tensor):
                face_tensors = torch.stack([t for t in face_tensors if t is not None])
            if face_tensors.dim() == 3: face_tensors = face_tensors.unsqueeze(0)
            with torch.no_grad():
                # Ensure input is on same device as model (_DEVICE_GPU)
                embeddings = _RESNET(face_tensors.to(_DEVICE_GPU))

            def _extract_face_crop(box, frame_bgr):
                """Crop face from frame and return base64 JPEG."""
                try:
                    x1, y1, x2, y2 = [max(0, int(b)) for b in box]
                    # Add 20% padding around the face
                    pad_x = int((x2 - x1) * 0.2)
                    pad_y = int((y2 - y1) * 0.2)
                    h, w = frame_bgr.shape[:2]
                    x1 = max(0, x1 - pad_x); y1 = max(0, y1 - pad_y)
                    x2 = min(w, x2 + pad_x); y2 = min(h, y2 + pad_y)
                    crop = frame_bgr[y1:y2, x1:x2]
                    if crop.size == 0: return None
                    crop_resized = cv2.resize(crop, (80, 80))
                    _, buf = cv2.imencode('.jpg', crop_resized, [cv2.IMWRITE_JPEG_QUALITY, 70])
                    return base64.b64encode(buf).decode('utf-8')
                except Exception:
                    return None

            def _match_face_task(i, embedding):
                face_crop = _extract_face_crop(boxes[i], frame)

                # 1. Watchlist match
                if self.mode in ["search", "both"]:
                    best_match = None
                    with self.reid_lock:
                        if self.watchlist:
                            wl_keys = list(self.watchlist.keys())
                            if not wl_keys: return None
                            
                            wl_embs = torch.stack(list(self.watchlist.values())).view(len(wl_keys), -1).to(_DEVICE_GPU)
                            sims = torch.nn.functional.cosine_similarity(wl_embs, embedding.unsqueeze(0).to(_DEVICE_GPU))
                            best_sim, best_idx = torch.max(sims, dim=0)
                            if best_sim.item() > FACENET_THRESHOLD:
                                best_match = wl_keys[best_idx.item()]
                    if best_match:
                        # Run reid to update buffer / emit event
                        self._process_reid(embedding, feed_id, face_crop_b64=face_crop)
                        return f"TARGET: {best_match}", [int(b) for b in boxes[i]]

                # 2. Re-ID — always run so persons panel is populated in any mode
                reid_match = self._process_reid(embedding, feed_id, face_crop_b64=face_crop, frame=frame, box=boxes[i])
                if reid_match:
                    return f"RE-ID: {reid_match}", [int(b) for b in boxes[i]]
                return None

            all_results = []
            one_is_match = False
            # Simple sequential loop — avoids spawning a new thread pool per frame.
            # Face count is typically 1-3, so loop overhead is negligible.
            for i, emb in enumerate(embeddings):
                res = _match_face_task(i, emb)
                if res:
                    label, box = res
                    pid = label.split(":")[-1].strip()
                    is_target = "TARGET" in label
                    is_focused = (pid == self.focused_person_id)
                    all_results.append({
                        "id": pid,
                        "box": box,
                        "is_target": is_target,
                        "is_focused": is_focused
                    })
                    if is_target or is_focused: one_is_match = True

            # Return all faces so engine can blur non-targets in privacy mode
            return one_is_match, all_results

        except Exception:
            pass
        return False, []

    def _extract_semantic_embedding(self, frame_bgr, box=None):
        """Extract CLIP embedding for a person crop (High-level traits)."""
        try:
            if box:
                x1, y1, x2, y2 = [max(0, int(b)) for b in box]
                crop = frame_bgr[y1:y2, x1:x2]
                if crop.size == 0: return None
                pil_img = Image.fromarray(cv2.cvtColor(crop, cv2.COLOR_BGR2RGB))
            else:
                pil_img = Image.fromarray(cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB))
            
            img_input = _CLIP_PREPROCESS(pil_img).unsqueeze(0).to(_DEVICE_GPU)
            with torch.no_grad():
                emb = _CLIP_MODEL.encode_image(img_input)
                emb /= emb.norm(dim=-1, keepdim=True)
            return emb
        except Exception:
            return None

    def _process_reid(self, embedding, feed_id, face_crop_b64=None, frame=None, box=None):
        """Track persons across feeds with a 5-minute re-show cooldown."""
        now = time.time()
        SHOW_COOLDOWN = 300  # 5 minutes in seconds
        STALE_TIMEOUT = 120    # 2 minutes gone = encounter over, sound can play again
        
        with self.reid_lock:
            # Clean old Re-ID entries (> 10 mins)
            self.reid_buffer = [e for e in self.reid_buffer if now - e['last_seen'] < 600]
            # Reset sound flags for people who have been gone for STALE_TIMEOUT
            stale_ids = [e['id'] for e in self.reid_buffer if now - e['last_seen'] > STALE_TIMEOUT]
            for sid in stale_ids:
                if sid in self.sound_played_events:
                    self.sound_played_events.remove(sid)
            
            best_match = None
            
            if self.reid_buffer:
                # Vectorized Cosine Similarity on GPU
                rb_embs = torch.stack([e['embedding'] for e in self.reid_buffer]).view(len(self.reid_buffer), -1).to(_DEVICE_GPU)
                sims = torch.nn.functional.cosine_similarity(rb_embs, embedding.unsqueeze(0).to(_DEVICE_GPU))
                best_sim, best_idx = torch.max(sims, dim=0)
                
                if best_sim.item() > self.reid_threshold:
                    best_match = self.reid_buffer[best_idx.item()]
            
            # Extract semantic traits only for brand-new persons (expensive CLIP call)
            semantic_emb = None
            if frame is not None and box is not None and best_match is None:
                semantic_emb = self._extract_semantic_embedding(frame, box)
            
            if best_match:
                # Person found — check if they should be shown again
                prev_feed = best_match['last_feed']
                time_since_shown = now - best_match.get('last_shown', 0)
                best_match['last_seen'] = now
                best_match['last_feed'] = feed_id
                
                # Update semantic traits if new one is better/available
                if semantic_emb is not None:
                    best_match['semantic_emb'] = semantic_emb
                
                if time_since_shown > SHOW_COOLDOWN and face_crop_b64:
                    # Reappeared after 5 mins — show them again
                    best_match['last_shown'] = now
                    self.person_events_queue.put({
                        "person_id": best_match['id'],
                        "feed_id": feed_id,
                        "face": face_crop_b64,
                        "timestamp": time.strftime("%H:%M:%S"),
                        "status": "REAPPEARED",
                        "is_focused": (best_match['id'] == self.focused_person_id),
                        "traits": best_match.get('traits_description', 'UNKNOWN_TRAITS')
                    })
                
                if prev_feed != feed_id:
                    return f"SAME_AS_{best_match['id']} (f:{prev_feed})"
                return None  # Same feed, just update
            else:
                # Brand new person
                pid = f"P-{len(self.reid_buffer) + 1:03d}"
                entry = {
                    "id": pid,
                    "embedding": embedding.unsqueeze(0).to('cpu'),
                    "semantic_emb": semantic_emb,
                    "last_feed": feed_id,
                    "last_seen": now,
                    "last_shown": now,
                }
                self.reid_buffer.append(entry)
                # Emit new person event
                if face_crop_b64:
                    self.person_events_queue.put({
                        "person_id": pid,
                        "feed_id": feed_id,
                        "face": face_crop_b64,
                        "timestamp": time.strftime("%H:%M:%S"),
                        "status": "NEW",
                        "is_focused": (pid == self.focused_person_id),
                        "traits": "ANALYZING..."
                    })
                return pid



    # Public API
    def start(self):
        if self.running: return
        self.executor = ThreadPoolExecutor(max_workers=6)
        self.running = True
        self._sync_feeds()
        for f in self.feeds.values(): f.start()
        
        # Start hardware watchdog thread for Auto-Detection
        self._watchdog_thread = threading.Thread(target=self._hardware_watchdog, daemon=True)
        self._watchdog_thread.start()
        print("[Sound] System started — audio alerts active.")

    def _hardware_watchdog(self):
        """Periodically scans for new cameras or disconnected ones."""
        while self.running:
            try:
                self._sync_feeds()
            except Exception as e:
                print(f"[Watchdog] Sync error: {e}")
            # If cameras are active, scan much less frequently to avoid driver interference
            # Hardware probing is a heavy blocking operation on Windows
            interval = 300.0 if self.feeds else 30.0 
            time.sleep(interval)

    def stop(self):
        self.running = False
        for feed in list(self.feeds.values()): feed.stop()
        self.feeds.clear()
        if self.executor: self.executor.shutdown(wait=False); self.executor = None
        # Shutdown sound worker subprocess gracefully
        try:
            self._sound_cmd_queue.put_nowait(None)  # stop writer thread
        except Exception:
            pass
        try:
            if self._sound_proc and self._sound_proc.stdin:
                self._sound_proc.stdin.write(b'{"cmd": "stop"}\n')
                self._sound_proc.stdin.flush()
                self._sound_proc.stdin.close()
            if self._sound_proc:
                self._sound_proc.wait(timeout=3.0)
        except Exception:
            try:
                if self._sound_proc: self._sound_proc.terminate()
            except Exception:
                pass

    def restart(self, source=None):
        if source is not None: self.source_config = source
        self.stop(); time.sleep(0.3); self.start()

    def _sync_feeds(self):
        """Update active feeds based on source_config."""
        should_have_fids = []
        should_have_configs = []
        
        # 1. Determine which feeds we SHOULD have
        if self.source_config in ["auto", "hybrid"]:
            indices = self._scan_hardware()
            for idx in indices:
                fid = f"cam-{idx}"
                should_have_fids.append(fid)
                should_have_configs.append(("local", idx))
        elif self.source_config == "remote":
            pass
        else:
            try:
                idx = int(self.source_config)
                fid = f"cam-{idx}"
                should_have_fids.append(fid)
                should_have_configs.append(("local", idx))
            except (ValueError, TypeError):
                pass

        # 2. Prune feeds that are either dead or no longer requested
        for fid in list(self.feeds.keys()):
            # Remote and URL feeds are managed externally — only prune if dead
            if fid.startswith("remote-") or fid.startswith("url-"):
                if not self.feeds[fid].running:
                    print(f"[Engine] Pruning dead feed: {fid}")
                    del self.feeds[fid]
                continue

            if fid not in should_have_fids or not self.feeds[fid].running:
                print(f"[Engine] Pruning feed: {fid} (running={self.feeds[fid].running})")
                self.feeds[fid].stop()
                del self.feeds[fid]

        # 3. Start missing feeds
        for f_type, f_src in should_have_configs:
            fid = f"cam-{f_src}"
            if fid not in self.feeds:
                print(f"[Engine] Adding new feed: {fid}")
                f = CameraFeed(fid, f_src, self)
                self.feeds[fid] = f
                if self.running: 
                    f.start()
                    time.sleep(1.0) 

    def _scan_hardware(self):
        """Scan system for available camera indices."""
        available = []
        active_indices = [f.source for f in self.feeds.values() if isinstance(f.source, int)]
        
        # Sequential scan: Parallel probing often causes "can't grab frame" on Windows drivers
        for i in range(5): # Check first 5 indices
            if i in active_indices:
                available.append(i)
                continue
            
            try:
                # Probing can be destructive on Windows if another camera is active.
                # We use a very fast probe here.
                c = cv2.VideoCapture(i, cv2.CAP_ANY)
                if c is not None and c.isOpened():
                    # Check if we can actually read a frame
                    ret, _ = c.read()
                    if ret:
                        available.append(i)
                    c.release()
                elif c is not None:
                    c.release()
            except Exception: 
                pass
                
        return available

    def push_remote_frame(self, frame_bytes: bytes, client_id: str = "remote-1"):
        fid = f"remote-{client_id}"
        if fid not in self.feeds:
            f = CameraFeed(fid, "remote", self)
            self.feeds[fid] = f
            if self.running: f.start()
        self.feeds[fid].push_remote_frame(frame_bytes)

    def add_url_camera(self, cam_id: str, url: str):
        """Start an online camera feed by URL (RTSP / HTTP MJPEG)."""
        if cam_id in self.feeds and self.feeds[cam_id].running:
            return
        if not self.running:
            self.start()
        f = CameraFeed(cam_id, url, self)
        self.feeds[cam_id] = f
        f.start()
        print(f"[Engine] URL camera added: {cam_id} ({url})")

    def remove_url_camera(self, cam_id: str):
        """Stop and remove an online camera feed."""
        if cam_id in self.feeds:
            self.feeds[cam_id].stop()
            del self.feeds[cam_id]
            print(f"[Engine] URL camera removed: {cam_id}")

    def get_raw_frame(self, feed_id=None):
        if not feed_id:
            if not self.feeds: return None
            feed_id = list(self.feeds.keys())[0]
        if feed_id in self.feeds:
            return self.feeds[feed_id].latest_frame
        return None

    def get_frame(self, feed_id=None):
        if not feed_id:
            # Return first available frame if no ID
            if not self.feeds: return None
            feed_id = list(self.feeds.keys())[0]
        if feed_id in self.feeds:
            return self.feeds[feed_id].latest_frame
        return None

    def get_jpeg_frame(self, feed_id=None):
        frame = self.get_frame(feed_id)
        if frame is not None:
            _, buf = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 60])
            return buf.tobytes()
        return None

    def get_active_feeds(self):
        return list(self.feeds.keys())

    def get_alerts(self):
        res = []
        while not self.alert_queue.empty(): res.append(self.alert_queue.get())
        return res

    def get_person_events(self):
        """Return all queued person-detection events (face crops + IDs)."""
        res = []
        while not self.person_events_queue.empty(): res.append(self.person_events_queue.get())
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


    def add_to_watchlist(self, name: str, image_path: str, persist: bool = True) -> bool:
        try:
            dest_path = os.path.join(self.watchlist_dir, f"{name}.jpg")
            if persist and image_path != dest_path:
                shutil.copy(image_path, dest_path)
                image_path = dest_path
            
            pil_img = Image.open(image_path).convert('RGB')
            face_tensor = _MTCNN(pil_img)
            if face_tensor is None: return False
            if face_tensor.dim() == 4: face_tensor = face_tensor[0]
            with torch.no_grad():
                embedding = _RESNET(face_tensor.unsqueeze(0).to(_DEVICE_GPU))
            with self.reid_lock:
                self.watchlist[name] = embedding
            return True
        except Exception: return False

    def remove_from_watchlist(self, name: str):
        with self.reid_lock:
            if name in self.watchlist:
                del self.watchlist[name]
        p = os.path.join(self.watchlist_dir, f"{name}.jpg")
        if os.path.exists(p):
            try: os.remove(p)
            except: pass

    def rename_watchlist(self, old_name: str, new_name: str) -> bool:
        if not new_name or new_name == old_name:
            return False
        with self.reid_lock:
            if old_name not in self.watchlist:
                return False
            if new_name in self.watchlist:
                return False
            self.watchlist[new_name] = self.watchlist.pop(old_name)
        old_path = os.path.join(self.watchlist_dir, f"{old_name}.jpg")
        new_path = os.path.join(self.watchlist_dir, f"{new_name}.jpg")
        if os.path.exists(old_path):
            try: os.rename(old_path, new_path)
            except: pass
        return True

    def get_watchlist_names(self):
        return list(self.watchlist.keys())

    def get_watchlist_data(self):
        res = []

        for name in self.watchlist.keys():
            p = os.path.join(self.watchlist_dir, f"{name}.jpg")
            if os.path.exists(p):
                with open(p, "rb") as f:
                    res.append({
                        "name": name,
                        "image": base64.b64encode(f.read()).decode('utf-8')
                    })
            else:
                res.append({"name": name, "image": None})
        return res

    def set_focus(self, person_id):
        """Set a specific person ID to be flagged as focused in all streams."""
        with self.reid_lock:
            self.focused_person_id = person_id
            print(f"[Focus] Identity locked: {person_id}")
            return True

    def set_privacy_mode(self, enabled: bool):
        self.privacy_mode = enabled
        print(f"[Privacy] Guard active: {enabled}")
        return True

    def get_semantic_search(self, query_text):
        """Query the Re-ID buffer using natural language."""
        if not self.reid_buffer or not query_text: return []
        
        try:
            # Tokenize and encode text
            text_tokens = _CLIP_TOKENIZER([query_text]).to(_DEVICE_GPU)
            with torch.no_grad():
                text_emb = _CLIP_MODEL.encode_text(text_tokens)
                text_emb /= text_emb.norm(dim=-1, keepdim=True)
            
            scores = []
            for entry in self.reid_buffer:
                if entry.get('semantic_emb') is None: continue
                # Compute cosine similarity
                sim = torch.nn.functional.cosine_similarity(text_emb, entry['semantic_emb'])
                scores.append({
                    "id": entry['id'],
                    "score": float(sim.item())
                })
            
            # Sort by highest similarity
            scores.sort(key=lambda x: x['score'], reverse=True)
            return scores
        except Exception as e:
            print(f"[Search Engine] Error: {e}")
            return []


