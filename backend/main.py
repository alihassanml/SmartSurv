from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Depends
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
import asyncio
import json
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

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

camera = CameraEngine()
# Camera is NOT started on boot — it starts when the Dashboard mounts

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

@app.get("/api/model/classes")
def get_model_classes():
    """Return model class names and their current confidence thresholds."""
    thresholds = camera.get_thresholds()
    classes = [
        {"name": name, "threshold": thresholds.get(name, 0.4)}
        for name in camera.get_class_names()
    ]
    return {"classes": classes}

@app.post("/api/model/thresholds")
def update_thresholds(body: ThresholdsUpdate):
    """Update per-class confidence thresholds and restart the camera engine."""
    camera.set_thresholds(body.thresholds)
    # Restart only if camera was running
    if camera.running:
        camera.restart()
    return {"status": "updated", "thresholds": camera.get_thresholds()}

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
