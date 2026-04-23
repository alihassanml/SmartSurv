import cv2
import torch
from ultralytics import YOLO

MODEL  = '../model/S2 Model/best.pt'
VIDEO  = 'weapons.mp4'
OUTPUT = 'output1.mp4'

# ── GPU if available ──────────────────────────────────────────────────────────
DEVICE = 'cuda' if torch.cuda.is_available() else 'cpu'
print(f'Running on: {DEVICE}')

model = YOLO(MODEL)
model.to(DEVICE)

# ── Half precision (fp16) — 2x faster on GPU, no quality loss ────────────────
if DEVICE == 'cuda':
    model.model.half()

cap = cv2.VideoCapture(VIDEO)
w   = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
h   = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
fps = cap.get(cv2.CAP_PROP_FPS) or 30

writer = cv2.VideoWriter(OUTPUT, cv2.VideoWriter_fourcc(*'mp4v'), fps, (w, h))

# ── Speed settings ────────────────────────────────────────────────────────────
IMGSZ   = 320          # smaller = faster (default 640). Try 320 if still slow.
CONF    = 0.40         # skip weak detections early
SKIP    = 1            # process every Nth frame (1 = every frame, 2 = every other)
frame_n = 0

while True:
    ret, frame = cap.read()
    if not ret:
        break

    frame_n += 1
    if frame_n % SKIP != 0:
        writer.write(frame)
        cv2.imshow('SmartSurv — press Q to quit', frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break
        continue

    results = model(
        frame,
        verbose=False,
        imgsz=IMGSZ,
        conf=CONF,
        device=DEVICE,
        half=(DEVICE == 'cuda'),
    )[0]

    for box in results.boxes:
        x1, y1, x2, y2 = map(int, box.xyxy[0])
        conf  = float(box.conf[0])
        label = model.names[int(box.cls[0])]
        cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 0, 255), 2)
        cv2.putText(frame, f'{label} {conf:.2f}', (x1, y1 - 8),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)

    writer.write(frame)
    cv2.imshow('SmartSurv — press Q to quit', frame)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
writer.release()
cv2.destroyAllWindows()
print(f'Saved → {OUTPUT}')
