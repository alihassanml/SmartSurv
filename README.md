# 🛡️ **SmartSurv: Advanced AI-Powered Intelligent Surveillance & Real-Time Biometric Search**

**SmartSurv** is a high-performance, autonomous security ecosystem designed to transform legacy CCTV infrastructures into an intelligent, proactive monitoring network. By leveraging **Distributed Edge Computing**, **Multimodal AI (CLIP + FaceNet)**, **Real-Time Computer Vision**, and **Geospatial Intelligence**, SmartSurv provides instant situational awareness and threat detection across distributed camera nodes.

---

## 🧠 **Next-Generation AI Features (2025 Era)**

### **1. 🔎 Semantic Natural Language Search (Visual Intelligence)**
SmartSurv introduces **Contrastive Language-Image Pre-training (CLIP)** — the same foundational technology behind DALL-E and Midjourney — as a real-time person attribute engine.

*   **Attribute-Aware Tracking:** Every person detected is automatically encoded into a 512-dimensional visual semantic vector capturing traits like *clothing color, gender presentation, carried objects, and body type*.
*   **Natural Language Queries:** Instead of searching by ID or timestamp, operators can type plain descriptions into the `PERSONS_LOG` search bar:
    *   *"person in red shirt"*
    *   *"man carrying a backpack"*
    *   *"woman in dark clothes"*
*   **Ranked Results:** The system instantly re-ranks all logged individuals by cosine similarity to your text query, surfacing the best matches with a `% MATCH` score badge.
*   **Visual Highlight:** Top-matching cards (>25% similarity) glow in cyan to provide immediate visual confirmation.
*   **Debounced Live Search:** A 400ms debounce ensures smooth, real-time filtering without flooding the AI inference pipeline.

> **Model Used:** OpenCLIP `ViT-B-32` (laion2b_s34b_b79k) — downloaded once (~350MB) and cached locally.

---

### **2. 🛡️ Privacy Guard — Selective Face Redaction (Ethical AI)**
SmartSurv includes an industry-standard **Privacy-by-Design** system, purpose-built for GDPR compliance and responsible surveillance.

*   **Real-Time Anonymization:** When enabled, the AI engine applies a heavy **Gaussian Blur** to every detected face in the live video stream in real time using OpenCV.
*   **Selective Decryption:** The system is intelligent — it will **not** blur a face if:
    *   The person is a verified **Watchlist Target** (threat-confirmed identity).
    *   The person is under active **Tactical Focus** surveillance.
*   **Ethical Person Log Sync:** Enabling Privacy Guard automatically disables the `PERSONS_LOG` face-capture panel, preventing any unauthorized biometric logging of bystanders.
*   **HUD Indicator:** A `PRIVACY_GUARD_ACTIVE` badge appears on each camera feed when the system is in redaction mode.
*   **Persistent State:** Privacy Guard status is synchronized between the backend engine and the UI via the `/api/camera/privacy` endpoint.

---

### **3. 🎯 Tactical Focus Mode — Cross-Camera Target Lock**
A high-priority operator control for active pursuit scenarios.

*   **Identity Lock-On:** Click any person in the `PERSONS_LOG` and press **"ESTABLISH_TACTICAL_FOCUS"** to declare them a priority surveillance target.
*   **Cross-Camera Tracking:** The Re-ID engine immediately flags this identity across all active feeds (local + remote mobile nodes).
*   **Live HUD Banner:** A Tactical Focus HUD appears at the top of the video grid displaying:
    *   `STATUS: LOCKED_IN_FEED` *(green)* — target is currently visible.
    *   `STATUS: SEARCHING_FEEDS...` *(red)* — target has moved off-screen.
*   **Visual Marker:** The focused person's card in the `PERSONS_LOG` is highlighted with a pulsing red border and targeting icon.
*   **Focus Termination:** Click **"TERMINATE_FOCUS"** in the modal or the `X` in the HUD to release the lock.

---

## 📺 **Mission Control Dashboard Features**

### **4. Hybrid Monitoring Mode (Ops_Core)**
*   **Unified Grid Infrastructure:** Process and display multiple live camera feeds simultaneously including **Local Laptop Cameras** and **Remote Mobile Nodes**.
*   **Low-Latency Canvas Rendering:** Utilizes a custom high-performance canvas buffer for decoding MJPEG streams, eliminating typical browser video lag and memory leaks.
*   **Dynamic Source Control:** Instantly switch between `Local`, `Remote`, or `Hybrid` surveillance modes via the global operations toggle.
*   **Remote Web-Link Uplink:** Generate unique encrypted links (linked via WebSockets) to turn any smartphone into a wireless surveillance node without configuration.

### **5. Intelligence Deep-Link (AI Models)**
*   **Object & Activity Detection (YOLOv11):** Specifically trained to detect security-critical activities:
    *   🚨 **Weapons:** Detects guns, knives, and other prohibited objects.
    *   🚬 **Smoking:** Identifies unauthorized smoking in restricted zones.
    *   👊 **Violence:** Monitors for physical altercations and aggressive behavior.
*   **Biometric Target-Lock (FaceNet + MTCNN):**
    *   **Signature Extraction:** Extract 512-dimensional biometric feature vectors from any uploaded target photo.
    *   **Real-Time Pursuit:** Matches the target's signature across all active camera feeds using high-speed cosine similarity.
