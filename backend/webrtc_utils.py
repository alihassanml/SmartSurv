import asyncio
import fractions
import time
from aiortc import MediaStreamTrack
from av import VideoFrame

class CameraStreamTrack(MediaStreamTrack):
    """
    A video stream track that yields frames from a CameraEngine.
    """
    kind = "video"

    def __init__(self, camera_engine, feed_id=None):
        super().__init__()
        self.camera_engine = camera_engine
        self.feed_id = feed_id

    async def recv(self):
        import cv2
        import numpy as np

        # Wait (non-recursively) until a frame is available
        frame_bgr = None
        while frame_bgr is None:
            frame_bgr = self.camera_engine.get_raw_frame(self.feed_id)
            if frame_bgr is None:
                await asyncio.sleep(0.02)

        pts, time_base = await self.next_timestamp()

        # Convert BGR → RGB for WebRTC
        frame_rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
        new_frame = VideoFrame.from_ndarray(frame_rgb, format="rgb24")
        new_frame.pts = pts
        new_frame.time_base = time_base
        return new_frame

    async def next_timestamp(self):
        if hasattr(self, "_timestamp"):
            self._timestamp += int(90000 / 30) # Assume 30 FPS
        else:
            self._timestamp = 0
        return self._timestamp, fractions.Fraction(1, 90000)
