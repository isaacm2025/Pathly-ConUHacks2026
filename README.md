# 🧭 Pathly  
### Navigate safely. Explore confidently.

Pathly is a **context-aware navigation companion** designed to help people—especially university students—make **safer, more confident decisions** about where to go and how to get there, particularly at night.

Unlike traditional map applications that optimize only for speed, Pathly optimizes for **comfort, safety, and confidence**, combining real-time signals, AI insights, and natural voice guidance.

### Devpost: 
https://devpost.com/software/pathly-254xnw

## 🌟 Why Pathly?

Finding the fastest route isn’t always the best choice—especially at night.

- Users don’t want to stare at maps while walking
- Quiet or poorly lit streets can feel unsafe
- Information overload increases anxiety
- Accessibility is often overlooked

**Pathly shifts navigation from “fastest” to “best for you, right now.”**

---

## 🚦 Core Features

### 🌤️ Day Mode — Smart Discovery
Designed for exploration and productivity.

- Ranked nearby places (cafés, libraries, gyms, coworking spaces)
- Clear status indicators (not busy / moderate / busy)
- Smooth map + list synchronization
- Live updates and dynamic re-ranking

**Goal:** Help users quickly decide *where to go*.

---

### 🌙 Night Mode — Confidence-Focused Navigation
Designed for safety and reassurance.

- Multiple route options:
  - 🛡️ Safest
  - ⚖️ Balanced
  - ⚡ Fastest
- Visual street-level activity indicators
- Clear explanations for route recommendations
- Reduced visual clutter and calmer UI

**Goal:** Help users feel confident *while getting there*.

---

## 🎙️ Voice Guidance (ElevenLabs)

Pathly integrates **ElevenLabs** to provide **natural, human-like voice guidance**, especially in Night Mode.

### Why voice?
- Reduces screen dependency while walking
- Lowers cognitive load
- Improves accessibility (visually impaired users)
- Builds reassurance through tone, not just data

**Example voice message:**
> “This route is slightly longer, but it has better lighting and more nearby activity.”

Voice transforms Pathly from a map into a **companion**.

---

## 🧠 AI-Assisted Insights

Pathly uses AI to:
- Explain *why* a place or route is recommended
- Adapt suggestions based on time of day
- Support decision-making without overwhelming users

All AI outputs are **explainable, contextual, and user-centric**.

---

## 🗺️ Visual Street Activity

Instead of crime data or assumptions, Pathly uses **street-level activity proxies**:
- Nearby points of interest
- Road type and connectivity
- Human presence indicators

Street segments are visualized using intuitive color gradients—especially useful in Night Mode.

---

## 🧑‍🤝‍🧑 Community & Rewards (Optional)

Pathly includes optional Web3 features powered by **Solana**:
- Wallet-based tipping for helpful reports
- Rewards for community contributions
- Lightweight, transparent incentive layer

---

## 🧱 Tech Stack

### Frontend
- React + Vite
- @react-google-maps/api
- Tailwind CSS
- Framer Motion

### Backend
- Node.js / Express
- MongoDB Atlas

### APIs & Services
- Google Maps & Places API — maps, routing, POIs
- ElevenLabs API — high-quality text-to-speech
- MongoDB — live data (users, places, routes, signals)
- Solana Web3 — optional rewards & tipping
- OpenStreetMap / Overpass — street network data

---

## 🗄️ Data Architecture

```text
Frontend (React + Maps)
        ↓
Backend API (Node / Express)
        ↓
MongoDB (live app state)
        ↓ (async / analytics)
Snowflake (optional analytics layer)
