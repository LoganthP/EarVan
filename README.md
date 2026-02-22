# 🎧 Earvan – Intelligent Hearing Assistance Platform

<div align="center">
  <img src="https://img.shields.io/badge/Framework-React%2019-blue?style=for-the-badge&logo=react" />
  <img src="https://img.shields.io/badge/Build-Vite-646CFF?style=for-the-badge&logo=vite" />
  <img src="https://img.shields.io/badge/Audio-Web%20Audio%20API-FB1?style=for-the-badge" />
  <img src="https://img.shields.io/badge/CSS-Tailwind%20v4-38B2AC?style=for-the-badge&logo=tailwind-css" />
</div>

<p align="center">
  <b>Earvan is a cutting-edge web application designed to enhance auditory clarity in real-time.</b><br/>
  <i>Leveraging the power of the Web Audio API and professional DSP, Earvan provides a personalized hearing experience directly in your browser.</i>
</p>

---

## 📚 Table of Contents
- [Overview](#-overview)
- [Key Features](#-key-features)
- [Technology Stack](#-technology-stack)
- [Audio Engineering](#-audio-engineering)
- [Architecture](#-architecture)
- [Installation & Setup](#-installation--setup)
- [Usage Guide](#-usage-guide)

---

## 🔊 Overview
Earvan bridges the gap between traditional hearing aids and software-based enhancement. By utilizing advanced signal processing filters, it targets speech frequencies while suppressing environmental noise, all with near-zero latency.

Whether you're in a crowded cafe or a quiet library, Earvan adapts to your surroundings and your unique hearing profile.

---

## ✨ Key Features

### 🎧 Live Hearing Assist
- **Low-Latency DSP:** Custom-built audio pipeline using Biquad filters and dynamic compressors.
- **Environment Modes:** 
  - **Quiet:** Gentle enhancement for focused listening.
  - **Conversation:** Boosts mid-high frequencies (1kHz–4kHz) to improve speech intelligibility.
  - **Noisy:** Aggressive low-pass/high-pass filtering to reject traffic and wind noise.

### 🎚️ Personalized Profile Tuning
- **Real-Time EQ Swapping:** Adjust your hearing profile while listening to live audio.
- **Custom Presets:** Includes **Speech Focus**, **Mild Loss**, and **Balanced** presets.
- **Save & Sync:** Your personalized EQ profile persists across sessions.

### 📊 Real-Time Visualization
- **60FPS Waveform:** High-performance canvas-based visualizer showing the processed audio signal.
- **DPR Aware:** Crisp visuals on all display types (Retina/High-Hz).

### 🌗 Premium UI/UX
- **Tailwind v4 & Dark Mode:** A modern, glassmorphic interface that respects system preferences and offers a manual toggle.
- **Responsive Design:** Optimized for mobile and desktop usage.

---

## 🛠️ Technology Stack
- **Frontend:** [React 19](https://react.dev/)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **Audio Engine:** [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Validation:** Type-safe development with [TypeScript](https://www.typescriptlang.org/)

---

## 🧬 Audio Engineering
Earvan's audio engine is built on a non-destructive DSP chain:

1. **Input:** Low-latency microphone stream capture.
2. **High-Pass Filter:** Rejects low-frequency rumble and DC offset.
3. **EQ Filter Bank:** 5-band peaking filters (500Hz, 1kHz, 2kHz, 4kHz, 8kHz) mapped to your hearing profile.
4. **Dynamics Compressor:** Increases loudness while preventing clipping and protecting your hearing.
5. **Analyser:** Captures frequency data for real-time visualization.
6. **Output:** Crystal-clear balanced audio.

---

## 📁 Architecture
```text
EarVan/
├─ components/       # Reusable UI (Visualizer, ThemeToggle, etc.)
├─ contexts/         # Global state (Theme, Auth)
├─ pages/            # View-level components (Dashboard, ProfileSetup)
├─ services/         
│  ├─ audioEngine.ts  # Core Web Audio logic & DSP
│  └─ authService.ts  # Session management
├─ types.ts          # Project-wide interfaces
└─ index.css         # Tailwind v4 globals & custom themes
```

---

## 🚀 Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/LoganthP/EarVan.git
   cd EarVan
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

---

## 📖 Usage Guide
1. **Login/Signup:** Use the mock auth service to create a session.
2. **Start Assist:** On the Dashboard, click the large POWER button to enable listening.
3. **Select Mode:** Choose between Quiet, Conversation, or Noisy based on your environment.
4. **Tune EQ:** Click "Adjust EQ" to personalize your profile. You can hear the changes happening in real-time as you slide each frequency band.
5. **Save:** Your profile is automatically applied whenever you start the Hearing Assist.

---
<div align="center">
  <b>Made with 🎧 for Auditory Excellence</b>
</div>
