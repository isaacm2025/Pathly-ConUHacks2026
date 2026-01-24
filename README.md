# Pathly 🧭

**Context-aware navigation for safer, smarter journeys**

Pathly is a hackathon project that reimagines urban navigation with two distinct modes: **Day Mode** for smart place discovery and **Night Mode** for confidence-focused routing.

![Pathly Screenshot](https://via.placeholder.com/800x400?text=Pathly+Screenshot)

## ✨ Features

### 🌞 Day Mode - Smart Discovery
- **Real-time place search** powered by Google Places API
- **Intelligent ranking** based on distance, crowd levels, and user preferences
- **Click-to-navigate** - click any place to see walking directions on the map
- **Filter chips** - filter by walk time, open now, low crowd, or place type
- **Live updates** - places and crowd estimates refresh automatically

### 🌙 Night Mode - Confidence Routing
- **Safety-scored routes** - three route options (Safest, Balanced, Fastest)
- **Street activity overlay** - see which streets are busy (red) vs quiet (blue)
- **Destination search** with Google Autocomplete
- **Safety alerts** - notifications when entering lower-activity areas

### 🎯 Personalization
- **Comfort profiles** - Cautious, Balanced, or Speed-focused
- **Time-aware mode switching** - automatically switches between Day/Night based on sunset
- **Smart suggestions** - recommends place types based on time of day

## 🛠️ Tech Stack

- **Frontend**: React + Vite
- **Styling**: TailwindCSS
- **Animations**: Framer Motion
- **Maps**: Google Maps JavaScript API
- **Places**: Google Places API
- **Directions**: Google Directions API
- **Street Data**: OpenStreetMap Overpass API

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Google Maps API key with Places and Directions APIs enabled

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/pathly.git
cd pathly

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local
```

### Configuration

Add your Google Maps API key to `.env.local`:

```env
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

### Running the App

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## 📁 Project Structure

```
src/
├── api/              # API utilities (Google Places integration)
├── components/
│   ├── day/          # Day mode components (PlaceCard, FilterChips, etc.)
│   ├── night/        # Night mode components (RouteCard, SafetyToggles, etc.)
│   ├── map/          # MapView component with Google Maps
│   ├── shared/       # Shared components (TopBar, StatusPill, etc.)
│   └── ui/           # UI primitives (buttons, cards, etc.)
├── hooks/            # Custom React hooks
│   ├── useLiveLocation.jsx
│   ├── useStreetActivity.jsx
│   └── useUserPreferences.jsx
├── lib/              # Utilities and context
├── pages/            # Page components
│   ├── Home.jsx      # Main app with Day/Night modes
│   └── Landing.jsx   # Landing page
└── utils/            # Helper functions
    ├── ranking.js    # Place & route scoring algorithms
    └── timeAware.js  # Day/night detection utilities
```

## 🎨 Key Features Explained

### Street Activity Visualization
Streets are colored based on estimated foot traffic:
- 🔴 **Red** = Busy streets (high activity)
- 🔵 **Blue** = Quieter streets (low activity)

### Walking Directions
Click any place in the list to:
1. See walking directions drawn on the map
2. View estimated walk time
3. Open in Google Maps for turn-by-turn navigation

### Smart Ranking
Places are ranked based on:
- Distance from your location
- Current crowd levels
- Your comfort profile preferences
- Whether they're currently open

## 🔧 Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_GOOGLE_MAPS_API_KEY` | Google Maps API key (required) |

## 📄 License

MIT License - feel free to use this for your own projects!

## 🙏 Acknowledgments

- Google Maps Platform for mapping APIs
- OpenStreetMap for street data
- Montreal for being a beautiful city to navigate

---

Built with ❤️ for safer urban navigation