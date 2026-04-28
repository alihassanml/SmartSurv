# 🛡️ **SmartSurv: Advanced AI-Powered Intelligent Surveillance Ecosystem**

**SmartSurv** is a high-performance, autonomous security ecosystem designed to transform legacy CCTV infrastructures into an intelligent, proactive monitoring network. By leveraging **Distributed Edge Computing**, **Multimodal AI (CLIP + FaceNet + YOLO)**, **Real-Time Computer Vision**, and a **Premium Modern Web Architecture**, SmartSurv provides instant situational awareness and threat detection across distributed camera nodes.

---

## 🧠 **Next-Generation AI Capabilities**

### **1. 🔎 Semantic Natural Language Search (Visual Intelligence)**
SmartSurv integrates **Contrastive Language-Image Pre-training (CLIP)** — the foundational technology behind DALL-E — as a real-time person attribute engine.
*   **Attribute-Aware Tracking:** Every person detected is automatically encoded into a 512-dimensional visual semantic vector capturing traits like *clothing color, gender presentation, carried objects, and body type*.
*   **Natural Language Queries:** Operators can search the `PERSONS LOG` using plain English descriptions (e.g., *"person in red shirt"*, *"man carrying a backpack"*).
*   **Ranked Results:** The system re-ranks all logged individuals by cosine similarity, surfacing the best matches with a `% MATCH` score and visual highlighting.

### **2. ⚡ Ultra-Low Latency Video Streaming**
*   **WebRTC Architecture:** Video feeds are streamed using UDP-based WebRTC tracks, achieving sub-100ms latency and eliminating the 1-2 second lag typical of traditional IP cameras.
*   **Independent Camera Matrix:** Control Local and URL/IP cameras completely independently. Activating a remote URL camera no longer requires the local hardware camera to be active, saving bandwidth and processing power.

### **3. 🤖 ONNX Runtime Acceleration**
*   **Compiled Inference:** The YOLO model is compiled into an optimized ONNX graph, skipping Python execution overhead.
*   **3x Speed Boost:** Provides a massive increase in detection throughput, allowing more high-resolution cameras to be processed simultaneously on commercial hardware.

### **4. 🕵️ Behavioral Intelligence & Loitering Detection**
*   **Temporal Human Behavior:** The system monitors how long a specific `person_id` has been in a designated zone.
*   **Autonomous Alerts:** If a unique person lingers for more than 60 seconds (configurable), the system triggers a `BEHAVIORAL_ALERT` with a face thumbnail.

### **5. 🛡️ Privacy Guard (Ethical AI & GDPR Compliance)**
*   **Real-Time Anonymization:** Applies a heavy Gaussian Blur to every detected face in the live video stream in real-time.
*   **Selective Decryption:** Intelligently reveals faces **only** if the person is a verified **Watchlist Target** or under active **Tactical Focus**.
*   **Data Minimization:** Enabling Privacy Guard automatically halts all unauthorized biometric logging.

### **6. 🎯 Tactical Focus Mode**
*   **Cross-Camera Tracking:** Click any person in the log to establish a "Tactical Focus." The Re-ID engine will immediately flag and track this identity across all active feeds (local + remote).
*   **Live HUD Banner:** Displays real-time status (`LOCKED_IN_FEED` or `SEARCHING_FEEDS`) directly on the surveillance video overlay.

---

## 🎨 **Premium UI/UX & Design System**

SmartSurv completely reimagines the surveillance dashboard interface, moving away from outdated, dark, clunky software into a **"Premium Light Blue Bento"** aesthetic.
*   **Apple-Like Typography:** Utilizes modern, highly legible fonts (Inter/SF Pro) for a clean, professional data presentation.
*   **Dynamic Glassmorphism:** Features subtle blurs, multi-layered deep shadows, and 0.05 opacity background tints perfectly matched to primary accent colors.
*   **Micro-Animations:** Fluid layout transitions (Framer Motion) and hover zoom effects (`scale: 1.02`) replace jarring screen reloads, making the interface feel responsive and alive.
*   **Floating Controls:** Unobtrusive, backdrop-blurred circular buttons overlay the video feeds for an edge-to-edge viewing experience.

