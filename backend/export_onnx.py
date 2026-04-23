from ultralytics import YOLO
import os

model_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'model', 'S2 Model', 'best.pt'))
print(f"Loading model from: {model_path}")

if not os.path.exists(model_path):
    print("Error: Model file not found!")
else:
    model = YOLO(model_path)
    print("Exporting to ONNX...")
    # opset 12 is widely compatible
    model.export(format="onnx", imgsz=320, opset=12)
    print("Export complete.")
