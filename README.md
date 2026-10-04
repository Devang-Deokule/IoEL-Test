# Hospital Asset Tracker & Security Monitoring System

A comprehensive React + Vite + Tailwind CSS dashboard combining indoor RFID asset tracking with real-time IoT security, fire detection, seismic/earthquake vibration monitoring, and automated emergency notification channels (Desktop Push & EmailJS).

---

## 🌟 Key Features

### 1. Real-Time IoT Security & Environmental Telemetry
- **Live Firebase RTDB Stream**: Direct real-time WebSocket connection to `https://security-monitoring-syst-dd43a-default-rtdb.firebaseio.com/hospital/room/reading`.
- **🔥 Fire & Flame Hazard Detection**:
  - Hardware Optical Flame Sensor evaluates raw values.
  - Value `0` triggers an active **Fire Hazard Alert**, while `1` indicates **Safe / Normal**.
  - Emergency banner with Web Audio API audible siren.
- **📳 Earthquake & Vibration Sensor**:
  - Real-time seismic accelerometer filtering.
  - Disturbance `>= 0.30` triggers **Earthquake / Seismic Activity Detected**.
  - Disturbance `>= 0.80` triggers **Severe Earthquake / Structural Shock**.
- **💨 Smoke & Air Quality Monitoring**:
  - Continuous particulate density measurement.
  - Density `>= 1050 raw` triggers a **High Smoke / Gas Hazard Alert**.
- **🌡️ Ambient Temperature Tracking**:
  - Live °C and °F temperature readouts with ward comfort targets (`20°C - 26°C`).
  - Thermal spikes `>= 38°C` trigger a **Critical Overheat Warning**.
- **📊 Interactive Telemetry Trend Charts**:
  - Live SVG area and sparkline charts for Smoke, Temperature, Vibration, and Fire events over time.

### 2. Centralized Hospital Alerts System
- **Unified Alerts Registry**:
  - Security telemetry alerts (Fire, Earthquake, Smoke, Thermal) are merged directly into the central alerts engine alongside RFID asset alerts.
  - Visible on the **Alerts Page** (`/alerts`), the **Dashboard Recent Alerts** panel, and the **Topbar Notification Bell** badge.
  - Full lifecycle support: **New** $\rightarrow$ **Acknowledged** $\rightarrow$ **Resolved**.

### 3. Automated Emergency Notification Channels
- **Desktop Browser Push Notifications**:
  - Native OS push alerts appear even when the tab is minimized or in the background.
  - Automatic rate-limiting cooldown (60s) to prevent desktop alert spam.
- **Automated Email Alerts (EmailJS Integration)**:
  - Dispatches incident reports directly to hospital safety officers and fire marshals.
  - Includes real-time sensor metrics (smoke density, temperature, vibration) and timestamps.
  - Audit log stored locally for inspection.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or pnpm

### Installation

```bash
# 1. Install dependencies
npm install

# 2. Start Vite development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

- **Dashboard**: [http://localhost:5173/](http://localhost:5173/)
- **Security Monitoring Console**: [http://localhost:5173/security-monitoring](http://localhost:5173/security-monitoring)
- **Central Alerts**: [http://localhost:5173/alerts](http://localhost:5173/alerts)
- **Settings & Alert Channels**: [http://localhost:5173/settings](http://localhost:5173/settings)

---

## ⚙️ Environment Configuration (`.env`)

Create or update the `.env` file in the project root:

```env
# Mode toggle (Mock mode or FastAPI backend)
VITE_USE_MOCK=true
VITE_API_URL=http://localhost:8000

# -----------------------------------------------------------------------------
# Security Monitoring System - Emergency Alert Channels
# -----------------------------------------------------------------------------
# Default recipient for emergency fire & telemetry alerts
VITE_ALERT_EMAIL_RECIPIENT=deokuledevang2425@ternaengg.ac.in

# EmailJS Service Credentials (https://www.emailjs.com/)
VITE_EMAILJS_SERVICE_ID=service_l5ctonk
VITE_EMAILJS_TEMPLATE_ID=template_5fdb379
VITE_EMAILJS_PUBLIC_KEY=Cd72Nsun_u6VKH3F1