---

## 🏛️ **Governance & Institutional Command**

Designed for large-scale security operations (e.g., Police Stations, Hospitals, Corporate Campuses).
*   **Multi-Tier RBAC:** Supports `Admin`, `Organization`, and standard `User` roles.
*   **Approval Workflows:** New administrative accounts are placed in a `PENDING_APPROVAL` state until an existing Master Admin verifies them.
*   **Station Profiles:** Organizations receive a dedicated dashboard stripped of configuration noise, focusing entirely on live incident response and telemetry.
*   **Granular Incident Management:** Admins possess the ability to permanently delete specific security alerts. Due to privacy-first architecture, deleting an alert completely wipes its associated Base64 image and biometric history from the database.

---

## 📊 **Pro Analytics Suite**

*   **Threat Signature Radar:** A multi-dimensional radar chart mapping the distribution of threat types (Gun vs. Knife vs. Violence) in real-time.
*   **Detection Density Scatter:** A temporal scatter plot (Confidence vs. Time) tracking AI reliability and identifying high-risk time windows.
*   **Live System Diagnostics:** Real-time WebSocket streams track inference latency (ms) and system load.

---

## 🛠️ **System Technical Stack**

| **Layer** | **Technology** | **Purpose** |
| :--- | :--- | :--- |
| **🚀 Backend** | **FastAPI (Async Python)** | High-performance API, background task scheduling, and async WebSockets. |
| **🧠 Real-Time Video** | **WebRTC & OpenCV** | Ultra-low latency streaming for instant visualization. |
| **⚡ Inference Engine** | **ONNX Runtime** | Optimized C++ backend providing 3x AI speed boost. |
| **🛡️ Database** | **SQLite & SQLAlchemy** | Efficient, embedded relational data storage for alerts and users. |
| **🧠 Object AI** | **YOLOv11 (Ultralytics)** | High-speed weapon, smoking, and violence classification. |
| **🔍 Facial AI** | **FaceNet & MTCNN** | 98%+ accurate biometric signature matching. |
| **🧬 Semantic AI** | **OpenCLIP ViT-B-32** | Natural language person search via multimodal visual embeddings. |
| **🎨 Frontend** | **React 19 (TypeScript)** | Next-generation UI with Vite Fast-Refresh and Framer Motion. |
| **🎨 Styling** | **Tailwind CSS + Vanilla** | Bespoke "Light Bento" design system with deep shadows. |

---

## 🚀 **Quick Setup & Deployment**

### **1. Configure Environmental Parameters (`.env`)**
Create a `.env` file in the `backend/` directory:
```env
SMTP_EMAIL=your-email@gmail.com
SMTP_PASSWORD=your-app-specific-password
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=465
```

### **2. Launch Local Environment**
```bash
# Start Backend (first run downloads AI models automatically)
cd backend
pip install -r requirements.txt
python main.py

# Start Frontend
cd frontend
npm install
npm run dev
```

---

## ⚖️ **Ethics & Privacy Architecture**

SmartSurv is designed with **Responsible AI** principles at its core:
*   **Data Minimization:** Facial embeddings are in-memory only; never persisted without authorization.
*   **GDPR Compliance:** Privacy Guard auto-blurs all unauthorized faces in real-time.
*   **Consent & Access:** Strict Role-Based Access Control (RBAC) prevents unauthorized system access.
*   **Retention Limits:** Re-ID buffer entries automatically expire after 10 minutes of inactivity.

> *This system is intended for **authorized security operations only**. Misuse for unlawful surveillance is strictly prohibited.*

---
**Developed by Ali Hassan | Final Year Project — 2025**
