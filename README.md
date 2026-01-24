# Pathly 🧭

**Context-aware navigation for safer, smarter journeys**

## Quick Start

```bash
npm install
echo "VITE_GOOGLE_MAPS_API_KEY=your_key_here" > .env.local
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## 🌞 Day Mode — Smart Place Discovery

### How Locations Are Found
1. **Google Places API** searches nearby venues (1500m radius)
2. **Time-based suggestions** recommend place types:
   - Morning → cafe, breakfast
   - Lunch → restaurant
   - Evening → restaurant, gym
   - Night → bar

### How Ranking Works
Each place gets a score (0-100) based on:

| Factor | Weight | Logic |
|--------|--------|-------|
| Proximity | 40% | Closer = higher score |
| Rating | 30% | Google stars normalized |
| Crowd Level | 20% | Quieter = higher (based on preference) |
| Open Now | 10% | Open = bonus |

**Click any place** → Walking route appears on map

---

## 🌙 Night Mode — Confidence Routing

### How to Use
1. Toggle to **Night** mode (top-left)
2. Enter destination in the search bar
3. Choose from 3 route options:
   - 🛡️ **Safest** — Prioritizes busy, well-lit streets
   - ⚖️ **Balanced** — Mix of safety and speed
   - ⚡ **Fastest** — Shortest path

### Street Activity Overlay
- 🔴 **Red lines** = Busy streets (more foot traffic)
- 🔵 **Blue lines** = Quieter streets

Data sourced from OpenStreetMap in real-time.

---

## Tech Stack

React • Vite • TailwindCSS • Google Maps/Places/Directions APIs • OpenStreetMap

---

Built with ❤️ for safer urban navigation
