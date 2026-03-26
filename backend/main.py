from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Depends, File, UploadFile, Query
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
import asyncio
import json
import os
from typing import Dict, Optional
from contextlib import asynccontextmanager

from camera_engine import CameraEngine
from database import SessionLocal, Base, engine, User
from auth import verify_password, get_password_hash, create_access_token
import socket

def get_local_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        # doesn't even have to be reachable
        s.connect(('10.255.255.255', 1))
        IP = s.getsockname()[0]
    except Exception:
        IP = '127.0.0.1'
    finally:
        s.close()
    return IP

Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- LIFESPAN MANAGEMENT ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize camera resources
    print("STARTING_SMARTSURV_CORE...")
    app.state.is_running = True
    camera.start()
    yield
    # Shutdown: Release resources
    print("SHUTTING_DOWN_RESOURCES...")
    app.state.is_running = False
    camera.stop()

app = FastAPI(lifespan=lifespan)

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

class SoundUpdate(BaseModel):
    enabled: bool

class EmailUpdate(BaseModel):
    enabled: bool

class SourceUpdate(BaseModel):
    source: str # e.g. "0", "remote", "hybrid"

class ClassSoundsUpdate(BaseModel):
    sounds: Dict[str, bool]

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

@app.post("/api/camera/sound")
def set_camera_sound(body: SoundUpdate):
    camera.set_search_sound_enabled(body.enabled)
    camera.set_sound_enabled(body.enabled)
    return {"status": "success", "sound_enabled": camera.sound_enabled}

@app.post("/api/camera/email")
def set_camera_email(body: EmailUpdate):
    camera.set_email_enabled(body.enabled)
    return {"status": "success", "email_enabled": camera.email_enabled}

@app.post("/api/model/sounds")
def update_class_sounds(body: ClassSoundsUpdate):
    camera.set_class_sounds(body.sounds)
    return {"status": "updated", "sounds": camera.get_class_sounds()}

@app.get("/api/model/classes")
def get_model_classes():
    thresholds = camera.get_thresholds()
    sounds = camera.get_class_sounds()
    classes = [
        {
            "name": name, 
            "threshold": thresholds.get(name, 0.4),
            "sound_enabled": sounds.get(name, False)
        }
        for name in camera.get_class_names()
    ]
    return {"classes": classes}

@app.post("/api/model/thresholds")
def update_thresholds(body: ThresholdsUpdate):
    camera.set_thresholds(body.thresholds)
    # We don't need to restart anymore if threshold changes, as feeds check it dynamically
    return {"status": "updated", "thresholds": camera.get_thresholds()}

@app.post("/api/camera/source")
def set_camera_source(body: SourceUpdate):
    new_source = body.source
    if new_source.isdigit():
        new_source = int(new_source)
    camera.restart(source=new_source)
    return {"status": "success", "source": camera.source_config}

@app.get("/api/camera/feeds")
def get_camera_feeds():
    return {"feeds": camera.get_active_feeds()}

@app.post("/api/person/search")
async def setup_person_search(file: UploadFile = File(...)):
    import time
    timestamp = int(time.time())
    safe_filename = f"target_{timestamp}_{file.filename.replace(' ', '_')}"
    file_path = os.path.abspath(os.path.join(TEMP_DIR, safe_filename))
    
    try:
        await file.seek(0)
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
            f.flush()
            os.fsync(f.fileno())
        
        success = camera.set_search_target(file_path)
        if success:
            return {"status": "success", "message": f"Searching for person: {file.filename}"}
        else:
            return JSONResponse(status_code=400, content={"status": "error", "message": "Face recognition failed."})
    except Exception as e:
        return JSONResponse(status_code=500, content={"status": "error", "message": str(e)})
    finally:
        if os.path.exists(file_path):
            try: os.remove(file_path)
            except: pass

@app.delete("/api/person/search")
def clear_person_search():
    camera.clear_search_target()
    return {"status": "success", "message": "Person search cleared."}

@app.get("/video_feed")
async def video_feed(id: Optional[str] = Query(None)):
    from fastapi.concurrency import run_in_threadpool
    async def generate():
        try:
            while app.state.is_running:
                frame = await run_in_threadpool(camera.get_frame, id)
                if frame is None:
                    await asyncio.sleep(0.01)
                    continue
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')
        except (RuntimeError, GeneratorExit, asyncio.CancelledError):
            pass
        except Exception:
            pass
    return StreamingResponse(generate(), media_type="multipart/x-mixed-replace; boundary=frame")

@app.get("/api/system/info")
def get_system_info():
    return {
        "local_ip": get_local_ip(),
        "port": 8000
    }

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    from fastapi.concurrency import run_in_threadpool
    await websocket.accept()
    try:
        while app.state.is_running:
            alerts = await run_in_threadpool(camera.get_alerts)
            if alerts:
                for alert in alerts:
                    await websocket.send_text(json.dumps(alert))
            await asyncio.sleep(0.5)
    except (WebSocketDisconnect, asyncio.CancelledError, RuntimeError):
        pass
    except Exception:
        pass
    finally:
        try: await websocket.close()
        except: pass

@app.websocket("/ws/remote-input")
async def remote_input_endpoint(websocket: WebSocket, client_id: str = Query("1")):
    await websocket.accept()
    print(f"[WS] Remote camera {client_id} connected.")
    try:
        while app.state.is_running:
            data = await websocket.receive_bytes()
            if data:
                camera.push_remote_frame(data, client_id)
    except (WebSocketDisconnect, asyncio.CancelledError, RuntimeError):
        print(f"[WS] Remote camera {client_id} disconnected.")
    except Exception as e:
        print(f"[WS] Remote input error: {e}")
    finally:
        try: await websocket.close()
        except: pass

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
