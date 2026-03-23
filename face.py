import cv2
import threading
import torch
from facenet_pytorch import MTCNN, InceptionResnetV1
from PIL import Image

# Select the most suitable device (GPU if available, otherwise CPU)
device = torch.device('cuda:0' if torch.cuda.is_available() else 'cpu')
print(f"Loading FaceNet models on: {device}")

# MTCNN for face detection
# keep_all=True allows finding multiple faces, but we just want one primary face
mtcnn = MTCNN(keep_all=True, device=device)

# InceptionResnetV1 for feature extraction (This IS the FaceNet architecture model)
# We load weights pre-trained on the vggface2 dataset for excellent results
print("Downloading/Loading FaceNet model weights...")
resnet = InceptionResnetV1(pretrained='vggface2').eval().to(device)

# Path to the image you uploaded
target_image_path = r"C:\Users\aliha\Documents\Final Year Project\backend\temp_uploads\target_1773759982_Image.jpeg"

# Calculate Target Embedding
try:
    print(f"Loading target image from {target_image_path}...")
    target_img = Image.open(target_image_path).convert('RGB')
    
    # Get cropped face from MTCNN
    target_face = mtcnn(target_img)
    if target_face is not None:
        if target_face.dim() == 4:
            target_face = target_face[0]  # Take the first face if multiple are found
            
        # Get embedding vector (calculate face features)
        target_embedding = resnet(target_face.unsqueeze(0).to(device)).detach()
        print("Target face mapped successfully!")
    else:
        print("ERROR: No face detected in the target image!")
        target_embedding = None
except Exception as e:
    print(f"Error loading target image: {e}")
    target_embedding = None


# Global variables for multithreading
is_verifying = False
match_found = False
face_box = None
similarity_score = 0.0

def verify_face(frame_rgb):
    """
    This runs in a background thread so the camera stream doesn't freeze
    while FaceNet performs the calculations.
    """
    global is_verifying, match_found, face_box, similarity_score
    try:
        if target_embedding is None:
            return
            
        pil_img = Image.fromarray(frame_rgb)
        
        # Detect faces
        boxes, _ = mtcnn.detect(pil_img)
        faces = mtcnn(pil_img)

        if boxes is not None and faces is not None:
            # Check the first/most prominent face
            current_face = faces[0]
            face_box = boxes[0].tolist()

            # Calculate embedding for current face
            current_embedding = resnet(current_face.unsqueeze(0).to(device)).detach()
            
            # Compare embeddings using cosine similarity
            # Values closer to 1.0 mean higher similarity. Values below 0.6 are usually different people.
            similarity = torch.nn.functional.cosine_similarity(target_embedding, current_embedding)
            similarity_score = similarity.item()
            
            # 0.65 is a good threshold for vggface2 weights
            match_found = similarity_score > 0.65
        else:
            match_found = False
            face_box = None
            similarity_score = 0.0

    except Exception as e:
        print("Error during FaceNet verification:", e)
    finally:
        is_verifying = False


def main():
    global is_verifying, match_found, face_box, similarity_score
    
    print("Initializing camera...")
    cap = cv2.VideoCapture(0)
    
    if not cap.isOpened():
        print("ERROR: Could not open camera.")
        return
        
    print("Camera started! Press 'q' to quit.")
    
    # Optional: Lower resolution to speed up detection
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
    
    while True:
        ret, frame = cap.read()
        if not ret:
            print("Failed to read from camera.")
            break
            
        display_frame = frame.copy()
        
        # Start a new thread for FaceNet if the previous one finished
        if not is_verifying and target_embedding is not None:
            is_verifying = True
            # convert to RGB for PIL processing
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            threading.Thread(target=verify_face, args=(rgb_frame,), daemon=True).start()
        
        # Draw UI based on background thread results
        status_text = f"MATCH: YES ({similarity_score:.2f})" if match_found else f"MATCH: NO ({similarity_score:.2f})"
        color = (0, 255, 0) if match_found else (0, 0, 255) # Green if match, Red if no match
        
        cv2.putText(display_frame, status_text, (20, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.8, color, 2)
        cv2.putText(display_frame, "Using: FaceNet Model (facenet-pytorch)", (20, 80), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
        
        if face_box:
            x1, y1, x2, y2 = [int(b) for b in face_box]
            cv2.rectangle(display_frame, (x1, y1), (x2, y2), color, 2)
            
        cv2.imshow("FaceNet PyTorch Test", display_frame)
        
        # Quit on 'q' press
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()
