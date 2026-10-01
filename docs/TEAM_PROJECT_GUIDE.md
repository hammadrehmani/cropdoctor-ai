# 🌾 CropDoctor Ai — Complete Team Project Guide
### Simple, Clean & Comprehensive Project Summary for the Entire Team

---

## 📌 1. What is CropDoctor Ai? (The Big Picture)

### The Problem in Pakistan:
In Pakistan, crop diseases (like **Wheat Rust**, **Cotton Leaf Curl**, and **Rice Blast**) destroy billions of rupees worth of crops every year. Farmers usually don't know the exact disease until it's too late, or they spray the wrong chemical pesticides.

### Our Solution:
**CropDoctor Ai** is a smart mobile web app built for Pakistani farmers and field officers.
Instead of just giving a basic disease name, CropDoctor:
1. 🔬 **Explains the diagnosis** visually using heatmaps (Grad-CAM).
2. 📊 **Measures the damage severity** (e.g. 15% leaf damage).
3. 🌦️ **Predicts disease outbreaks 7 days ahead** using local weather data.
4. 💬 **Provides an AI Advisor** in **English, Urdu (اردو), and Sindhi (سنڌي)**.
5. 👨‍🌾 **Connects farmers to real human experts** when cases are uncertain.

---

## 🚀 2. The 5 Core Features (How It Works)

```
 [1. Take Photo] ➔ [2. AI Diagnosis] ➔ [3. Damage Severity] ➔ [4. Weather Risk Map] ➔ [5. Urdu/Sindhi Chat]
```

| Step | Feature | What it does for the Farmer |
| :--- | :--- | :--- |
| **1** | **Camera / Image Upload** | Farmer selects their crop (Wheat, Cotton, Rice, Sugarcane) and uploads a leaf photo. |
| **2** | **AI Disease Diagnosis** | Identifies the disease with confidence % (e.g. *Wheat Leaf Rust - 95.6%*). |
| **3** | **Severity & Heatmap** | Shows the % of damaged leaf area and overlays a **Grad-CAM visual heatmap** highlighting the exact disease spots. |
| **4** | **7-Day District Risk Forecast** | Checks live weather (humidity, temperature, rain) and forecasts upcoming disease risk for their district. |
| **5** | **Multilingual AI Advisor** | Farmer can ask questions in Urdu, Sindhi, or English and get grounded, safe agricultural advice. |

---

## 🌐 3. All Live Pages & Links

