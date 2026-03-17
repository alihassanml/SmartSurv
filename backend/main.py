from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Depends, File, UploadFile
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
import asyncio
import json
import os
import shutil
from typing import Dict

from camera_engine import CameraEngine
from database import SessionLocal, Base, engine, User
from auth import verify_password, get_password_hash, create_access_token

Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class UserCreate(BaseModel):
    username: str
    email: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class ThresholdsUpdate(BaseModel):
    thresholds: Dict[str, float]

class ModeUpdate(BaseModel):
    mode: str

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

camera = CameraEngine()

# Ensure temp directory for uploads
TEMP_DIR = "temp_uploads"
os.makedirs(TEMP_DIR, exist_ok=True)

@app.post("/api/auth/signup")
def signup(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    hashed_password = get_password_hash(user.password)
    new_user = User(username=user.username, email=user.email, hashed_password=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "User created successfully"}

@app.post("/api/auth/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.username == user.username).first()
    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    
    access_token = create_access_token(data={"sub": db_user.username})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/api/camera/start")
def start_camera():
    camera.start()
    return {"status": "started"}

@app.post("/api/camera/stop")
def stop_camera():
    camera.stop()
    return {"status": "stopped"}

@app.post("/api/camera/mode")
def set_camera_mode(body: ModeUpdate):
    camera.set_mode(body.mode)
    return {"status": "success", "mode": camera.mode}

@app.get("/api/model/classes")
def get_model_classes():
    thresholds = camera.get_thresholds()
    classes = [
        {"name": name, "threshold": thresholds.get(name, 0.4)}
        for name in camera.get_class_names()
    ]
    return {"classes": classes}

@app.post("/api/model/thresholds")
def update_thresholds(body: ThresholdsUpdate):
    camera.set_thresholds(body.thresholds)
    if camera.running:
        camera.restart()
    return {"status": "updated", "thresholds": camera.get_thresholds()}

# --- Person Search Endpoint ---
@app.post("/api/person/search")
async def setup_person_search(file: UploadFile = File(...)):
    """Upload a person's photo to search for them in the camera feed."""
    # Create a unique filename to avoid path issues
    import time
    timestamp = int(time.time())
    safe_filename = f"target_{timestamp}_{file.filename.replace(' ', '_')}"
    file_path = os.path.abspath(os.path.join(TEMP_DIR, safe_filename))
    
    try:
        print(f"DEBUG: Saving upload to {file_path}")
        
        # Reset file pointer
        await file.seek(0)
        
        # Save explicitly using bytes
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
            f.flush()
            os.fsync(f.fileno()) # Ensure it's written to disk
        
        if not os.path.exists(file_path):
            raise Exception("File failed to save to disk")

        # Pass absolute path to camera engine
        success = camera.set_search_target(file_path)
        
        if success:
            return {"status": "success", "message": f"Searching for person: {file.filename}"}
        else:
            return JSONResponse(status_code=400, content={"status": "error", "message": "Face recognition failed to process image."})
            
    except Exception as e:
        print(f"DEBUG: Server upload error: {e}")
        import traceback
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"status": "error", "message": f"Server error: {str(e)}"})
    finally:
        # Cleanup is handled after a short delay or in the next request to be safe
        # but for now we try to cleanup
        pass

@app.delete("/api/person/search")
def clear_person_search():
    camera.clear_search_target()
    return {"status": "success", "message": "Person search cleared."}

@app.get("/video_feed")
async def video_feed():
    def generate():
        while True:
            frame = camera.get_frame()
            if frame is None:
                continue
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')
    
    return StreamingResponse(generate(), media_type="multipart/x-mixed-replace; boundary=frame")

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            alerts = camera.get_alerts()
            if alerts:
                for alert in alerts:
                    await websocket.send_text(json.dumps(alert))
            await asyncio.sleep(0.5)
    except WebSocketDisconnect:
        print("Client disconnected")

@app.on_event("shutdown")
def shutdown_event():
    camera.stop()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
