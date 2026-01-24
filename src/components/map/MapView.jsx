import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Custom numbered marker
function createNumberedIcon(number, status, isHighlighted = false) {
  const colors = {
    not_busy: "#10B981",
    moderate: "#F59E0B",
    busy: "#EF4444"
  };
  const color = colors[status] || colors.moderate;
  const size = isHighlighted ? 36 : 28;
  
  return L.divIcon({
    className: "custom-marker",
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        border: 3px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: ${isHighlighted ? 14 : 12}px;
        color: white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        transition: all 0.2s ease;
      ">
        ${number}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function MapUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, 14, { duration: 0.5 });
    }
  }, [center, map]);
  return null;
}

export default function MapView({ 
  places = [], 
  highlightedId, 
  onMarkerHover,
  isDark = false,
  routes = [],
  userLocation = [40.7128, -74.0060],
  destination = null
}) {
  const tileUrl = isDark
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";

  const routeColors = {
    safest: "#10B981",
    balanced: "#3B82F6",
    fastest: "#F59E0B"
  };

  return (
    <div className="w-full h-full rounded-2xl overflow-hidden shadow-inner">
      <MapContainer
        center={userLocation}
        zoom={14}
        className="w-full h-full"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url={tileUrl}
        />
        
        {/* Place markers for day mode */}
        {places.map((place, index) => (
          <Marker
            key={place.id}
            position={[place.latitude || 40.7128 + (index * 0.005), place.longitude || -74.0060 + (index * 0.005)]}
            icon={createNumberedIcon(index + 1, place.status, highlightedId === place.id)}
            eventHandlers={{
              mouseover: () => onMarkerHover?.(place.id),
              mouseout: () => onMarkerHover?.(null),
            }}
          >
            <Popup>
              <div className="text-sm font-medium">{place.name}</div>
            </Popup>
          </Marker>
        ))}

        {/* Routes for night mode */}
        {routes.map((route) => (
          <Polyline
            key={route.id}
            positions={route.path}
            pathOptions={{
              color: routeColors[route.type] || "#3B82F6",
              weight: route.type === "safest" ? 6 : 4,
              opacity: 0.8,
            }}
          />
        ))}

        {/* User location marker */}
        {isDark && (
          <Marker
            position={userLocation}
            icon={L.divIcon({
              className: "user-marker",
              html: `
                <div style="
                  width: 20px;
                  height: 20px;
                  background: #3B82F6;
                  border: 4px solid white;
                  border-radius: 50%;
                  box-shadow: 0 0 0 8px rgba(59, 130, 246, 0.2);
                  animation: pulse 2s infinite;
                "></div>
              `,
              iconSize: [20, 20],
              iconAnchor: [10, 10],
            })}
          />
        )}

        {/* Destination marker */}
        {destination && (
          <Marker
            position={[destination.latitude, destination.longitude]}
            icon={L.divIcon({
              className: "destination-marker",
              html: `
                <div style="
                  width: 24px;
                  height: 24px;
                  background: white;
                  border: 4px solid #8B5CF6;
                  border-radius: 50%;
                  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                "></div>
              `,
              iconSize: [24, 24],
              iconAnchor: [12, 12],
            })}
          />
        )}
      </MapContainer>
      
      <style>{`
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 8px rgba(59, 130, 246, 0.2); }
          50% { box-shadow: 0 0 0 16px rgba(59, 130, 246, 0.1); }
        }
      `}</style>
    </div>
  );
}