*   **Advanced Person Tracking (Re-ID Engine):**
    *   **Persistent Identity Assignment:** Assigns unique tracking IDs (e.g., `P-001`, `P-002`) to every individual detected.
    *   **Intelligent Cooldown Logic:** 5-minute re-show cooldown prevents alert fatigue.
    *   **Semantic Embedding Storage:** Stores CLIP visual embeddings alongside FaceNet identity embeddings for dual-mode person representation.
*   **Activity Heatmap Matrix:** Visualizes movement hotspots over a 60x80 decaying intensity grid.

### **6. Tactical Operational Controls**
*   **Precision Sensitivity Sliders:** Fine-tune detection confidence thresholds for each class individually.
*   **Notification Engine:**
    *   **Visual Evidence:** Automated SMTP-encrypted emails with incident snapshots.
    *   **Auditory Alerts:** Global sound toggles for specific detection events.
    *   **Comm-Link Control:** Toggle SMTP notifications from the dashboard.
*   **Operator Identity & Authorization:**
    *   **Verified Credentials:** Real-time display of registered operator email and authorization level.
    *   **System Diagnostics:** SMTP link status, core latency, and local uplink IP monitoring.
*   **Visual Operational Logs:**
    *   **PERSONS_LOG + Semantic Search:** Face thumbnails, IDs, timestamps, and natural language filtering.
    *   **Biometric Detail Modal:** Full-screen tactical view with Focus and metadata controls.
    *   **Card-Based Watchlist DB:** Management interface with face photos and search-lock status.

---

## 🌎 **Geospatial & Situational Awareness**

*   **Auto-Location Isolation:** Cameras automatically detect coordinates via IP-API geolocation.
*   **Interceptor Proximity:** Real-time **Haversine Distance** calculation between operator and threat location.
*   **Tactical Map Links:** Every alert includes a direct Google Maps coordinate link.

---

## 🛠️ **System Technical Stack**

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **🚀 Backend** | **FastAPI (Async Python)** | Sub-20ms inference and async WebSocket handling. |
| **🧠 Object AI** | **YOLOv11 (Ultralytics)** | Weapon, smoking, and violence classification. |
| **🔍 Facial AI** | **FaceNet (InceptionResnetV1) & MTCNN** | 98%+ accurate biometric signature matching. |
| **🧬 Semantic AI** | **OpenCLIP ViT-B-32 (LAION-2B)** | Natural language person search via multimodal embeddings. |
| **🛡️ Privacy AI** | **OpenCV Gaussian Blur** | Real-time selective face redaction (GDPR compliance). |
| **🎨 Frontend** | **ReactJS (TypeScript) & Framer Motion** | "War-Room" UI with high-performance animations. |
| **📡 Protocols** | **WSS (WebSockets) & SMTP** | Real-time alerts and binary streaming. |
| **🗄️ Database** | **SQLite & SQLAlchemy** | Encrypted user management and watchlist persistence. |

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
# Start Backend (first run downloads CLIP model ~350MB)
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

*   **Multimodal AI Fusion:** Unique combination of three AI systems — YOLOv11 (object), FaceNet (biometric), and CLIP (semantic) — running concurrently on the same video pipeline. No comparable open-source FYP exists with this combination.
*   **Natural Language Surveillance:** Operators can search CCTV logs using plain English descriptions (e.g., "man in blue jacket") — a capability previously only available in enterprise products costing tens of thousands of dollars.
*   **Privacy-by-Design Architecture:** Real-time selective face blurring protects bystander privacy at the AI level, not just the policy level. Faces are blurred _before_ they reach any log or human eye, unless algorithmically authorized.
*   **Distributed Scalability:** Unlike traditional DVR-based systems, SmartSurv ingests cameras from anywhere in the world via WebSocket binary tunneling.
*   **Parallel Inference Engine:** `ThreadPoolExecutor` runs YOLO + FaceNet + CLIP simultaneously without dropping frame rates.
*   **Person Re-Identification (Re-ID):** In-memory buffer with 5-minute cooldown logic, dual FaceNet + CLIP embeddings, and cross-camera tracking via Tactical Focus Mode.
*   **Unified UI/UX:** Single-pane-of-glass dashboard integrating AI thresholds, live video, semantic search, biometric logs, privacy controls, and system diagnostics.

---

## ⚖️ **Ethics & Privacy Architecture**

SmartSurv is designed with **Responsible AI** principles at its core:

| Principle | Implementation |
| :--- | :--- |
| **Data Minimization** | Facial embeddings are in-memory only; never persisted without authorization. |
| **GDPR Compliance** | Privacy Guard auto-blurs all unauthorized faces in real time. |
| **Consent & Access** | Role-based authentication prevents unauthorized system access. |
| **Transparency** | `PRIVACY_GUARD_ACTIVE` HUD badge informs all operators of current privacy state. |
| **Retention Limits** | Re-ID buffer entries automatically expire after 10 minutes of inactivity. |

> This system is intended for **authorized security operations only**. Misuse for unlawful surveillance is strictly prohibited.

---
**Developed by Ali Hassan | Final Year Project — 2025**


**SmartSurv** is a high-performance, autonomous security ecosystem designed to transform legacy CCTV infrastructures into an intelligent, proactive monitoring network. By leveraging **Distributed Edge Computing**, **Real-Time Computer Vision**, and **Geospatial Intelligence**, SmartSurv provides instant situational awareness and threat detection across distributed camera nodes.