# Optional: Webhook Alert Delivery (Slack, Discord, Zapier, Make, Resend)
VITE_ALERT_WEBHOOK_URL=
```

---

## 📧 EmailJS Template Setup Guide

When configuring your template in the [EmailJS Dashboard](https://dashboard.emailjs.com/admin/templates):

### 1. Template Settings Fields
- **Subject**: `[{{hazard_type}}] Hospital Security Alert - {{room_name}}`
- **To Email**: `{{to_email}}`
- **From Name**: `{{from_name}}`
- **Reply To**: `{{reply_to}}`

### 2. Template Content (HTML / Text)
Copy and paste this template into the EmailJS template editor:

```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #C3D6EC; border-radius: 8px; overflow: hidden;">
  <div style="background-color: #1F5CC4; color: #ffffff; padding: 18px 24px;">
    <h2 style="margin: 0; font-size: 20px;">🚨 Hospital Security & Environmental Alert</h2>
    <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.9;">Automated Telemetry Incident Dispatch</p>
  </div>
  
  <div style="padding: 24px; background-color: #F7FAFE; color: #14233A;">
    <p style="font-size: 15px; margin-top: 0;">
      A critical environmental or security event was detected by the IoT telemetry sensors.
    </p>

    <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px;">
      <tr style="border-bottom: 1px solid #C3D6EC;">
        <td style="padding: 8px 0; font-weight: bold; color: #4B5B71;">Incident Type:</td>
        <td style="padding: 8px 0; font-weight: bold; color: #BB2D28;">{{hazard_type}}</td>
      </tr>
      <tr style="border-bottom: 1px solid #C3D6EC;">
        <td style="padding: 8px 0; font-weight: bold; color: #4B5B71;">Monitored Zone:</td>
        <td style="padding: 8px 0;">{{room_name}}</td>
      </tr>
      <tr style="border-bottom: 1px solid #C3D6EC;">
        <td style="padding: 8px 0; font-weight: bold; color: #4B5B71;">Timestamp:</td>
        <td style="padding: 8px 0;">{{timestamp}}</td>
      </tr>
      <tr style="border-bottom: 1px solid #C3D6EC;">
        <td style="padding: 8px 0; font-weight: bold; color: #4B5B71;">Smoke Density:</td>
        <td style="padding: 8px 0;">{{smoke}} raw</td>
      </tr>
      <tr style="border-bottom: 1px solid #C3D6EC;">
        <td style="padding: 8px 0; font-weight: bold; color: #4B5B71;">Ambient Temperature:</td>
        <td style="padding: 8px 0;">{{temperature}} °C</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; font-weight: bold; color: #4B5B71;">Vibration / Seismic:</td>
        <td style="padding: 8px 0;">{{vibration}} filtered</td>
      </tr>
    </table>

    <div style="background-color: #E6EFFA; border-left: 4px solid #1F5CC4; padding: 12px; margin: 18px 0; font-size: 13px;">
      <strong>Details:</strong><br/>
      {{message}}
    </div>

    <p style="font-size: 13px; color: #516279; margin-bottom: 0;">
      Please dispatch safety personnel to verify the room immediately.
    </p>
  </div>
  
  <div style="background-color: #D9E8F8; padding: 12px 24px; font-size: 11px; color: #516279; text-align: center;">
    Hospital Security & IoT Asset Monitoring System • Automated Dispatch
  </div>
</div>
```

---

## 📁 Project Architecture

```
src/
├── components/
│   ├── AlertItem.jsx                 # Alert list item with acknowledge, resolve, and delete actions
│   ├── alertMeta.js                  # Icon and styling map (Flame, Activity, Wind, Thermometer)
│   ├── NotificationSettingsModal.jsx # Push notifications & EmailJS configuration modal
│   ├── SecurityStatusWidget.jsx      # Live security telemetry preview for Dashboard
│   ├── SensorTelemetryChart.jsx      # Real-time SVG charts for Smoke, Temp, Vibration, Fire
│   └── ...                           # Card, Badge, Table, Modal components
├── context/
│   └── AppContext.jsx                # Global state: merges RFID asset alerts + live RTDB security alerts, alert deletion
├── pages/
│   ├── Alerts.jsx                    # Central alerts console with filtering & "Delete All Acknowledged" bulk action
│   ├── Dashboard.jsx                 # System overview with live security status widget
│   ├── SecurityMonitoring.jsx        # Dedicated IoT security monitoring & telemetry stream
│   ├── Settings.jsx                  # System settings & alert channel preferences
│   └── ...                           # Assets, AssetDetails, TrackingHistory, Checkpoints
└── services/
    ├── api.js                        # Data gateway for assets, history, checkpoints, and alert updates
    ├── notificationService.js        # Web Push Notification API + EmailJS/Webhook dispatch engine
    └── securityMonitoringService.js  # Live Firebase Realtime Database listener & alert extractor
```

---

## 🛠️ Verification & Production Build

```bash
# Validate and build production bundle
npm run build

# Preview production build locally
npm run preview
```
