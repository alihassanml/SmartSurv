import asyncio
import fractions
import time
import cv2
import numpy as np
from aiortc import MediaStreamTrack
from av import VideoFrame

_BLACK_FRAME = np.zeros((480, 640, 3), dtype=np.uint8)

class CameraStreamTrack(MediaStreamTrack):
    kind = "video"

    def __init__(self, camera_engine, feed_id=None):
        super().__init__()
        self.camera_engine = camera_engine
        self.feed_id = feed_id
        self._no_frame_count = 0

    async def recv(self):
        frame_bgr = self.camera_engine.get_raw_frame(self.feed_id)

        if frame_bgr is None:
            self._no_frame_count += 1
            if self._no_frame_count <= 5:
                # Give the feed up to 0.1s to produce its first frame
                await asyncio.sleep(0.02)
                frame_bgr = self.camera_engine.get_raw_frame(self.feed_id)
            if frame_bgr is None:
                # Feed is dead or not started — return black frame so WebRTC stays alive
                frame_bgr = _BLACK_FRAME
        else:
            self._no_frame_count = 0

        pts, time_base = await self.next_timestamp()
        frame_rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
        new_frame = VideoFrame.from_ndarray(frame_rgb, format="rgb24")
        new_frame.pts = pts
        new_frame.time_base = time_base
        return new_frame

    async def next_timestamp(self):
        if hasattr(self, "_timestamp"):
            self._timestamp += int(90000 / 30)
        else:
            self._timestamp = 0
        return self._timestamp, fractions.Fraction(1, 90000)

