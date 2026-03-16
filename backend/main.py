from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import json
from camera_engine import CameraEngine

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

camera = CameraEngine()
camera.start()

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
