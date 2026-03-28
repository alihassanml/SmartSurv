# **📌 SmartSurv: AI-Powered Intelligent Surveillance & Real-Time Person Search System**

SmartSurv is a **proactive**, **intelligent**, and **automated** security ecosystem designed to transform traditional CCTV setups into high-speed autonomous guardians. It leverages state-of-the-art Computer Vision, Geolocation, and Distributed Edge Computing to detect threats, track individuals, and provide instant situational awareness across distributed camera networks.

---

## 🛠️ **Dashboard & Control Center Features**

### **1. Real-Time Security Operations (Ops_Core)**
*   **Hybrid Monitoring Mode:** Simultaneously process and display multiple live camera feeds: Local Laptop Webcams + Multiple Remote Mobile Devices.
*   **Dynamic Grid Layout:** The dashboard automatically scales into a responsive grid (1, 2, 4, 6, or 9 camera screens) based on the number of active surveillance nodes.
*   **MJPEG Canvas Rendering:** Uses a high-performance custom canvas buffer to eliminate video lag and browser flickering, delivering smooth real-time visual monitoring.

### **2. Intelligence Modules (System_Parameters)**
*   **Activity Detection (YOLOv8/v12):** Detects prohibited objects (weapons, knives) and suspicious actions in real-time.
*   **Person Search (FaceNet + MTCNN):** Extracts facial biometric signatures from an uploaded photo and performs a real-time "Target-Lock" across all active camera channels.
*   **Dual-Process Execution:** Run detection, search, or **Both (Hybrid Link)** simultaneously on ogni frame.

### **3. Operational Controls & Fine-Tuning**
*   **Precision Threshold Sliders:** Fine-tune confidence requirements for every detection class (Handgun, Knife, Person, etc.) independently via real-time sliders.
*   **Selective Audio Alerts:** Toggle alert sounds (drop/ping) for specific detection categories or the target-match person search.
*   **Remote Source Selection:** Instantly switch between **Local** (laptop), **Remote** (external nodes), or **Hybrid** (all-active) sources via a global dropdown.
*   **Encrypted Email Protocol:** Toggle automated email reports that include geolocated maps and visual evidence snapshots.

### **4. Distributed Deployment (Edge_Link)**
*   **Phone-to-Surveillance Uplink:** Turn any smartphone into a wireless security camera node.
*   **QR-Assisted Connection:** Generate unique remote links with randomized client IDs, allowing multiple mobile devices to join the surveillance network instantly without any setup.

---

## 🧠 **Core AI Implementation Pillars**

### **1. Computer Vision Pipeline**
*   **Detection Engine:** Custom YOLOv8/v12 weights optimized for security-specific object classes.
*   **Biometric Mapping:** 512-dimensional facial feature extraction using FaceNet (Inception-ResnetV1) with 98%+ accuracy.
*   **MTCNN Face Extraction:** Automatic face alignment and extraction from video frames for high-quality biometric verification.

### **2. Geospatial Situational Awareness**
*   **Auto-Geo Isolation:** Automatic camera location detection using IP-API Geolocation services.
*   **Tactical Map Integration:** Every detected alert includes precise coordinates and direct links to Google Maps.
*   **Intercept Distance Calculation:** Real-time distance measurement (KM) between the operator's control center and the threat's camera location.

---

## 🛠️ **System Technical Stack**

*   **⚡ Backend:** FastAPI (Asynchronous Python for sub-20ms inference)
*   **🧠 AI Models:** YOLO (8/12), MTCNN, FaceNet (vggface2 weights)
*   **🎨 Frontend:** ReactJS (TypeScript), Framer Motion, Lucide Icons, Tailwind CSS
*   **📬 Messaging:** SMTP (Gmail App Passwords) for visual evidence delivery
*   **WebSocket Protocol:** WSS for binary image data and real-time alert streams

---

## 📍 **Quick Setup & Execution**

### **1. Backend Config (.env)**
```env
SMTP_EMAIL=your-email@gmail.com
SMTP_PASSWORD=your-app-password
CAMERA_ID=CENTRAL_OPS_01
```

### **2. Startup Commands**
```bash
# Start Backend
cd backend
python main.py

# Start Frontend
cd frontend
npm run dev
```
*   `Dashboard URL:` [http://localhost:5173/dashboard](http://localhost:5173/dashboard)
*   `Remote Node URL:` [http://localhost:5173/remote-camera](http://localhost:5173/remote-camera)

---

## 🧪 **FYP Technical Highlights (Presentation Points)**

| Feature | Technical Implementation | Benefit |
| :--- | :--- | :--- |
| **Distributed Node Control** | WebSocket Binary Buffering | Unlimited remote camera scalability |
| **Parallel Inference** | Multi-Threaded Model Execution | Real-time Detection + Tracking on all feeds |
| **Biometric Search** | FaceNet Embedding Vectors | Target tracking across different environments |
| **Geospatial Tracking** | Haversine Distance Calculation | Accurate threat-to-operator proximity |
| **Tactical UI** | Canvas-based MJPEG decoder | "War-Room" aesthetic for high situational awareness |

---

## ⚖️ **Ethics & Privacy Protocol**

*   **In-Memory Processing:** Facial data is never permanently stored without encryption to ensure GDPR/Local privacy compliance.
*   **Local Security:** All biometric signatures are generated and processed within the local server environment.

---
**Developed by Ali Hassan as a Final Year Project**
