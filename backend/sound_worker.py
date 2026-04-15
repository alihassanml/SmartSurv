"""
sound_worker.py — Dedicated audio process for SmartSurv.

Started by CameraEngine as a subprocess (subprocess.Popen).
Reads JSON commands from stdin, one per line:

    {"cmd": "init_tts", "model": "/path/model.onnx", "config": "/path/model.onnx.json"}
    {"cmd": "play",     "path":  "/path/drop.mp3"}
    {"cmd": "tts",      "text":  "weapons detected"}
    {"cmd": "stop"}

Why subprocess instead of multiprocessing.Process?
  On Windows, multiprocessing uses 'spawn' which re-imports __main__ (main.py).
  That re-import hits `camera = CameraEngine()` → tries to spawn again → RuntimeError.
  subprocess.Popen has no such constraint: it just runs this script directly.
"""

import sys
import os
import json
import wave
import tempfile


# ─── MP3 / WAV playback via Windows MCI ─────────────────────────────────────

def _play_sound_mci(path: str):
    """Play any audio file through the Windows MCI interface (reliable in any process)."""
    try:
        import ctypes
        winmm = ctypes.windll.winmm
        alias = 'smartsurv_alert'
        err = winmm.mciSendStringW(f'open "{path}" type mpegvideo alias {alias}', None, 0, None)
        if err != 0:
            # Fallback: let MCI auto-detect (works for WAV)
            winmm.mciSendStringW(f'open "{path}" alias {alias}', None, 0, None)
        winmm.mciSendStringW(f'play {alias} wait', None, 0, None)
        winmm.mciSendStringW(f'close {alias}', None, 0, None)
    except Exception as e:
        print(f'[SoundWorker] MCI play error: {e}', flush=True)


# ─── Piper TTS ───────────────────────────────────────────────────────────────

def _load_piper(model_path: str, config_path: str):
    if not model_path or not os.path.exists(model_path):
        print(f'[SoundWorker] Piper model not found: {model_path}', flush=True)
        return None
    try:
        from piper import PiperVoice
        voice = PiperVoice.load(model_path, config_path=config_path)
        print('[SoundWorker] Piper TTS loaded.', flush=True)
        return voice
    except ImportError:
        print('[SoundWorker] piper-tts not installed — TTS disabled.', flush=True)
    except Exception as e:
        print(f'[SoundWorker] Piper load error: {e}', flush=True)
    return None


def _speak_tts(piper_voice, text: str):
    if not piper_voice or not text.strip():
        return
    tmp_path = None
    try:
        import numpy as np
        import winsound

        sample_rate = getattr(getattr(piper_voice, 'config', None), 'sample_rate', 22050)
        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as f:
            tmp_path = f.name
        with wave.open(tmp_path, 'wb') as wf:
            wf.setnchannels(1)
            wf.setsampwidth(2)
            wf.setframerate(sample_rate)
            for chunk in piper_voice.synthesize(text):
                int16_data = (chunk.audio_float_array * 32767).astype(np.int16)
                wf.writeframes(int16_data.tobytes())
        winsound.PlaySound(tmp_path, winsound.SND_FILENAME)
    except Exception as e:
        print(f'[SoundWorker] TTS error: {e}', flush=True)
    finally:
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
            except Exception:
                pass


# ─── Main stdin loop ─────────────────────────────────────────────────────────

def main():
    print('[SoundWorker] Ready — reading commands from stdin.', flush=True)
    piper_voice = None
    tts_active = False  # True while TTS audio is playing

    for raw_line in sys.stdin:
        line = raw_line.strip()
        if not line:
            continue
        try:
            cmd = json.loads(line)
        except json.JSONDecodeError:
            continue

        action = cmd.get('cmd', '')

        if action == 'init_tts':
            piper_voice = _load_piper(
                cmd.get('model', ''),
                cmd.get('config', ''),
            )

        elif action == 'play':
            # Skip the MP3 beep if TTS voice is currently speaking —
            # no need to blast an alarm while the voice alert is active.
            if tts_active:
                continue
            path = cmd.get('path', '')
            if path and os.path.exists(path):
                _play_sound_mci(path)
            else:
                print(f'[SoundWorker] File not found: {path}', flush=True)

        elif action == 'tts':
            tts_active = True
            _speak_tts(piper_voice, cmd.get('text', ''))
            tts_active = False  # TTS finished, beeps allowed again

        elif action == 'stop':
            print('[SoundWorker] Stop command received. Exiting.', flush=True)
            break

    print('[SoundWorker] Exited.', flush=True)


if __name__ == '__main__':
    main()
