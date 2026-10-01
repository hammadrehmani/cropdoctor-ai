
# AgriGuard AI — Hackathon Final Demo Script (3–5 Minutes)

## Presentation Objective
Demonstrate AgriGuard AI as an explainable, severity-aware, and geospatial disease intelligence platform designed specifically for smallholder farmers and agricultural extension officers across Pakistan.

---

## Demo Timing & Narrative Flow

### [0:00 – 0:30] Introduction & Value Proposition
* **Presenter Dialogue**:
  > *"Assalam-o-Alaikum and welcome. In Pakistan, crop diseases such as wheat rust, cotton leaf curl, and rice blast cause billions in annual yield losses. Most existing mobile tools merely offer black-box image classification without context or explanation.  
  > **AgriGuard AI is different**: It does not only identify crop disease; it explains the visual decision using Grad-CAM, calculates leaf lesion severity using OpenCV, forecasts 7-day district outbreak risks via XGBoost micro-climate modeling, and connects farmers to grounded multilingual AI and certified human experts."*
* **Visual**: Show Home landing page with the three capability cards, supported crops list (Cotton, Wheat, Rice, Sugarcane), and zero-location tracking privacy reassurance badge.

---

### [0:30 – 1:20] Scanning & Automated Vision Diagnosis
* **Presenter Dialogue**:
  > *"Let's take a real farmer journey. A farmer in Faisalabad observes yellowing spots on wheat leaves. They open the scanner on their mobile browser, choose their language (English, Urdu, or Sindhi), select Wheat, and take a photo."*
* **Actions**:
  1. Click **Scan Crop**.
  2. Select **Wheat** and District **Faisalabad**.
  3. Upload/capture sample leaf image (`demo_wheat_rust.jpg`).
  4. Click **Scan a Crop** and observe transparent loading stages (*"Analyzing leaf symptoms..."*, *"Estimating affected area percentage..."*, *"Preparing Grad-CAM explanation..."*).

---

### [1:20 – 1:50] Ordered Diagnosis, Severity & Explainability
* **Presenter Dialogue**:
  > *"Within seconds, AgriGuard delivers an ordered decision-support card:  
  > 1. **Diagnosis**: Wheat Leaf Rust detected with high confidence (95.6%) alongside top-3 probability distributions.  
  > 2. **Severity Measurement**: Automated OpenCV segmentation estimates 12.8% affected leaf surface area, categorized as Low Severity.  
  > 3. **Explainability via Grad-CAM**: We do not ask the farmer to blindly trust the AI. A visual attention heatmap highlights the exact rust pustule clusters that drove the neural network's classification."*
* **Visual**: Scroll through Diagnosis card, animated severity tier progress bar, and the side-by-side original leaf vs Grad-CAM heatmap overlay.

---

### [1:50 – 2:30] District Outbreak Risk & 7-Day Forecasting
* **Presenter Dialogue**:
  > *"Disease does not happen in a vacuum. AgriGuard connects the scan to local environmental telemetry. In Faisalabad, our XGBoost risk engine analyzes live temperature, relative humidity, and wind speed from Open-Meteo to calculate a 7-day epidemiological risk index."*
* **Actions**:
  1. Show district outbreak context card on results page.
  2. Navigate to **Risk Map**.
  3. Filter by crop and risk levels (Low, Medium, High, Critical).
  4. Highlight **Geo-Privacy**: Remind judges that all points represent public district centroid coordinates—never raw farmer GPS coordinates.

---

### [2:30 – 3:10] Grounded Multilingual AI Advisor
* **Presenter Dialogue**:
  > *"Next, the farmer asks what cultural practices they should adopt. They click 'Ask AI Advisor', which carries over the diagnosis context into a grounded RAG conversation in Urdu or Sindhi."*
* **Actions**:
  1. Switch language to Urdu (اردو) or Sindhi (سنڌي).
  2. Ask: *"گندم کے زنگ (Rust) سے بچاؤ کے قدرتی طریقے کیا ہیں؟"* (What are natural prevention methods for wheat rust?)
  3. Review grounded answer citing institutional sources (e.g. FAO & Punjab Directorate of Agricultural Information).

---

### [3:10 – 3:40] Safety Guardrails & Human-in-the-Loop Fallback
* **Presenter Dialogue**:
  > *"What if the farmer asks for a chemical pesticide dosage? Or what if a scan produces low confidence?  
  > AgriGuard enforces strict agronomic safety: our RAG system explicitly refuses to synthesize unregulated chemical dosages, and low-confidence scans (<60%) automatically trigger an Expert Consultation gate with direct WhatsApp extension escalation."*
* **Actions**:
  1. Demonstrate refusal on dosage query (*"What exact pesticide ml per acre should I spray?"*).
  2. Navigate to **Expert Consultation** (`/expert`) showing extension hotline and WhatsApp routing.

---

### [3:40 – 4:20] Anonymous Device-Isolated Dashboard
* **Presenter Dialogue**:
  > *"Smallholder farmers should not be forced to remember passwords or register accounts. AgriGuard uses an anonymous device-level persistence model. Scans are securely isolated to the farmer's browser via device_id without leaking data to other users."*
* **Actions**:
  1. Navigate to **Dashboard** (`/dashboard`).
  2. Review historical scan list, KPIs, and weather risk forecast.

---

### [4:20 – 5:00] Conclusion & Technical Architecture
* **Presenter Dialogue**:
  > *"To summarize: AgriGuard AI is not just another image classifier. It is a complete, explainable crop intelligence platform bridging computer vision, OpenCV severity heuristics, XGBoost epidemiological forecasting, multilingual RAG, and human-in-the-loop safety.  
  > The system is fully production-ready locally and containerized for seamless deployment to Alibaba Cloud ECS and OSS once access is active. Thank you."*
