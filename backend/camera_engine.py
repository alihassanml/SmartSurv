import cv2
import time
import threading
import base64
from ultralytics import YOLO
import queue

class CameraEngine:
    def __init__(self, model_path='../model/S Model/best.pt', source=0):
        self.model = YOLO(model_path)
        # Try to move to GPU if available
        try:
            import torch
            if torch.cuda.is_available():
                self.model.to('cuda')
                print("GPU context initialized.")
        except:
            pass
            
        self.source = source
        self.cap = cv2.VideoCapture(source)
        self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
        self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
        self.cap.set(cv2.CAP_PROP_BUFFERSIZE, 1) # Minimal buffer for low latency
        
        self.frame_queue = queue.Queue(maxsize=1)
        self.alert_queue = queue.Queue()
        self.running = False
        self.thread = None
        self.last_alert_time = 0
        self.alert_cooldown = 3 
        
        self.processing_frame = False

    def start(self):
        if not self.running:
            if not self.cap.isOpened():
                self.cap = cv2.VideoCapture(self.source)
                self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
                self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
                self.cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
            self.running = True
            self.thread = threading.Thread(target=self._run, daemon=True)
            self.thread.start()

    def stop(self):
        if self.running:
            self.running = False
            if self.thread:
                self.thread.join()
            if self.cap.isOpened():
                self.cap.release()

    def _run(self):
        frame_counter = 0
        while self.running:
            ret, frame = self.cap.read()
            if not ret:
                time.sleep(0.01)
                continue

            # Performance: 1. Skip frames (process only every 2nd frame for YOLO)
            # Performance: 2. Resize frame for inference
            frame_counter += 1
            if frame_counter % 2 != 0:
                # Still show the actual frame even if we skip detection
                if not self.frame_queue.full():
                    _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 70])
                    self.frame_queue.put(buffer.tobytes())
                continue

            # YOLO Inference on resized frame
            small_frame = cv2.resize(frame, (640, 480))
            results = self.model(small_frame, verbose=False, stream=False)
            result = results[0]
            
            detections = []
            for box in result.boxes:
                cls = int(box.cls[0])
                label = self.model.names[cls]
                conf = float(box.conf[0])
                if conf > 0.4: # Lowered threshold slightly for responsiveness
                    detections.append({
                        "label": label,
                        "confidence": conf,
                        "box": box.xyxy[0].tolist()
                    })

            # If we have significant detections, trigger an alert
            if detections and (time.time() - self.last_alert_time > self.alert_cooldown):
                self.last_alert_time = time.time()
                # Use the original frame (annotated) for the snapshot
                annotated_frame = result.plot()
                _, buffer = cv2.imencode('.jpg', annotated_frame, [cv2.IMWRITE_JPEG_QUALITY, 50])
                img_base64 = base64.b64encode(buffer).decode('utf-8')
                
                alert_data = {
                    "timestamp": time.strftime("%H:%M:%S"),
                    "detections": detections,
                    "image": img_base64
                }
                self.alert_queue.put(alert_data)

            # Update live frame with annotations (using the small frame for speed)
            annotated_feed = result.plot()
            if self.frame_queue.full():
                self.frame_queue.get()
            
            # Compress JPEG quality to reduce bandwidth/latency
            _, buffer = cv2.imencode('.jpg', annotated_feed, [cv2.IMWRITE_JPEG_QUALITY, 60])
            self.frame_queue.put(buffer.tobytes())

    def get_frame(self):
        try:
            return self.frame_queue.get(timeout=1)
        except queue.Empty:
            return None

    def get_alerts(self):
        alerts = []
        while not self.alert_queue.empty():
            alerts.append(self.alert_queue.get())
        return alerts
