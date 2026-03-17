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

class CameraEngine:
    def __init__(self, model_path='../model/N Model/best.pt', source=0):
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
        self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
        self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
        
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
        self.last_sound_time = 0.0
        self.sound_cooldown = 5

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

    def set_search_target(self, image_path):
        """Ultra-robust image loading using OpenCV and explicit 8-bit RGB enforcement."""
        try:
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

    def _play_alert_sound(self):
        try:
            if os.path.exists(self.sound_path):
                playsound(self.sound_path)
        except Exception as e:
            print(f"Error playing sound: {e}")

    def start(self):
        if not self.running:
            if not self.cap.isOpened():
                self.cap = cv2.VideoCapture(self.source)
            self.running = True
            self.thread = threading.Thread(target=self._run, daemon=True)
            self.thread.start()

    def stop(self):
        """Shutdown the camera feed and processing thread."""
        self.running = False
        if self.thread:
            # Join with timeout to prevent blocking the entire process if thread hangs
            self.thread.join(timeout=1.0) 
            self.thread = None
        
        # Ensure camera is released
        if self.cap and self.cap.isOpened():
            try:
                self.cap.release()
                print("DEBUG: Camera resource released.")
            except Exception as e:
                print(f"DEBUG: Error releasing camera: {e}")

    def restart(self):
        self.stop()
        time.sleep(0.3)
        self.start()

    def _run(self):
        frame_counter = 0
        while self.running:
            ret, frame = self.cap.read()
            if not ret:
                time.sleep(0.01)
                continue

            frame_counter += 1
            if frame_counter % 2 != 0:
                if not self.frame_queue.full():
                    _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 70])
                    self.frame_queue.put(buffer.tobytes())
                continue

            small_frame = cv2.resize(frame, (640, 480))
            display_frame = small_frame.copy()
            
            detections = []
            is_target_match = False
            
            # --- BLOCK 1: ACTIVITY DETECTION (WEAPONS / VIOLENCE) ---
            if self.mode in ["detection", "both"]:
                results = self.model(small_frame, verbose=False)
                for box in results[0].boxes:
                    label = self.model.names[int(box.cls[0])]
                    conf = float(box.conf[0])
                    if conf >= self.class_thresholds.get(label, 0.5):
                        detections.append({"label": label, "confidence": conf, "box": box.xyxy[0].tolist()})
                        
                        x1, y1, x2, y2 = [int(v) for v in box.xyxy[0].tolist()]
                        color = (0, 0, 255) if label.lower() in ['weapons', 'violence'] else (0, 255, 0)
                        cv2.rectangle(display_frame, (x1, y1), (x2, y2), color, 2)
                        cv2.putText(display_frame, f"{label} {conf:.2f}", (x1, y1 - 10),
                                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)

            # --- BLOCK 2: PERSON SEARCH (FACE MATCH) ---
            if self.mode in ["search", "both"] and self.target_face_encoding is not None:
                # Convert frame to RGB and ensure correct layout
                rgb_frame = cv2.cvtColor(small_frame, cv2.COLOR_BGR2RGB)
                rgb_frame = np.ascontiguousarray(rgb_frame, dtype=np.uint8)
                
                face_locations = face_recognition.face_locations(rgb_frame, model="hog")
                if face_locations:
                    face_encodings = face_recognition.face_encodings(rgb_frame, face_locations)
                    for i, encoding in enumerate(face_encodings):
                        matches = face_recognition.compare_faces([self.target_face_encoding], encoding, tolerance=0.5)
                        if matches[0]:
                            is_target_match = True
                            top, right, bottom, left = face_locations[i]
                            cv2.rectangle(display_frame, (left, top), (right, bottom), (255, 0, 0), 2)
                            cv2.putText(display_frame, "IDENTITY_MATCH", (left, top - 10),
                                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 0, 0), 2)
                            break

            # --- ALERTS ---
            now = time.time()
            if is_target_match or (detections and (now - self.last_alert_time > self.alert_cooldown)):
                self.last_alert_time = now
                _, buffer = cv2.imencode('.jpg', display_frame, [cv2.IMWRITE_JPEG_QUALITY, 50])
                img_base64 = base64.b64encode(buffer).decode('utf-8')
                
                self.alert_queue.put({
                    "timestamp": time.strftime("%H:%M:%S"),
                    "detections": detections,
                    "image": img_base64,
                    "is_person_search_match": is_target_match
                })
                
                if is_target_match and (now - self.last_sound_time > self.sound_cooldown):
                    self.last_sound_time = now
                    threading.Thread(target=self._play_alert_sound, daemon=True).start()

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
