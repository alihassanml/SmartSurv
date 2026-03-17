import cv2
import face_recognition
import numpy as np
import os
import sys

def test_loading(image_path):
    print(f"Testing image: {image_path}")
    try:
        # Load using OpenCV
        img = cv2.imread(image_path)
        if img is None:
            print("OpenCV: Failed to read image")
            return
            
        print(f"OpenCV: shape={img.shape}, dtype={img.dtype}")
        
        # Convert to RGB
        rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        print(f"RGB: shape={rgb.shape}, dtype={rgb.dtype}")
        
        # dlib is very picky about memory layout. Force it to be C-contiguous and uint8.
        rgb = np.ascontiguousarray(rgb, dtype=np.uint8)
        print(f"Contiguous RGB: shape={rgb.shape}, dtype={rgb.dtype}, flags={rgb.flags}")
        
        # Check if it has 3 channels
        if len(rgb.shape) != 3 or rgb.shape[2] != 3:
            print("Error: Image is not 3-channel RGB")
            
        # Try face location detection
        print("Running face_locations...")
        locs = face_recognition.face_locations(rgb)
        print(f"Found {len(locs)} faces")
        
        # Try encoding
        if locs:
            print("Running face_encodings...")
            enc = face_recognition.face_encodings(rgb, locs)
            print(f"Generated {len(enc)} encodings")
            
    except Exception as e:
        print(f"CRITICAL ERROR: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    path = r'c:\Users\aliha\Documents\Final Year Project\backend\test_image\Image.jpeg'
    test_loading(path)
