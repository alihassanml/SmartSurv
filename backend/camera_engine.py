import cv2
import time
import threading
import base64
from ultralytics import YOLO
import queue
import face_recognition
import numpy as np
import os
from playsound import playsound
from concurrent.futures import ThreadPoolExecutor
import shutil

class CameraEngine:
    def __init__(self, model_path='../model/S Model/best.pt', source=0):
        # 1. ACTIVITY DETECTION (Your Weapon/Violence Model)
        self.model = YOLO(model_path)
        
        try:
            import torch
            if torch.cuda.is_available():
                self.model.to('cuda')
                print("GPU context initialized for Activity Detection.")
        except:
            pass
            
        self.source = source
        self.cap = cv2.VideoCapture(source)
        self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 800)
        self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 600)
        
        self.frame_queue = queue.Queue(maxsize=1)
        self.alert_queue = queue.Queue()
        self.running = False
        self.thread = None
        self.last_alert_time = 0.0
        self.alert_cooldown = 3

        # Modes: "detection", "search", "both"
        self.mode = "detection"

        # Activity Thresholds
        self.class_names = list(self.model.names.values())
        self.class_thresholds = { name: 0.5 for name in self.class_names }
        
        # 2. PERSON SEARCH (Separated Face Recognition)
        self.target_face_encoding = None
        self.sound_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'sound', 'drop.mp3'))
        
        # Cooldowns
        self.last_activity_alert = 0.0
        self.activity_cooldown = 3.0
        
        self.last_search_alert = 0.0
        self.search_cooldown = 1.5  # Reduced from 4.0
        
        self.last_sound_time = 0.0
        self.sound_cooldown = 5
        
        # Thread Pool for heavy lifting (initialized in start)
        self.executor = None
        
        # Audio Settings (Per-class toggles)
        self.class_sounds = { name: False for name in self.class_names }
        self.search_sound_enabled = True # Specific toggle for Person Search
        
        self.sound_enabled = True # Master switch
        
        # Load persistent target on startup
        data_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'data'))
        os.makedirs(data_dir, exist_ok=True)
        self.persistent_path = os.path.join(data_dir, 'persistent_target.jpg')
        self._load_persistent_target()

    def _load_persistent_target(self):
        if os.path.exists(self.persistent_path):
            print(f"DEBUG: Restoring persistent search target from {self.persistent_path}")
            self.set_search_target(self.persistent_path, persist=False)

    def get_class_names(self) -> list[str]:
        return self.class_names

    def get_thresholds(self) -> dict[str, float]:
        return dict(self.class_thresholds)

    def set_thresholds(self, thresholds: dict[str, float]):
        for name, val in thresholds.items():
            self.class_thresholds[name] = float(val)

    def set_mode(self, mode: str):
        if mode in ["detection", "search", "both"]:
            self.mode = mode

    def get_class_sounds(self) -> dict[str, bool]:
        return dict(self.class_sounds)

    def set_class_sounds(self, sounds: dict[str, bool]):
        for name, val in sounds.items():
            if name in self.class_sounds:
                self.class_sounds[name] = bool(val)
        print(f"DEBUG: Updated class sounds: {self.class_sounds}")

    def set_search_sound_enabled(self, enabled: bool):
        self.search_sound_enabled = enabled
        print(f"DEBUG: Search sound enabled: {enabled}")

    def set_sound_enabled(self, enabled: bool):
        self.sound_enabled = enabled
        print(f"DEBUG: Sound enabled: {enabled}")

    def set_search_target(self, image_path, persist=True):
        """Ultra-robust image loading using OpenCV and explicit 8-bit RGB enforcement."""
        try:
            if persist and image_path != self.persistent_path:
                shutil.copy(image_path, self.persistent_path)
                image_path = self.persistent_path
            
            print(f"DEBUG: Attempting to load search target from: {image_path}")
            # Load using OpenCV
            img = cv2.imread(image_path)
            if img is None:
                print(f"DEBUG Error: OpenCV failed to read image at: {image_path}")
                return False
            
            # 1. Ensure it is uint8
            if img.dtype != np.uint8:
                img = img.astype(np.uint8)
                
            # 2. Convert BGR to RGB
            image_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            
            # 3. FORCE C-CONTIGUOUS AND UINT8 AGAIN (Strict requirement for dlib)
            image_rgb = np.ascontiguousarray(image_rgb, dtype=np.uint8)
            
            # 4. Final safety check on dimensions
            if len(image_rgb.shape) != 3 or image_rgb.shape[2] != 3:
                print(f"DEBUG Error: Image has invalid shape {image_rgb.shape}")
                return False

            print(f"DEBUG: Image converted to RGB. Shape: {image_rgb.shape}, Dtype: {image_rgb.dtype}")
            
            # Extract encoding
            encodings = face_recognition.face_encodings(image_rgb)
            if encodings:
                self.target_face_encoding = encodings[0]
                print(f"DEBUG: Target encoding set successfully.")
                return True
            else:
                print("DEBUG: No faces detected in the uploaded image.")
                return False
        except Exception as e:
            print(f"DEBUG: Critical error in set_search_target: {e}")
            import traceback
            traceback.print_exc()
            return False

    def clear_search_target(self):
        self.target_face_encoding = None
        if os.path.exists(self.persistent_path):
            try: os.remove(self.persistent_path)
            except: pass

    def _play_alert_sound(self):
        try:
            if os.path.exists(self.sound_path):
                playsound(self.sound_path)
        except Exception as e:
            print(f"Error playing sound: {e}")

    def start(self):
        if not self.running:
            # Re-initialize executor if needed
            if self.executor is None:
                self.executor = ThreadPoolExecutor(max_workers=2)
                
            if self.cap is None or not self.cap.isOpened():
                self.cap = cv2.VideoCapture(self.source)
            self.running = True
            self.thread = threading.Thread(target=self._run, daemon=True)
            self.thread.start()

    def stop(self):
        """Shutdown the camera feed and processing thread."""
        print("DEBUG: Stopping CameraEngine...")
        self.running = False
        
        if self.thread:
            if self.thread.is_alive():
                try:
                    self.thread.join(timeout=0.5)
                except RuntimeError:
                    pass
            self.thread = None
        
        # Ensure camera is released
        if self.cap:
            try:
                if self.cap.isOpened():
                    self.cap.release()
                    print("DEBUG: Camera resource released.")
            except Exception as e:
                print(f"DEBUG: Error releasing camera: {e}")
            self.cap = None
        
        # Shutdown executor
        if self.executor:
            try:
                self.executor.shutdown(wait=False)
            except:
                pass
            self.executor = None

    def restart(self):
        self.stop()
        time.sleep(0.3)
        self.start()

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
        if self.mode in ["search", "both"] and self.target_face_encoding is not None:
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            rgb_frame = np.ascontiguousarray(rgb_frame, dtype=np.uint8)
            face_locations = face_recognition.face_locations(rgb_frame, model="hog")
            if face_locations:
                face_encodings = face_recognition.face_encodings(rgb_frame, face_locations)
                for i, encoding in enumerate(face_encodings):
                    matches = face_recognition.compare_faces([self.target_face_encoding], encoding, tolerance=0.5)
                    if matches[0]:
                        return True, face_locations[i]
        return False, None

    def _run(self):
        while self.running:
            # 1. FLUSH CAMERA BUFFER (Crucial for real-time accuracy)
            # Read all pending frames and discard them, keeping only the latest one
            for _ in range(5): # Quickly check for buffered frames
                self.cap.grab()
            
            ret, frame = self.cap.retrieve()
            if not ret:
                # Fallback to normal read if grab/retrieve fails
                ret, frame = self.cap.read()
            
            if not ret:
                time.sleep(0.01)
                continue

            frame = cv2.resize(frame, (800, 600))
            display_frame = frame.copy()
            
            if not self.executor:
                time.sleep(0.01)
                continue

            # Parallel processing using the thread pool
            try:
                future_det = self.executor.submit(self._process_detections, frame)
                future_face = self.executor.submit(self._process_face_search, frame)
                
                # Add a timeout so the loop doesn't hang if shutdown is requested
                detections = future_det.result(timeout=2.0)
                is_target_match, face_loc = future_face.result(timeout=2.0)
            except (RuntimeError, AttributeError, TimeoutError):
                # Executor might be shutting down or task timed out
                if not self.running: break
                continue
            except Exception as e:
                # If we fail for other reasons, skip this frame
                if not self.running: break
                continue

            # --- DRAWING ---
            for d in detections:
                x1, y1, x2, y2 = [int(v) for v in d["box"]]
                color = (0, 0, 255) if d["label"].lower() in ['weapons', 'weapon', 'violence', 'pistol', 'knife', 'guns', 'person with knife'] else (0, 255, 0)
                cv2.rectangle(display_frame, (x1, y1), (x2, y2), color, 2)
                cv2.putText(display_frame, f"{d['label']} {d['confidence']:.2f}", (x1, y1 - 10),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)

            if is_target_match and face_loc:
                top, right, bottom, left = face_loc
                center = ((left + right) // 2, (top + bottom) // 2)
                radius = int(max(right - left, bottom - top) * 0.7)
                color = (0, 0, 255) # RED
                cv2.circle(display_frame, center, radius, color, 3)
                # cv2.putText(display_frame, "TARGET LOCK", (left, top - 20),
                #             cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)

            # --- ALERTS ---
            now = time.time()
            trigger_alert = False
            
            # Check Activity Alert
            if detections and (now - self.last_activity_alert > self.activity_cooldown):
                self.last_activity_alert = now
                trigger_alert = True
                print(f"DEBUG: Activity detected: {[d['label'] for d in detections]}")
                
                # SOUND FOR ACTIVITY (Check if sound is enabled for any of the detected classes)
                any_sound_enabled = any(self.class_sounds.get(d['label'], True) for d in detections)
                if any_sound_enabled and (now - self.last_sound_time > self.sound_cooldown):
                    self.last_sound_time = now
                    threading.Thread(target=self._play_alert_sound, daemon=True).start()
            
            # Check Search Alert
            if is_target_match and (now - self.last_search_alert > self.search_cooldown):
                self.last_search_alert = now
                trigger_alert = True
                print("DEBUG: Target face matched!")
                
                # Independent sound alert
                if self.search_sound_enabled and (now - self.last_sound_time > self.sound_cooldown):
                    self.last_sound_time = now
                    threading.Thread(target=self._play_alert_sound, daemon=True).start()

            if trigger_alert:
                _, buffer = cv2.imencode('.jpg', display_frame, [cv2.IMWRITE_JPEG_QUALITY, 50])
                img_base64 = base64.b64encode(buffer).decode('utf-8')
                
                self.alert_queue.put({
                    "timestamp": time.strftime("%H:%M:%S"),
                    "detections": detections,
                    "image": img_base64,
                    "is_person_search_match": is_target_match
                })
            # --- STREAM ---
            if self.frame_queue.full(): self.frame_queue.get()
            _, buffer = cv2.imencode('.jpg', display_frame, [cv2.IMWRITE_JPEG_QUALITY, 60])
            self.frame_queue.put(buffer.tobytes())

    def get_frame(self):
        try: return self.frame_queue.get(timeout=1)
        except queue.Empty: return None

    def get_alerts(self):
        res = []
        while not self.alert_queue.empty(): res.append(self.alert_queue.get())
        return res
