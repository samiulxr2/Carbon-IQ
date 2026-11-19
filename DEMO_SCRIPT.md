# CarbonIQ-MRV: 3-Minute Live Hackathon Demo Script

> **Target Pitch Duration**: 3 Minutes (180 Seconds)  
> **Presenter**: ClimateSphere AI / CarbonIQ Challenge Presenter  
> **Audience**: Hackathon Judges, Climate Economists & Technical Evaluators  
> **Live App URL**: [http://localhost:3000](http://localhost:3000)

---

## ⏱️ Demo Timeline Overview

```
[0:00 - 0:35] Part 1: Problem & The Command Center (Continuous MRV Pipeline)
[0:35 - 1:15] Part 2: 3D Digital Twin & Sensor Tamper Simulation
[1:15 - 1:45] Part 3: The Fraud Gatekeeper & SHA-256 Ledger Proof
[1:45 - 2:20] Part 4: Scientific Copilot with Live MCP Tool Traces & Citations
[2:20 - 2:45] Part 5: Corporate Net-Zero Pathway Simulator
[2:45 - 3:00] Part 6: National Article 6 Registry Export & Wrap-up
```

---

## 🎬 Step-by-Step Walkthrough

### Part 1: Problem & The Command Center (0:00 – 0:35)
* **Goal**: Establish the core pain point (slow, expensive manual carbon audits) and introduce CarbonIQ-MRV's automated continuous pipeline.
* **Action**:
  1. Open [http://localhost:3000](http://localhost:3000) in your browser. The app opens to the **Command Center** tab.
  2. Point your cursor to the **5-Step Continuous MRV Pipeline Stepper**:
     - *IoT & Satellite Ingestion* $\to$ *Edge & Stream Processing* $\to$ *AI Calibration & Anomaly Guard* $\to$ *SHA-256 Ledger* $\to$ *Article 6 Credit & Net-Zero*.
  3. Notice the live green pulse wave moving across the pipeline every 5 seconds (driven by `/telemetry/live`).
  4. Point to the **Animated KPI Counters**:
     - *Verified Carbon Stock*: ~3,250+ tCO2e
     - *Article 6 ITMO Valuation*: ~$95,570+ USD
     - *Monitored Geo-Nodes*: 6 Active Stations
     - *System Trust Score*: ~97.8% System Health
  5. Scroll down to the **Registered Monitoring Geo-Nodes Table** showing live readings from the Sundarbans Mangrove, Cox's Bazar, Rajshahi, Sylhet, and the Dhaka Industrial Bio-Reactor Chamber.
* **Speaking Line**:
  > *"Traditional carbon credit verification takes 6 to 12 months, costs tens of thousands of dollars in manual soil sampling, and is plagued by greenwashing scandals. CarbonIQ-MRV transforms cheap field IoT probes and satellite vegetation proxies into real-time, tamper-proof carbon accounting."*

---

### Part 2: 3D Digital Twin & Sensor Tamper Simulation (0:35 – 1:15)
* **Goal**: Prove real-time hardware interaction and trigger AI fraud detection.
* **Action**:
  1. Click the **"3D Digital Twin"** tab in the top navigation bar.
  2. Observe the interactive Three.js 3D scene:
     - Toggle between **Field Twin** (mangrove root architecture, multi-layered soil cross-section, transparent tidal water, pulsing beacon) and **Bio-Reactor Twin** (glass tank, animated green algae bubbles, actinic LED array, and cooling chiller).
  3. Drag the hardware sliders (*LED Intensity*, *Chiller Temperature*, *Pump Speed*) and observe the live simulated telemetry adapt in real time.
  4. Click the prominent red button: **"Simulate Hardware Tampering"**.
  5. Watch what happens:
     - The 3D beacon immediately shifts from emerald green to a **flashing alert red**.
     - An alert banner fires: **`CRITICAL ALERT: Sensor Spoofing / Tampering Injected`**.
     - The trust score drops precipitously from **98% down to ~21%**.
     - The status badge changes to **`MINTING BLOCKED`**.
* **Speaking Line**:
  > *"Here in our 3D Digital Twin, we monitor our coastal field probes and closed-loop photobioreactors in real time. But what happens if an unscrupulous operator heats a sensor or spoofs biomass readings to falsely inflate credits? I click 'Simulate Hardware Tampering'—our multivariate Isolation Forest instantly detects physical incoherence, drops the Trust Score to 21%, turns the node beacon red, and automatically halts credit minting."*

---

### Part 3: Fraud Gatekeeper & SHA-256 Ledger Proof (1:15 – 1:45)
* **Goal**: Show that fraudulent data was locked out of the ledger and prove mathematical chain integrity.
* **Action**:
  1. Click the **"SHA-256 Ledger"** tab in the top navigation bar.
  2. Direct the judges' attention to the table of verified blocks:
     - Each block lists the *Block Index*, *Timestamp*, *Verified Increment (tCO2e)*, *Market Value*, and the *Previous Hash* and *Current Hash* in `JetBrains Mono`.
     - Point out that the tampered readings were **never admitted** to the ledger because the Trust Score fell below the 95% threshold.
  3. Click the **"Verify Chain"** button at the top right of the table.
  4. The modal/badge updates with a verified green checkmark:
     - **Status**: `VERIFIED`
     - **Chain Valid**: `True`
     - **Integrity Score**: `100.0%`
     - **Compliance**: `Article 6.2 ITMO Cryptographic Ledger Compliant`
* **Speaking Line**:
  > *"Every verified credit is cryptographically bound into an immutable SHA-256 hash chain. If a node's trust score drops below 95%, the gatekeeper rejects the block. Clicking 'Verify Chain' verifies the parent-child cryptographic hash pointers across the entire database in milliseconds, proving zero tampering."*

---

### Part 4: Scientific Copilot & Official MCP Server (1:45 – 2:20)
* **Goal**: Demonstrate AI reasoning grounded in scientific guidelines with real tool traces and citations.
* **Action**:
  1. Click the **"Scientific Copilot"** tab in the top navigation bar.
  2. Click the first quick-prompt chip:  
     👉 **"Explain the soil carbon calibration formula for Sundarbans (NODE-BD-01) and cite IPCC guidelines."**
  3. Point to the **Live Tool Execution Traces** appearing in the middle of the screen:
     - `get_live_sensor_telemetry` (~6ms)
     - `run_carbon_stock_inference` (~11ms)
     - `query_ipcc_guidelines` (~3ms)
  4. Click the **"Inspect Tool I/O"** dropdown on any trace card to show the judges the raw JSON arguments and responses conforming to the official Model Context Protocol (MCP) schema.
  5. Read the synthesized response streaming in real time, noting the exact citations:
     - *Citation: IPCC 2013 Wetlands Supplement (Blue Carbon Accounting)*
     - *Citation: Paris Agreement Article 6.2 ITMO Mechanisms*
* **Speaking Line**:
  > *"Under the hood, we run an official Model Context Protocol (MCP) server. Notice how the copilot does not hallucinate answers: it dispatches structured tool calls to fetch live IoT telemetry, executes our trained XGBoost model for carbon inference, queries our offline IPCC TF-IDF index, and streams transparent tool traces with scientific citations."*

---

### Part 5: Corporate Net-Zero Pathway Simulator (2:15 – 2:35)
* **Goal**: Show corporate enterprise value: how companies use CarbonIQ-MRV to plan and finance their path to net zero.
* **Action**:
  1. Click the **"Net-Zero Simulator"** tab in the top navigation bar.
  2. Drag the **Monthly Baseline Emissions** slider to `1,200 tCO2e/month`.
  3. Drag the **Target Commitment Year** slider to `2030`.
  4. Adjust the **Blue-Carbon Allocation Ratio** to `65% Mangrove / 35% Bio-Reactor`.
  5. Highlight the calculated results:
     - **Microalgae Photobioreactors Needed**: e.g., ~110 units
     - **Mangrove Wetland Hectares**: e.g., ~340 hectares
     - **CapEx Investment**: ~$2.8M USD
     - **Payback Horizon**: ~4.5 Years
  6. Point to the **Emission Trajectory Graph** showing the SBTi 1.5°C direct abatement trajectory curve vs. residual blue-carbon offset credits.
* **Speaking Line**:
  > *"For corporate sustainability officers, our Net-Zero Simulator translates high-level targets into concrete capital expenditures. Sliding emissions to 1,200 tons/month with a 2030 target shows exactly how many photobioreactors and mangrove hectares are required, CapEx costs, payback horizon, and SBTi-aligned direct reduction milestones."*

---

### Part 5b: Bangla Farmer Portal & Direct Climate Payouts (2:35 – 2:50)
* **Goal**: Show climate justice and direct community benefit for rural coastal stewards.
* **Action**:
  1. Click the **"কৃষক পোর্টাল (Farmer)"** tab in the top navigation bar.
  2. Notice the native Noto Sans Bengali typography and toggle between `[ 🇧🇩 বাংলা ]` and `[ 🇬🇧 English ]`.
  3. Point to the transparent earnings breakdown for lead mangrove steward Md. Rafiqul Islam (Satkhira):
     - **Verified Credits**: 46.2 tCO2e
     - **Earnings**: ৳১,৫৮,৬৯৭ BDT ($1,316.99 USD at 1 USD = 120.50 BDT demo rate)
     - **Community Steward Share**: 85% directly to bKash wallet (`01712-849201`).
  4. Highlight the **Live Soil & Water Advisories** generated dynamically from IoT moisture and salinity sensors.
  5. Click **"Play Voice Call"** on the simulated Voice IVR card to show judges the animated audio wave visualizer and synchronized spoken advisory.
* **Speaking Line**:
  > *"Crucially, CarbonIQ-MRV delivers climate justice. In our Bangla Farmer Portal, coastal stewards like Rafiqul in the Sundarbans see their verified carbon credits directly converted into Bangladeshi Taka at 120.50 BDT per dollar, with 85% paid directly to their bKash mobile wallets, alongside live SMS and spoken IVR soil and salinity advisories."*

---

### Part 6: National Registry Export & Wrap-up (2:50 – 3:00)
* **Goal**: Close the presentation by demonstrating interoperability with national carbon registries and ESG audit standards.
* **Action**:
  1. Click back to the **"SHA-256 Ledger"** tab.
  2. Click **"Export National Article 6 Registry JSON"**:
     - The browser downloads `carboniq_article6_registry_export.json`.
     - Highlight that this file contains the cryptographic root, DNA authority metadata (Ministry of Environment, Forest and Climate Change, Bangladesh), and authenticated credit ledger.
  3. Click **"Generate ESG Audit Report"** to reveal the printable executive compliance modal.
  4. End on a confident, visionary takeaway.
* **Speaking Line**:
  > *"Finally, with a single click, project developers can export an authenticated Article 6 Registry dossier for national DNA submission or generate a complete ESG compliance audit. CarbonIQ-MRV delivers real-time, scientifically grounded, fraud-proof digital MRV from the soil to the national registry. Thank you."*

---

## 💡 Troubleshooting & Presenter Tips

| Scenario | Solution |
|---|---|
| **Node was left in tampered state** | In the 3D Digital Twin tab, click **"Recalibrate & Restore"** to reset the Isolation Forest baseline. |
| **Backend or frontend stops responding** | Double-click `start.bat` to re-initialize both servers cleanly. |
| **Screen resolution is small / projector display** | The interface is fully responsive; zoom browser out to 90% (`Ctrl + -`) for optimal wide presentation layout. |
