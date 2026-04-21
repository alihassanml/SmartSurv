"""
sound_worker.py — Dedicated audio process for SmartSurv.

Started by CameraEngine as a subprocess (subprocess.Popen).
Reads JSON commands from stdin, one per line:

    {"cmd": "play", "path": "/path/drop.mp3"}
    {"cmd": "stop"}

Why subprocess instead of multiprocessing.Process?
  On Windows, multiprocessing uses 'spawn' which re-imports __main__ (main.py).
  That re-import hits `camera = CameraEngine()` → tries to spawn again → RuntimeError.
  subprocess.Popen has no such constraint: it just runs this script directly.
"""

import sys
import os
import json


# ─── MP3 / WAV playback via Windows MCI ─────────────────────────────────────

def _play_sound_mci(path: str):
    """Play any audio file through the Windows MCI interface (reliable in any process)."""
    try:
        import ctypes
        winmm = ctypes.windll.winmm
        alias = 'smartsurv_alert'
        # Close any previous instance first
        winmm.mciSendStringW(f'close {alias}', None, 0, None)
        # Open and play immediately without waiting
        err = winmm.mciSendStringW(f'open "{path}" type mpegvideo alias {alias}', None, 0, None)
        if err != 0:
            winmm.mciSendStringW(f'open "{path}" alias {alias}', None, 0, None)
        winmm.mciSendStringW(f'play {alias}', None, 0, None)
    except Exception as e:
        print(f'[SoundWorker] MCI play error: {e}', flush=True)


# ─── Main stdin loop ─────────────────────────────────────────────────────────

def main():
    print('[SoundWorker] Ready — reading commands from stdin.', flush=True)

    for raw_line in sys.stdin:
        line = raw_line.strip()
        if not line:
            continue
        try:
            cmd = json.loads(line)
        except json.JSONDecodeError:
            continue

        action = cmd.get('cmd', '')

        if action == 'play':
            path = cmd.get('path', '')
            print(f'[SoundWorker] Play request: {path} (exists={os.path.exists(path)})', flush=True)
            if path and os.path.exists(path):
                print(f'[SoundWorker] Playing: {path}', flush=True)
                _play_sound_mci(path)
            else:
                print(f'[SoundWorker] File not found: {path}', flush=True)

        elif action == 'stop':
            print('[SoundWorker] Stop command received. Exiting.', flush=True)
            break

    print('[SoundWorker] Exited.', flush=True)


if __name__ == '__main__':
    main()
