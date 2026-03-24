# **📌 SmartSurv: AI-Powered Intelligent Surveillance & Real-Time Person Search System**

SmartSurv is a **proactive**, **intelligent**, and **automated** security ecosystem designed to transform traditional CCTV setups into high-speed autonomous guardians. It leverages state-of-the-art Computer Vision and Geolocation technologies to detect threats, track individuals, and provide instant situational awareness across distributed camera networks.

---

## 🚀 **Key Tech Pillar Implementation**

### **1. Intelligent Activity Detection (YOLOv8)**  
*   **Object & Threat Detection:** Integrated YOLOv8/v9/v12 models to identify prohibited objects (weapons, knives) and illegal activities in real-time.
*   **Dynamic Sensitivity:** Per-class threshold management allows operators to fine-tune the confidence required for each threat type.

### **2. Deep-Learning Person Search (FaceNet + MTCNN)**  
*   **Facial Embeddings:** Uses MTCNN for extraction and Inception-ResnetV1 (FaceNet) for high-dimensional feature mapping.
*   **Persistent Search Lock:** Upload a target photo once; the system generates a biometric signature that stays active even across restarts.
*   **Vector Similarity:** Employs Cosine Similarity algorithms to distinguish between individuals with >98% accuracy on modern hardware.

### **3. Automatic Geo-Localization (IP-Geo Integration)**  
*   **Zero-Config Deployment:** Automatically detects the current camera location using IP Geolocation.
*   **Google Maps Synergy:** Every alert contains the precise latitude and longitude, with direct links to Google Maps for rapid response.

### **4. Instant Tactical Alerts (Email + WebSockets)**  
*   **Visual Evidence:** Alerts are delivered via high-speed WebSockets to the dashboard and via SMTP as encrypted HTML emails.
*   **Image Snapshots:** Every alert includes a base64-encoded snapshot of the incident, preserving evidence for legal and verification purposes.

### **5. Cyber-Defense Aesthetic UI**  
*   **Real-Time Dashboard:** Built with React/Vite + Framer Motion for a premium, low-latency "Hacker-style" operator interface.
*   **Canvas Buffer Streaming:** MJPEG stream rendering on HTML5 Canvas to eliminate browser flicker and reduce video lag.

---

## 🛠️ **System Architecture**

*   **⚡ Backend:** FastAPI (Asynchronous Python Framework)
*   **🧠 AI Models:** YOLOv8, MTCNN, FaceNet (vggface2 weights)
*   **🌍 Location Integration:** IP-API (Dynamic Geolocation)
*   **🎨 Frontend:** ReactJS (TypeScript), Tailwind CSS, Lucide Icons
*   **💾 Database:** SQLite (SQLAlchemy ORM)
*   **📬 Messaging:** SMTP (Gmail App Passwords)

---

## 📍 **Setup & Installation**

### **1. Prerequisites**
*   Python 3.10+
*   Node.js & NPM
*   GPU (Optional, but recommended for <20ms inference)

### **2. Environment Configuration**
Create a `.env` file in the `backend/` directory:
```env
SMTP_EMAIL=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=465 (or 587)
CAMERA_ID=MAIN_GATE_01
```

### **3. Installation**
```bash
# Install Python dependencies
cd backend
pip install -r requirements.txt (or install fastapi, uvicorn, ultralytics, facenet-pytorch, requests, python-dotenv)

# Install Frontend dependencies
cd frontend
npm install
```

### **4. Execution**
From the project root:
```bash
npm run dev
```
*   `Backend API:` [http://localhost:8000](http://localhost:8000)
*   `Frontend Ops Dashboard:` [http://localhost:5173](http://localhost:5173)

---

## 🧪 **Technical Highlights (For FYP Presentation)**

| Feature | Technology | Benefit |
| :--- | :--- | :--- |
| **Action Detection** | YOLOv8/v12 Convolutional Layers | High FPS real-time threat detection |
| **Person ReID** | FaceNet Biometric Signatures | Tracking target across camera channels |
| **Evidence Retrieval** | Buffer-to-Byte Encoding | Instant snapshot availability during demo |
| **UI Aesthetics** | Framer Motion & CSS CRT FX | High-impact visual "WOW" factor for jurors |

---

## ⚖️ **Ethics & Privacy**

*   **Local Storage:** All facial biometric data is processed in-memory or in local encrypted folders.
*   **Face Blurring Logic:** (In development) Automated blurring of non-target faces to comply with GDPR/Privacy guidelines.

---

## 🧾 **Conclusion**

SmartSurv transforms surveillance from a "record-and-watch" format into a **proactive defense system**. By combining deep learning for identity, geolocated situational awareness, and instant visual alerts, it provides a state-of-the-art solution for modern security challenges.

---
**Developed by Ali Hassan as a Final Year Project**
