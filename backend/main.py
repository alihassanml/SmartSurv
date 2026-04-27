from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Depends, File, UploadFile, Query
from fastapi.responses import StreamingResponse, JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
import asyncio
import json
import os
from typing import Dict, Optional, List
from contextlib import asynccontextmanager
import time
from aiortc import RTCPeerConnection, RTCSessionDescription
from webrtc_utils import CameraStreamTrack, IngestTrackReceiver

pcs = set()
import torch

from camera_engine import CameraEngine
from database import SessionLocal, Base, engine, User, Setting, Camera, Alert
from auth import verify_password, get_password_hash, create_access_token, SECRET_KEY, ALGORITHM
import jwt
import socket
import smtplib
import random
import string
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from dotenv import load_dotenv

load_dotenv()

SMTP_EMAIL = os.getenv("SMTP_EMAIL")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "465"))

def _generate_verification_code(length: int = 6) -> str:
    return "".join(random.choices(string.digits, k=length))

def _send_verification_email(to_email: str, code: str):
    msg = MIMEMultipart("alternative")
    msg["Subject"] = "SmartSurv — Verify Your Identity"
    msg["From"] = f"SmartSurv Security <{SMTP_EMAIL}>"
    msg["To"] = to_email

    digits_html = "".join(
        f'<td style="padding:0 6px;"><div style="'
        f'width:48px;height:64px;background:#0d0f12;border:1.5px solid #00ff85;'
        f'border-radius:4px;display:flex;align-items:center;justify-content:center;'
        f'font-size:32px;font-weight:700;color:#00ff85;letter-spacing:0;'
        f'font-family:Courier New,monospace;line-height:64px;text-align:center;">'
        f'{d}</div></td>'
        for d in str(code)
    )

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>SmartSurv — Verify Your Identity</title>
</head>
<body style="margin:0;padding:0;background:#060608;font-family:'Courier New',Courier,monospace;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#060608;min-height:100vh;">
    <tr><td align="center" style="padding:40px 16px;">

      <!-- Card -->
      <table width="520" cellpadding="0" cellspacing="0"
             style="background:#0c0d10;border:1px solid rgba(0,255,133,0.18);border-radius:2px;max-width:520px;width:100%;">

        <!-- Top accent bar -->
        <tr><td style="height:3px;background:linear-gradient(90deg,#00ff85,rgba(0,255,133,0.1));border-radius:2px 2px 0 0;"></td></tr>

        <!-- Header -->
        <tr><td style="padding:36px 40px 28px;border-bottom:1px solid rgba(0,255,133,0.08);">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <!-- Shield icon text fallback -->
                <div style="display:inline-flex;align-items:center;gap:10px;">
                  <div style="width:36px;height:36px;border:1.5px solid rgba(0,255,133,0.5);
                              display:inline-block;text-align:center;line-height:34px;
                              font-size:18px;color:#00ff85;">&#9632;</div>
                  <span style="font-size:15px;font-weight:700;letter-spacing:.22em;
                               text-transform:uppercase;color:#00ff85;">SmartSurv</span>
                </div>
              </td>
              <td align="right">
                <span style="font-size:9px;color:rgba(0,255,133,0.3);letter-spacing:.25em;
                             text-transform:uppercase;">SECURE&nbsp;MAIL</span>
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:40px 40px 32px;">

          <!-- Status badge -->
          <div style="margin-bottom:28px;">
            <span style="display:inline-block;padding:4px 12px;border:1px solid rgba(0,255,133,0.25);
                         background:rgba(0,255,133,0.04);font-size:9px;letter-spacing:.3em;
                         text-transform:uppercase;color:rgba(0,255,133,0.5);">
              IDENTITY&nbsp;VERIFICATION&nbsp;REQUEST
            </span>
          </div>

          <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#00ff85;
                     letter-spacing:.12em;text-transform:uppercase;line-height:1.3;">
            Verify Your<br/>Operator Account
          </h1>

          <p style="margin:0 0 32px;font-size:12px;color:rgba(0,255,133,0.45);
                    line-height:1.8;letter-spacing:.04em;">
            A verification request was received for your SmartSurv account.<br/>
            Enter the code below to complete your registration.
          </p>

          <!-- Code box -->
          <div style="background:#080a0d;border:1px solid rgba(0,255,133,0.15);
                      border-radius:4px;padding:32px 24px;margin-bottom:32px;text-align:center;">
            <p style="margin:0 0 20px;font-size:9px;letter-spacing:.3em;
                      text-transform:uppercase;color:rgba(0,255,133,0.35);">
              VERIFICATION&nbsp;CODE
            </p>
            <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
              <tr>{digits_html}</tr>
            </table>
            <p style="margin:20px 0 0;font-size:9px;color:rgba(0,255,133,0.25);
                      letter-spacing:.15em;text-transform:uppercase;">
              Valid for&nbsp;<span style="color:rgba(0,255,133,0.5);">10 minutes</span>
            </p>
          </div>

          <!-- Warning -->
          <table width="100%" cellpadding="0" cellspacing="0"
                 style="border:1px solid rgba(255,68,102,0.2);background:rgba(255,68,102,0.04);
                        border-radius:3px;margin-bottom:28px;">
            <tr>
              <td style="padding:14px 16px;">
                <p style="margin:0;font-size:10px;color:rgba(255,68,102,0.7);
                          line-height:1.7;letter-spacing:.04em;">
                  <strong style="color:rgba(255,68,102,0.9);">&#9888; Security Notice:</strong>
                  Never share this code with anyone. SmartSurv staff will never ask for it.
                  If you didn&rsquo;t create an account, ignore this email.
                </p>
              </td>
            </tr>
          </table>

          <p style="margin:0;font-size:10px;color:rgba(0,255,133,0.25);
                    line-height:1.7;letter-spacing:.03em;">
            This code was generated automatically. If you didn&rsquo;t sign up,
            no action is needed &mdash; your email address has not been registered.
          </p>

        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:20px 40px 28px;border-top:1px solid rgba(0,255,133,0.06);">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <p style="margin:0;font-size:9px;color:rgba(0,255,133,0.2);
                          letter-spacing:.12em;text-transform:uppercase;">
                  &copy; SmartSurv Surveillance System
                </p>
              </td>
              <td align="right">
                <p style="margin:0;font-size:9px;color:rgba(0,255,133,0.15);
                          letter-spacing:.08em;">
                  AUTOMATED&nbsp;&bull;&nbsp;DO&nbsp;NOT&nbsp;REPLY
                </p>
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- Bottom accent bar -->
        <tr><td style="height:2px;background:linear-gradient(90deg,rgba(0,255,133,0.05),rgba(0,255,133,0.2),rgba(0,255,133,0.05));"></td></tr>

      </table>
      <!-- /Card -->

    </td></tr>
  </table>
