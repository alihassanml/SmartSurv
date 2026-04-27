from ultralytics import YOLO

# Load your trained model
model = YOLO(r"C:\Users\aliha\Documents\Final Year Project\model\S2 Model\best.pt")

# Print class names
print("Classes in model:")
for i, name in model.names.items():
    print(f"{i}: {name}")