# 🛡️ **SmartSurv: Advanced AI-Powered Intelligent Surveillance & Real-Time Biometric Search**

**SmartSurv** is a high-performance, autonomous security ecosystem designed to transform legacy CCTV infrastructures into an intelligent, proactive monitoring network. By leveraging **Distributed Edge Computing**, **Real-Time Computer Vision**, and **Geospatial Intelligence**, SmartSurv provides instant situational awareness and threat detection across distributed camera nodes.

---

## 📺 **The Mission Control (Dashboard Features)**

### **1. Hybrid Monitoring Mode (Ops_Core)**
*   **Unified Grid Infrastructure:** Process and display multiple live camera feeds simultaneously including **Local Laptop Cameras** and **Remote Mobile Nodes**.
*   **Low-Latency Canvas Rendering:** Utilizes a custom high-performance canvas buffer for decoding MJPEG streams, eliminating typical browser video lag and memory leaks.
*   **Dynamic Source Control:** Instantly switch between `Local`, `Remote`, or `Hybrid` surveillance modes via the global operations toggle.
*   **Remote Web-Link Uplink:** Generate unique encrypted links (linked via WebSockets) to turn any smartphone into a wireless surveillance node without configuration.

### **2. Intelligence Deep-Link (AI Models)**
*   **Object & Activity Detection (YOLOv11):** Specifically trained to detect security-critical activities:
    *   🚨 **Weapons:** Detects guns, knives, and other prohibited objects.
    *   🚬 **Smoking:** Identifies unauthorized smoking in restricted zones.
    *   👊 **Violence:** Monitors for physical altercations and aggressive behavior.
*   **Biometric Target-Lock (FaceNet + MTCNN):** 
    *   **Signature Extraction:** Extract 512-dimensional biometric feature vectors from any uploaded target photo.
    *   **Real-Time Pursuit:** Matches the target's signature across all active camera feeds using high-speed cosine similarity.
*   **Advanced Person Tracking (Re-ID Engine):**
    *   **Persistent Identity Assignment:** Assigns unique, persistent tracking IDs (e.g., `P-001`, `P-002`) to every individual detected in the surveillance zone.
    *   **Intelligent Cooldown Logic:** Implements a 5-minute re-show cooldown. The system "remembers" individuals and only re-flags them if they reappear after the cooldown period, preventing alert fatigue.
    *   **Face Crop Extraction:** Automatically extracts and high-resolution crops of faces from detection events for immediate visual verification.
*   **Activity Heatmap Matrix:** Visualizes movement hotspots over a 60x80 decaying intensity grid, allowing operators to see "frequented paths" within the surveillance zone.

### **3. Tactical Operational Controls**
*   **Precision Sensitivity Sliders:** Indvidually fine-tune the detection confidence thresholds for each class directly from the dashboard.
*   **Notification Engine:** 
    *   **Visual Evidence:** Automated SMTP-encrypted emails containing incident timestamps and visual snapshots.
    *   **Auditory Alerts:** Global sound toggles for specific high-priority detection events.
    *   **Web-Toasts:** Instant real-time alerts delivered through a dedicated WebSocket monitoring stream.
    *   **Comm-Link Control:** Global toggle to enable/disable external SMTP notifications directly from the tactical dashboard.
*   **Operator Identity & Authorization:**
    *   **Verified Credentials:** Real-time display of the registered operator's email and authorization level (e.g., LEVEL_01_ACCESS).
    *   **System Diagnostics:** Integrated monitoring of SMTP link status, core processing latency, and local uplink IP addresses.
*   **Visual Operational Logs:**
    *   **PERSONS_LOG Panel:** A real-time scrolling feed of all detected individuals featuring face thumbnails, unique IDs, and arrival timestamps.
    *   **Biometric Detail Modal:** Click any log entry to open a full-screen tactical view of the captured face crop with metadata (Feed ID, Timestamp, Status).
    *   **Card-Based Watchlist DB:** A redesigned management interface where all biometric targets are displayed as high-fidelity cards with face photos and search-lock status.

---

## 🌎 **Geospatial & Situational Awareness**

*   **Auto-Location Isolation:** Cameras automatically detect their coordinates via IP-API geolocation upon startup.
*   **Interceptor Proximity:** Real-time **Haversine Distance** calculation between the operator's control center and the threat's location.
*   **Tactical Map Links:** Every incident alert includes a direct coordinate link to Google Maps for rapid response coordination.

---

## 🛠️ **System Technical Stack**

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **🚀 Backend** | **FastAPI (Asynchronous Python)** | Sub-20ms inference speed and async WebSocket handling. |
| **🧠 Object AI** | **YOLOv11 (Ultralytics Engine)** | Real-time weapon, smoking, and violence classification. |
| **🔍 Facial AI** | **FaceNet (InceptionResnetV1) & MTCNN** | 98%+ accurate biometric signature matching. |
| **🎨 Frontend** | **ReactJS (TypeScript) & Framer Motion** | "War-Room" aesthetic with high-performance animations. |
| **📡 Protocols** | **WSS (Binary WebSockets) & SMTP** | Real-time incident alerts and binary streaming. |
| **🔗 Person Stream** | **WSS (/ws/persons)** | Dedicated high-speed stream for Re-ID events and face thumbnails. |
| **🗄️ Database** | **SQLite & SQLAlchemy (ORM)** | Encrypted user management and watchlist persistence. |

---

## 🚀 **Quick Setup & Deployment**

### **1. Configure Environmental Parameters (`.env`)**
Create a `.env` file in the `backend/` directory:
```env
SMTP_EMAIL=your-email@gmail.com
SMTP_PASSWORD=your-app-specific-password
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=465
CAMERA_ID=CENTRAL_OPS_NODE_01
```

### **2. Launch Local Environment**
```bash
# Start Backend
cd backend
pip install -r requirements.txt
python main.py

# Start Frontend
cd frontend
npm install
npm run dev
```

---

## 🧪 **FYP Innovation Points (Presentation Highlights)**

*   **Distributed Scalability:** Unlike traditional systems restricted to a DVR, SmartSurv can ingest cameras from anywhere in the world via WebSocket binary tunneling.
*   **Parallel Inference Engine:** The `CameraEngine` utilizes a `ThreadPoolExecutor` to run YOLO and Biometric Face Matching simultaneously without dropping frame rates.
*   **Person Re-Identification (Re-ID):** The system maintains an in-memory buffer of detected entities with 5-minute re-show cooldown logic to maximize situational awareness without redundancy.
*   **Unified UI/UX:** A "single-pane-of-glass" dashboard that integrates AI thresholds, real-time video, biometric logs, identity management, and system diagnostics into one cohesive war-room interface.
*   **Administrative Transparency:** Real-time feedback on system health, including SMTP connectivity and network uplink status, ensuring the operator is always aware of the system's operational readiness.

---

## ⚖️ **Ethics & Privacy Disclosure**

To ensure compliance with GDPR and local privacy standards:
*   **Volatile Data:** Facial embeddings used for real-time tracking are never permanently stored without explicit administrative authorization.
*   **In-Memory Processing:** Raw video streams are processed in-memory and never cached persistently on the server disk unless an incident is triggered.

---
**Developed by Ali Hassan | Final Year Project**
