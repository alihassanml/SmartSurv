import psutil
import torch
import platform

def get_specs():
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
    return specs

print(get_specs())
