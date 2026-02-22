# 🎧 EarVan – Intelligent Hearing Assistance Platform

<div align="center">
  <img src="https://img.shields.io/badge/Framework-React%2019-blue?style=for-the-badge&logo=react" />
  <img src="https://img.shields.io/badge/Build-Vite-646CFF?style=for-the-badge&logo=vite" />
  <img src="https://img.shields.io/badge/Audio-Web%20Audio%20API-FB1?style=for-the-badge" />
  <img src="https://img.shields.io/badge/CSS-Tailwind%20v4-38B2AC?style=for-the-badge&logo=tailwind-css" />
</div>

<p align="center">
  <b>EarVan is a real-time intelligent hearing assistance web application built to enhance speech clarity and environmental awareness directly in the browser.</b><br/>
  <i>Powered by Web Audio API, DSP filters, and a modern React + Vite architecture for low-latency auditory enhancement.</i>
</p>

---

# 🔊 Overview

EarVan is a browser-based Hearing Assist system designed to improve speech intelligibility, reduce environmental noise, and provide personalized hearing enhancement using real-time audio processing.

Unlike traditional audio amplifiers, EarVan focuses on:

* Speech clarity enhancement (1kHz–4kHz)
* Environmental noise adaptation
* Personalized hearing profiles
* Low-latency real-time DSP
* Accessible UI for hearing assistance

The platform simulates a digital hearing aid experience using advanced Web Audio processing pipelines.

---

# ✨ Core Features

## 🎧 Live Hearing Assist Engine

* Real-time microphone audio capture
* Low-latency Web Audio API pipeline
* Dynamic gain control and compression
* Speech-focused enhancement filters
* Safe audio normalization (anti-clipping)

## 🌍 Intelligent Environment Modes

EarVan dynamically adjusts DSP filters based on listening conditions:

### 🔇 Quiet Mode

* Natural sound amplification
* Minimal filtering
* Balanced EQ for indoor environments

### 💬 Conversation Mode

* Mid-frequency boost (1kHz–4kHz)
* Speech clarity enhancement
* Background noise reduction
* Optimized for human voice intelligibility

### 🚦 Traffic / Noisy Mode

* Strong noise suppression
* High-pass & low-pass filtering
* Environmental noise attenuation
* Voice isolation bias

---

# 🎚️ Personalized Hearing Profile System

## 🧬 Real-Time EQ Tuning

Users can fine-tune their hearing profile while listening live:

* Warmth & Body (500 Hz)
* Speech Core (1000 Hz)
* Clarity (2000 Hz)
* Presence (4000 Hz)
* Detail & Air (8000 Hz)

## 🎛 Quick Presets

* Balanced
* Speech Focus
* Custom Profile (User Tuned)

All EQ changes are applied instantly without restarting the audio engine.

---

# 🎤 Microphone & Audio Setup Flow

EarVan includes a guided onboarding system:

1. Microphone permission request
2. Earphone/headphone verification (to prevent feedback)
3. Real-time audio activation
4. Continuous listening with live processing

Features:

* Echo cancellation enabled
* Noise suppression enabled
* Stable audio stream lifecycle
* Safe start/stop listening controls

---

# 📊 Real-Time Audio Visualization

* 60 FPS frequency visualizer
* AnalyserNode-based rendering (no fake animations)
* Reflects actual processed audio data
* Smooth and performance-optimized canvas rendering

---

# 🌗 Theme System (Dark / Light Mode)

* Global theme context implementation
* Instant toggle without reload
* Persistent theme using localStorage
* Tailwind CSS theme variables
* Fully responsive UI across themes

---

# 🔐 Authentication System (Mock Auth Ready)

* Login & Signup flow
* Form validation (email & password)
* Session persistence (local storage based)
* Error handling & loading states
* Easily replaceable with real backend later

---

# 🧠 Audio Engineering (DSP Architecture)

EarVan uses a professional non-destructive DSP chain:

Microphone Input → GainNode → Filter Bank (EQ) → Compressor → Analyser → Output

### DSP Components

* High-pass filter (noise rumble removal)
* 5-band parametric EQ
* Speech frequency enhancement
* Dynamics compression for loudness control
* Real-time analyser for visualization

This ensures:

* Clear speech amplification
* Reduced background noise
* Low latency processing
* Stable listening experience

---

# 🏗️ Project Architecture

```text
EarVan/
├── components/        # UI Components (Visualizer, Controls, Toggle, etc.)
├── contexts/          # Global State (Theme, Auth, Audio)
├── pages/             # Main Views (Setup, Dashboard, Profile)
├── services/
│   ├── audioEngine.ts # Core DSP & Web Audio pipeline
│   └── authService.ts # Mock authentication & session logic
├── hooks/             # Custom React hooks
├── types.ts           # Global TypeScript interfaces
└── index.css          # Tailwind v4 + Theme styles
```

---

# ⚙️ Technology Stack

* Frontend: React 19 + TypeScript
* Build Tool: Vite
* Audio Engine: Web Audio API (Low Latency)
* Styling: Tailwind CSS v4
* State Management: React Context + Hooks
* Visualization: AnalyserNode + requestAnimationFrame

---

# 🚀 Installation & Setup

## 1️⃣ Clone Repository

```bash
git clone https://github.com/LoganthP/EarVan.git
cd EarVan
```

## 2️⃣ Install Dependencies

```bash
npm install
```

## 3️⃣ Run Development Server

```bash
npm run dev
```

Application will run on:

```
http://localhost:5173
```

---

# 🎮 Usage Guide

## Step 1: Setup Experience

* Allow microphone access
* Connect earphones/headphones

## Step 2: Start Hearing Assist

* Press the main POWER button
* Active Listening mode will begin

## Step 3: Select Environment Mode

* Quiet → Indoor listening
* Conversation → Speech clarity
* Traffic/Noisy → Outdoor noise suppression

## Step 4: Tune Hearing Profile

* Adjust EQ sliders in real-time
* Use Quick Presets (Balanced / Speech Focus)
* Save custom profile

## Step 5: Stop Test

* Safely shuts down audio pipeline
* Releases microphone stream

---

# 🛡️ Safety & Accessibility

* Safe gain limits to prevent hearing damage
* Headphone requirement to avoid feedback loops
* Low-latency processing for real-time clarity
* Accessible UI for hearing-impaired users

---

# 🔮 Future Enhancements

* AI-powered noise classification
* Adaptive environment auto-detection
* Cloud profile sync
* Advanced speech isolation (ML-based)
* Mobile PWA support

---

<div align="center">
  <b>🎧 Built for Real-Time Hearing Clarity & Assistive Audio Innovation</b>
</div>