</body>
</html>"""

    msg.attach(MIMEText(html, "html"))
    if SMTP_PORT == 465:
        with smtplib.SMTP_SSL(SMTP_SERVER, SMTP_PORT, timeout=10) as s:
            s.login(SMTP_EMAIL, SMTP_PASSWORD)
            s.send_message(msg)
    else:
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT, timeout=10) as s:
            s.starttls()
            s.login(SMTP_EMAIL, SMTP_PASSWORD)
            s.send_message(msg)

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

# --- DB helpers ---
def _db_get(key: str, default=None):
    """Read a JSON-encoded value from the settings table."""
    db = SessionLocal()
    try:
        row = db.query(Setting).filter(Setting.key == key).first()
        if row:
            return json.loads(row.value)
        return default
    finally:
        db.close()

def _db_set(key: str, value):
    """Upsert a JSON-encoded value into the settings table."""
    db = SessionLocal()
    try:
        row = db.query(Setting).filter(Setting.key == key).first()
        if row:
            row.value = json.dumps(value)
        else:
            row = Setting(key=key, value=json.dumps(value))
            db.add(row)
        db.commit()
    finally:
        db.close()


Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()



# --- WEBSOCKET BROADCASTER ---
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[dict] = []

    async def connect(self, websocket: WebSocket, role: str, allowed: List[str]):
        await websocket.accept()
        self.active_connections.append({
            "ws": websocket,
            "role": role,
            "allowed": [a.lower() for a in allowed]
        })

    def disconnect(self, websocket: WebSocket):
        self.active_connections = [c for c in self.active_connections if c["ws"] != websocket]

    async def broadcast(self, alert: dict):
        for conn in list(self.active_connections):
            try:
                # Apply role-based filtering
                if conn["role"] == "organization":
                    allowed = conn["allowed"]
                    alert_labels = [d["label"].lower() for d in alert["detections"]]
                    
                    # Check for normal detection match OR watchlist match
                    is_allowed_detection = any(label in allowed for label in alert_labels)
                    is_allowed_watchlist = ("watchlist_match" in allowed and alert.get("is_person_search_match"))
                    
                    if not (is_allowed_detection or is_allowed_watchlist):
                        continue
                        
                await conn["ws"].send_text(json.dumps(alert, default=str))
            except Exception:
                self.disconnect(conn["ws"])

manager = ConnectionManager()

async def alert_broadcaster():
    from fastapi.concurrency import run_in_threadpool
    while True:
        try:
            alerts = await run_in_threadpool(camera.get_alerts)
            if alerts:
                db = SessionLocal()
                for alert in alerts:
                    try:
                        # Save to history for Dashboard Analytics
                        new_alert = Alert(
                            timestamp=alert["timestamp"],
                            backend_ts=alert.get("backend_ts"),
                            feed_id=alert["feed_id"],
                            detections=json.dumps(alert["detections"]),
                            is_person_search_match=alert["is_person_search_match"],
                            image_base64=alert.get("image"),
                            location_lat=str(alert["location"].get("lat", "")),
                            location_lon=str(alert["location"].get("lon", ""))
                        )
                        db.add(new_alert)
                        db.commit()
                        db.refresh(new_alert)
                        alert["id"] = new_alert.id
                    except: 
                        db.rollback()
                        
                    await manager.broadcast(alert)
                db.close()
            await asyncio.sleep(0.05)
        except Exception as e:
            print(f"[Broadcaster] Error: {e}")
            await asyncio.sleep(1)

async def retention_cleanup_task():
    """Background task to delete alerts older than the retention policy."""
    while True:
        try:
            retention_days = _db_get("retention_days", 30)
            if retention_days > 0:
                cutoff_ts = (time.time() - (retention_days * 86400)) * 1000
                db = SessionLocal()
                deleted_count = db.query(Alert).filter(Alert.backend_ts < cutoff_ts).delete()
                db.commit()
                if deleted_count > 0:
                    print(f"[Cleanup] Deleted {deleted_count} alerts older than {retention_days} days.")
                db.close()
        except Exception as e:
            print(f"[Cleanup] Error: {e}")
        
        # Run cleanup once an hour
        await asyncio.sleep(3600)

# --- LIFESPAN MANAGEMENT ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: load persisted settings then initialise camera
    print("STARTING_SMARTSURV_CORE...")
    app.state.is_running = True

    # Load persisted thresholds from DB
    saved_thresholds = _db_get("class_thresholds")
    if saved_thresholds:
        camera.set_thresholds(saved_thresholds)
        print(f"[DB] Loaded {len(saved_thresholds)} thresholds from database.")

    # Load persisted class sounds from DB
    saved_sounds = _db_get("class_sounds")
    if saved_sounds:
        camera.set_class_sounds(saved_sounds)
        print(f"[DB] Loaded {len(saved_sounds)} class sounds from database.")

    # Load persisted camera mode from DB
    saved_mode = _db_get("camera_mode", "both")
    camera.set_mode(saved_mode)
    print(f"[DB] Loaded camera mode: {saved_mode}")

    # Seed cameras from JSON if DB is empty
    _seed_cameras_from_json()

    # User must explicitly start monitoring from the UI.
    print("SMARTSURV_READY. System idle.")

    # Start the background tasks
    asyncio.create_task(alert_broadcaster())
    asyncio.create_task(retention_cleanup_task())

    yield
    # Shutdown: close all WebRTC peer connections then stop camera
    app.state.is_running = False
    coros = [pc.close() for pc in pcs]
    if coros:
        await asyncio.gather(*coros)
    pcs.clear()
    camera.stop()


from fastapi.staticfiles import StaticFiles

app = FastAPI(lifespan=lifespan)

@app.get("/api/camera/stream/{feed_id}")
async def stream_camera(feed_id: str):
    """MJPEG streaming endpoint for mobile app and web preview."""
    from fastapi.responses import StreamingResponse
    
    def generate():
        while True:
            frame = camera.get_jpeg_frame(feed_id)
            if frame is not None:
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')
            time.sleep(0.1) # ~10 FPS

    return StreamingResponse(generate(), media_type="multipart/x-mixed-replace; boundary=frame")

# Watchlist path used both by the API routes and by the static mount below.
# The mount is registered LAST (end of file) to avoid Starlette's ordered
# prefix-matching from intercepting /api/watchlist/{name}/rename with a 404.
WATCHLIST_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'data', 'watchlist'))
os.makedirs(WATCHLIST_PATH, exist_ok=True)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Offer(BaseModel):
    sdp: str
    type: str
    feed_id: Optional[str] = None

@app.post("/offer")
async def offer(params: Offer):
    offer = RTCSessionDescription(sdp=params.sdp, type=params.type)
    pc = RTCPeerConnection()
    pcs.add(pc)

    @pc.on("connectionstatechange")
    async def on_connectionstatechange():
        if pc.connectionState == "failed" or pc.connectionState == "closed":
            await pc.close()
            pcs.discard(pc)

    video_track = CameraStreamTrack(camera, params.feed_id)
    pc.addTrack(video_track)

    await pc.setRemoteDescription(offer)
    answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)

    return JSONResponse(content={"sdp": pc.localDescription.sdp, "type": pc.localDescription.type})

@app.post("/ingest")
async def ingest(params: Offer):
    offer = RTCSessionDescription(sdp=params.sdp, type=params.type)
    pc = RTCPeerConnection()
    pcs.add(pc)

    client_id = params.feed_id or "mobile-node"
    receiver = IngestTrackReceiver(camera, client_id)

    @pc.on("track")
    def on_track(track):
        if track.kind == "video":
            asyncio.create_task(receiver.start(track))

    @pc.on("connectionstatechange")
    async def on_connectionstatechange():
        if pc.connectionState == "failed" or pc.connectionState == "closed":
            await receiver.stop()
            await pc.close()
            pcs.discard(pc)

    await pc.setRemoteDescription(offer)
    answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)

    return JSONResponse(content={"sdp": pc.localDescription.sdp, "type": pc.localDescription.type})

camera = CameraEngine(source="auto")

# --- URL / Online Cameras ---
def _seed_cameras_from_json():
    """Seed the cameras table from cameras.json on first startup if table is empty."""
    json_path = os.path.abspath(os.path.join(os.path.dirname(__file__), 'cameras.json'))
    if not os.path.exists(json_path):
        return
    db = SessionLocal()
    try:
        if db.query(Camera).count() > 0:
            return
        with open(json_path) as f:
            entries = json.load(f)
        for entry in entries:
            db.add(Camera(name=entry['name'], url=entry['url'], is_active=False))
        db.commit()
        print(f"[DB] Seeded {len(entries)} cameras from cameras.json")
    finally:
        db.close()

# Ensure temp directory for uploads
TEMP_DIR = "temp_uploads"
os.makedirs(TEMP_DIR, exist_ok=True)

class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    role: Optional[str] = "admin"
    organization_type: Optional[str] = None
    organization_address: Optional[str] = None

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

class FocusUpdate(BaseModel):
    person_id: Optional[str] = None

class PrivacyUpdate(BaseModel):
    enabled: bool

class UiSettingUpdate(BaseModel):
    key: str
    value: bool

@app.post("/api/auth/signup")
def signup(user: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.username == user.username).first():
        raise HTTPException(status_code=400, detail="Username already registered")
    if db.query(User).filter(User.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    # Make the first registered user an admin automatically
    is_first_user = db.query(User).count() == 0

    code = _generate_verification_code()
    hashed_password = get_password_hash(user.password)
    # Admins need approval (except the first one)
    needs_approval = (user.role == "admin" and not is_first_user)

    new_user = User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password,
        is_verified=False,
        verification_code=code,
        is_admin=is_first_user or (user.role == "admin"),
        role=user.role if user.role else ("admin" if is_first_user else "user"),
        is_approved=not needs_approval,
        organization_type=user.organization_type,
        organization_address=user.organization_address
    )
    db.add(new_user)
    db.commit()

    try:
        _send_verification_email(user.email, code)
    except Exception as e:
        print(f"[Email] Failed to send verification email: {e}")
        db.delete(new_user)
        db.commit()
        raise HTTPException(status_code=500, detail="Failed to send verification email. Please try again.")

    return {"message": "Verification code sent to your email. Please verify to complete signup."}


class VerifyEmail(BaseModel):
    email: str
    code: str


@app.post("/api/auth/verify")
def verify_email(body: VerifyEmail, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == body.email).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    if db_user.is_verified:
        return {"message": "Account already verified. You can log in."}
    if db_user.verification_code != body.code:
        raise HTTPException(status_code=400, detail="Invalid verification code")

    db_user.is_verified = True
    db_user.verification_code = None
    db.commit()
    return {"message": "Email verified successfully. You can now log in."}

@app.post("/api/auth/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.username == user.username).first()
    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    if not db_user.is_verified:
        raise HTTPException(status_code=403, detail="Email not verified. Please check your email for the verification code.")
    
    if not db_user.is_approved:
        raise HTTPException(status_code=403, detail="Account pending admin approval. Please contact a system administrator.")

    access_token = create_access_token(data={"sub": db_user.username, "email": db_user.email})
    return {
        "access_token": access_token, 
        "token_type": "bearer", 
        "email": db_user.email,
        "username": db_user.username,
        "role": db_user.role,
        "is_admin": db_user.is_admin
    }

# --- API Endpoints ---
@app.get("/api/auth/users")
def get_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
    return {"users": users}

@app.post("/api/auth/users/{user_id}/approve")
def approve_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_approved = True
    db.commit()
    return {"status": "success", "message": f"User {user.username} approved"}

class OrgSettingsUpdate(BaseModel):
    allowed_notifications: List[str]
    organization_type: Optional[str] = None
    organization_address: Optional[str] = None

@app.post("/api/auth/users/{user_id}/org-settings")
def update_org_settings(user_id: int, body: OrgSettingsUpdate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.allowed_notifications = json.dumps(body.allowed_notifications)
    if body.organization_type: user.organization_type = body.organization_type
    if body.organization_address: user.organization_address = body.organization_address
    
    db.commit()
    return {"status": "success", "message": "Organization settings updated"}

@app.delete("/api/auth/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return {"status": "success", "message": f"User {user.username} deleted"}

@app.post("/api/auth/users/{user_id}/toggle")
def toggle_user_active(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = not user.is_active
    db.commit()
    return {"status": "success", "is_active": user.is_active}

@app.post("/api/auth/users/{user_id}/admin")
def toggle_user_admin(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_admin = not user.is_admin
    db.commit()
    return {"status": "success", "is_admin": user.is_admin}

@app.post("/api/auth/users/{user_id}/verify")
def manually_verify_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_verified = True
    user.verification_code = None
    db.commit()
    return {"status": "success", "message": f"User {user.username} verified"}

@app.post("/api/camera/start")
def start_camera():
    camera.start()
    _db_set("system_camera_active", True)
    return {"status": "started"}

@app.post("/api/camera/stop")
def stop_camera():
    camera.stop()
    _db_set("system_camera_active", False)
    return {"status": "stopped"}

@app.get("/api/alerts/history")
def get_alert_history(db: Session = Depends(get_db)):
    """Fetch recent alerts based on the display_days setting (default 1)."""
    display_days = _db_get("display_days", 1)
    cutoff_ts = (time.time() - (display_days * 86400)) * 1000
    alerts = db.query(Alert).filter(Alert.backend_ts >= cutoff_ts).order_by(Alert.backend_ts.desc()).limit(2000).all()
    
    return [{
        "id": a.id,
        "timestamp": a.timestamp,
        "backend_ts": a.backend_ts,
        "feed_id": a.feed_id,
        "detections": json.loads(a.detections),
        "is_person_search_match": a.is_person_search_match,
        "image": a.image_base64,
        "location": {"lat": float(a.location_lat or 0), "lon": float(a.location_lon or 0)}
    } for a in alerts]

class DataSettingsUpdate(BaseModel):
    display_days: int
    retention_days: int

class AlertDeleteRequest(BaseModel):
    ids: List[int]

@app.delete("/api/alerts")
def delete_alerts(body: AlertDeleteRequest, db: Session = Depends(get_db)):
    """Delete specific alerts from the history."""
    db.query(Alert).filter(Alert.id.in_(body.ids)).delete(synchronize_session=False)
    db.commit()
    return {"status": "deleted", "count": len(body.ids)}

@app.get("/api/settings/data")
def get_data_settings():
    return {
        "display_days": _db_get("display_days", 1),
        "retention_days": _db_get("retention_days", 30)
    }

@app.post("/api/settings/data")
def update_data_settings(body: DataSettingsUpdate):
    _db_set("display_days", body.display_days)
    _db_set("retention_days", body.retention_days)
    return {"status": "success", "message": "Data settings updated"}

@app.get("/api/camera/mode")
def get_camera_mode():
    """Return the current detection mode so the frontend can restore UI state."""
    return {"mode": camera.mode}

@app.post("/api/camera/mode")
def set_camera_mode(body: ModeUpdate):
    camera.set_mode(body.mode)
    _db_set("camera_mode", body.mode)   # persist across restarts
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
    # Persist to DB
    _db_set("class_sounds", body.sounds)
    return {"status": "updated", "sounds": camera.get_class_sounds()}

@app.post("/api/camera/focus")
def set_camera_focus(body: FocusUpdate):
    camera.set_focus(body.person_id)
    return {"status": "success", "focused_id": camera.focused_person_id}

@app.post("/api/camera/privacy")
def set_camera_privacy(body: PrivacyUpdate):
    camera.set_privacy_mode(body.enabled)
    # If privacy is ON, ensure Person Log is OFF in DB
    if body.enabled:
        _db_set("ui_person_log_enabled", False)
    return {"status": "success", "privacy_mode": camera.privacy_mode}

@app.get("/api/system/info")
def api_system_info():
    """Returns runtime system info used by the frontend AppLayout."""
    return {
        "local_ip": get_local_ip(),
        "port": 8000,
        "smtp_email": camera.email_sender,
        "email_enabled": camera.email_enabled,
        "privacy_mode": camera.privacy_mode,
        "person_log_enabled": _db_get("ui_person_log_enabled", False),
        "local_camera_visible": _db_get("local_camera_visible", True),
    }

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
    # Persist to DB
    _db_set("class_thresholds", body.thresholds)
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

@app.post("/api/camera/local/toggle-visibility")
def toggle_local_camera_visibility():
    """Toggle and persist the local (webcam) feed visibility in the DB."""
    current = _db_get("local_camera_visible", True)
    new_val = not current
    _db_set("local_camera_visible", new_val)
    return {"status": "success", "visible": new_val}

@app.get("/api/url-cameras")
def get_url_cameras(db: Session = Depends(get_db)):
    cams = db.query(Camera).all()
    return {"cameras": [   
        {"id": c.id, "name": c.name, "url": c.url, "active": c.is_active,
         "visible": c.is_visible, "grid_position": c.grid_position}
        for c in cams
    ]}

class UrlCameraCreate(BaseModel):
    name: str
    url: str

@app.post("/api/url-cameras")
def add_url_camera_endpoint(body: UrlCameraCreate, db: Session = Depends(get_db)):
    cam = Camera(name=body.name.strip(), url=body.url.strip(), is_active=False, is_visible=True)
    db.add(cam)
    db.commit()
    db.refresh(cam)
    return {"id": cam.id, "name": cam.name, "url": cam.url, "active": cam.is_active, "visible": cam.is_visible}

@app.post("/api/url-cameras/{cam_id}/toggle")
def toggle_url_camera(cam_id: int, db: Session = Depends(get_db)):
    cam = db.query(Camera).filter(Camera.id == cam_id).first()
    if not cam:
        raise HTTPException(status_code=404, detail="Camera not found")
    cam.is_active = not cam.is_active
    db.commit()
    feed_id = f"url-{cam.id}"
    if cam.is_active:
        if not camera.running:
            camera.start()
        camera.add_url_camera(feed_id, cam.url)
    else:
        camera.remove_url_camera(feed_id)
    return {"status": "success", "active": cam.is_active}

@app.post("/api/url-cameras/{cam_id}/toggle-visibility")
def toggle_url_camera_visibility(cam_id: int, db: Session = Depends(get_db)):
    cam = db.query(Camera).filter(Camera.id == cam_id).first()
    if not cam:
        raise HTTPException(status_code=404, detail="Camera not found")
    cam.is_visible = not cam.is_visible
    db.commit()
    return {"status": "success", "visible": cam.is_visible}

@app.delete("/api/url-cameras/{cam_id}")
def delete_url_camera_endpoint(cam_id: int, db: Session = Depends(get_db)):
    cam = db.query(Camera).filter(Camera.id == cam_id).first()
    if not cam:
        raise HTTPException(status_code=404, detail="Camera not found")
    if cam.is_active:
        camera.remove_url_camera(f"url-{cam.id}")
    db.delete(cam)
    db.commit()
    return {"status": "success"}

@app.get("/api/watchlist")
def get_watchlist():
    return {"watchlist": camera.get_watchlist_names()}

@app.post("/api/watchlist")
async def add_to_watchlist(name: str = Query(...), file: UploadFile = File(...)):
    timestamp = int(time.time())
    safe_filename = f"watchlist_{timestamp}_{file.filename.replace(' ', '_')}"
    file_path = os.path.abspath(os.path.join(TEMP_DIR, safe_filename))
    
    try:
        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)
        
        success = camera.add_to_watchlist(name, file_path)
        if success:
            return {"status": "success", "message": f"Added {name} to watchlist"}
        else:
            return JSONResponse(status_code=400, content={"status": "error", "message": "Face recognition failed."})
    except Exception as e:
        return JSONResponse(status_code=500, content={"status": "error", "message": str(e)})
    finally:
        if os.path.exists(file_path):
            try: os.remove(file_path)
            except: pass

@app.get("/api/watchlist/{name}/image")
def get_watchlist_image(name: str):
    for ext in ("jpg", "jpeg", "png", "webp"):
        p = os.path.join(WATCHLIST_PATH, f"{name}.{ext}")
        if os.path.exists(p):
            return FileResponse(p, media_type=f"image/{ext}")
    raise HTTPException(status_code=404, detail="Image not found")

class WatchlistRename(BaseModel):
    new_name: str

@app.post("/api/watchlist/{name}/rename")
def rename_watchlist_entry(name: str, body: WatchlistRename):
    success = camera.rename_watchlist(name, body.new_name.strip())
    if not success:
        return JSONResponse(status_code=400, content={"status": "error", "message": "Rename failed — name may already exist or target not found"})
    return {"status": "success", "old_name": name, "new_name": body.new_name.strip()}

@app.delete("/api/watchlist/{name}")
def delete_from_watchlist(name: str):
    camera.remove_from_watchlist(name)
    return {"status": "success", "message": f"Removed {name} from watchlist"}




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

def get_system_specs():
    import psutil, platform
    specs = {
        "os": platform.system(),
        "cpu": platform.processor(),
        "cores": psutil.cpu_count(logical=True),
        "ram": round(psutil.virtual_memory().total / (1024**3), 1),
        "gpu": None
    }
    if torch.cuda.is_available():
        specs["gpu"] = {
            "name": torch.cuda.get_device_name(0),
            "vram": round(torch.cuda.get_device_properties(0).total_memory / (1024**3), 1)
        }
    
    # Heuristics for camera capacity
    capacity = 0
    status = "INSUFFICIENT"
    
    if specs["gpu"]:
        if specs["gpu"]["vram"] >= 6: capacity = 6; status = "OPTIMAL"
        elif specs["gpu"]["vram"] >= 4: capacity = 4; status = "GOOD"
        else: capacity = 2; status = "MODERATE"
    else:
        if specs["cores"] >= 8: capacity = 2; status = "MODERATE (CPU ONLY)"
        elif specs["cores"] >= 4: capacity = 1; status = "MINIMAL"
        else: capacity = 0; status = "INSUFFICIENT"
        
    return {**specs, "capacity": capacity, "status": status}

@app.get("/api/system/check")
def system_check():
    return get_system_specs()
def get_system_info():
    return {
        "local_ip": get_local_ip(),
        "port": 8000,
        "smtp_email": camera.email_sender,
        "email_enabled": camera.email_enabled,
        "privacy_mode": camera.privacy_mode,
        "person_log_enabled": _db_get("ui_person_log_enabled", False),
    }

# ── UI Settings (person_log toggle, etc.) ─────────────────────────────────────
@app.get("/api/persons/search")
def search_persons(q: str):
    results = camera.get_semantic_search(q)
    return {"status": "success", "results": results}

@app.get("/api/settings/ui")
def get_ui_settings():
    """Return persisted UI settings."""
    person_log_enabled = _db_get("ui_person_log_enabled", False)  # default OFF
    return {"person_log_enabled": person_log_enabled}

@app.post("/api/settings/ui")
def update_ui_setting(body: UiSettingUpdate):
    """Persist a boolean UI toggle."""
    allowed_keys = {"ui_person_log_enabled"}
    if body.key not in allowed_keys:
        raise HTTPException(status_code=400, detail="Unknown setting key")
    _db_set(body.key, body.value)
    return {"status": "saved", "key": body.key, "value": body.value}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, token: Optional[str] = Query(None)):
    role = "admin"
    allowed = []
    
    if token:
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            username: str = payload.get("sub")
            db = SessionLocal()
            user = db.query(User).filter(User.username == username).first()
            if user:
                role = user.role
                allowed = json.loads(user.allowed_notifications or '[]')
            db.close()
        except Exception:
            pass

    await manager.connect(websocket, role, allowed)
    try:
        while True:
            # Keep connection alive; broadcast is handled by manager
            await websocket.receive_text()
    except (WebSocketDisconnect, asyncio.CancelledError):
        pass
    finally:
        manager.disconnect(websocket)

@app.websocket("/ws/stats")
async def stats_endpoint(websocket: WebSocket):
    """Streams real-time system stats (latency, load) to the frontend."""
    await websocket.accept()
    try:
        while getattr(app.state, 'is_running', True):
            # Calculate simple health/latency metrics
            stats = {
                "type": "stats",
                "ts": time.time() * 1000,
                "fps": 30, # placeholder for global avg
                "active_feeds": camera.get_active_feeds()
            }
            await websocket.send_text(json.dumps(stats))
            await asyncio.sleep(1.0) # Check every second
    except (WebSocketDisconnect, asyncio.CancelledError, RuntimeError):
        pass
    except Exception:
        pass
    finally:
        try: await websocket.close()
        except: pass

@app.websocket("/ws/persons")
async def persons_endpoint(websocket: WebSocket):
    """Streams person-detection events (face crops + IDs) to the frontend."""
    from fastapi.concurrency import run_in_threadpool
    await websocket.accept()
    try:
        while app.state.is_running:
            events = await run_in_threadpool(camera.get_person_events)
            if events:
                for event in events:
                    await websocket.send_text(json.dumps(event))
                # Yield to other coroutines between bursts
                await asyncio.sleep(0)
            else:
                # No events — short sleep so we stay responsive without busy-looping
                await asyncio.sleep(0.05)
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
    import base64 as _b64
    print(f"[WS] Remote camera {client_id} connected.")
    try:
        while app.state.is_running:
            # Handle both binary (bytes) and text (base64) for compatibility
            message = await websocket.receive()
            data = None
            
            if "bytes" in message:
                data = message["bytes"]
            elif "text" in message:
                try:
                    # Decode base64 text to bytes
                    text_data = message["text"]
                    if "," in text_data: text_data = text_data.split(",")[1]
                    data = _b64.b64decode(text_data)
                except Exception as e:
                    print(f"[WS] Base64 decode error: {e}")
            
            if data:
                camera.push_remote_frame(data, client_id)
                
    except (WebSocketDisconnect, asyncio.CancelledError, RuntimeError):
        print(f"[WS] Remote camera {client_id} disconnected.")
    except Exception as e:
        print(f"[WS] Remote input error: {e}")
    finally:
        try: await websocket.close()
        except: pass

# ── Static mount registered LAST so all API routes take priority ─────────────
app.mount("/api/watchlist/images", StaticFiles(directory=WATCHLIST_PATH), name="watchlist_images")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