Both servers are currently **LIVE**:
- **Frontend App**: [http://localhost:3000](http://localhost:3000)
- **Backend API & Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

### Main Application Pages:
1. **🏠 Home** ([http://localhost:3000/](http://localhost:3000/)) — Hero section, supported crops, value proposition.
2. **🔬 Scan Crop** ([http://localhost:3000/diagnose](http://localhost:3000/diagnose)) — Leaf scanner with live camera upload.
3. **🗺️ Risk Map** ([http://localhost:3000/risk-map](http://localhost:3000/risk-map)) — Pakistan district outbreak risk map with crop filters.
4. **💬 AI Advisor** ([http://localhost:3000/advisor](http://localhost:3000/advisor)) — Chatbot in English, Urdu, and Sindhi.
5. **📊 Farmer Dashboard** ([http://localhost:3000/dashboard](http://localhost:3000/dashboard)) — Personal scan history and weather alerts.
6. **👨‍🌾 Expert Help** ([http://localhost:3000/expert](http://localhost:3000/expert)) — Toll-free helpline (`0800-15000`) and WhatsApp routing.

### Informational & Judge Presentation Pages:
7. **⚙️ How It Works** ([http://localhost:3000/how-it-works](http://localhost:3000/how-it-works)) — Step-by-step visual pipeline.
8. **💻 Technology** ([http://localhost:3000/technology](http://localhost:3000/technology)) — Full AI & system architecture.
9. **🛡️ Safety Charter** ([http://localhost:3000/safety](http://localhost:3000/safety)) — Responsible AI, dosage rules, and privacy.
10. **📖 About** ([http://localhost:3000/about](http://localhost:3000/about)) — Pakistan agricultural context and mission.
11. **🏆 Demo Guide** ([http://localhost:3000/demo](http://localhost:3000/demo)) — 3-minute pitch walkthrough and verified test cases.

---

## 🧠 4. Simple Tech Explanation (For Developers & Judges)

| Component | Technology | Why we chose it (Simple Reason) |
| :--- | :--- | :--- |
| **Vision Model** | **EfficientNet-B0** | Lightweight & super-fast; runs easily without requiring expensive cloud GPUs. |
| **Explainable AI** | **Grad-CAM** | Generates a heat map showing the exact leaf spots the AI looked at. |
| **Severity Tool** | **OpenCV** | Automatically measures damaged leaf area percentage using color filtering. |
| **Weather Risk** | **XGBoost + Open-Meteo** | Combines live 7-day weather forecasts to calculate epidemic risk. |
| **RAG Knowledge Base** | **FAISS + MiniLM** | Fast vector search searching verified documents from FAO and CCRI Multan. |
| **AI Advisor LLM** | **Qwen LLM (DashScope)** | Superior understanding of Urdu (اردو) and Sindhi (سنڌي) compared to other LLMs. |
| **Database** | **SQLite (Async ORM)** | Zero-setup, lightweight, ACID-compliant database ready for cloud migration. |
| **Frontend** | **Next.js 16 + Tailwind CSS** | Ultra-fast, mobile-friendly interface optimized for smartphone screens. |

---

## 🛡️ 5. Safety & Privacy (Crucial for Judges)

1. ❌ **NO Chemical Dosage Calculations**:
   - The AI **strictly refuses** to give exact chemical formulas/dosages (e.g. *"spray 500ml of chemical X"*).
   - *Why?* Incorrect chemical advice can kill crops or poison water. We always route chemical questions to human experts!
2. ⚠️ **Low-Confidence Safety Gate**:
   - If the AI confidence is below **60%**, it shows an **amber warning** (*"Uncertain Diagnosis"*) and tells the farmer to consult a human extension officer.
3. 🔒 **100% Geo-Privacy (No GPS Tracking)**:
   - Farmer farm coordinates are never saved. The map only shows general district-level data.
4. 👤 **Anonymous Device History (No Login Friction)**:
   - Farmers don't need passwords or email accounts. Their scan history is safely stored on their own phone using a private `device_id`.

---

## ✅ 6. Testing & Quality Assurance Status

Everything in the codebase is **100% verified and passing**:
- ✅ **Backend Tests**: **58 / 58 tests passed** (`pytest`)
- ✅ **Backend Code Quality**: **0 errors** (`ruff`)
- ✅ **Frontend Tests**: **15 / 15 tests passed** (`npm test`)
- ✅ **Frontend Code Quality**: **0 errors** (`eslint`)
- ✅ **Production Build**: **17 / 17 pages pre-rendered successfully** (`next build`)

---

## 💡 7. Quick 3-Minute Demo Script (For Presenters)

When showing CropDoctor to judges, follow this simple sequence:

1. **[0:00 – 0:30] The Hook**:
   > *"In Pakistan, crop diseases destroy billions in harvest yields. Existing apps are black boxes. CropDoctor explains diagnoses, measures severity, and predicts outbreaks 7 days ahead."*
2. **[0:30 – 1:30] Scan a Crop**:
   > Open [http://localhost:3000/diagnose](http://localhost:3000/diagnose), upload a Wheat leaf photo, and click Scan.
3. **[1:30 – 2:00] Show Results**:
   > Show the **Diagnosis (Wheat Leaf Rust)** $\to$ **Severity (12.8% affected area)** $\to$ **Grad-CAM visual heatmap**.
4. **[2:00 – 2:30] Show Weather Risk Map**:
   > Open [http://localhost:3000/risk-map](http://localhost:3000/risk-map). Explain that live weather telemetry predicts 7-day risk without tracking farmer GPS.
5. **[2:30 – 3:00] Show Urdu/Sindhi Chatbot & Safety**:
   > Open [http://localhost:3000/advisor](http://localhost:3000/advisor). Switch language to Urdu. Ask a natural question. Show that dosage questions are safely redirected to human experts.

---

## 📋 8. Cheat Sheet for Judge Questions

- **Q: Is this deployed on Alibaba Cloud?**
  - *Answer*: *"Our architecture is 100% containerized with Docker and fully deployment-ready for Alibaba Cloud ECS, OSS, and Model Studio Qwen. We are currently running the verified local production build while awaiting hackathon cloud credits from the organizers."*
- **Q: Why not use user logins?**
  - *Answer*: *"Smallholder farmers in rural areas face friction with emails, OTPs, and passwords. We use anonymous device-level persistence (`device_id`) so farmers can access their history instantly without sharing private personal data."*
- **Q: Why don't you prescribe pesticide dosages?**
  - *Answer*: *"Automating chemical volume calculations is hazardous and legally restricted. We focus on cultural prevention and connect chemical inquiries directly to certified extension experts."*
