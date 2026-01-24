import { useEffect, useMemo } from "react";
import { GoogleMap, Marker, Polyline, useJsApiLoader } from "@react-google-maps/api";

// Custom marker label for Google Maps (numbered)
function createNumberedLabel(number, status, isHighlighted = false) {
  return {
    text: String(number),
    color: "white",
    fontWeight: "700",
    fontSize: isHighlighted ? "16px" : "13px",
  };
}

const containerStyle = {
  width: '100%',
  height: '100%',
};

export default function MapView({
  places = [],
  highlightedId,
  onMarkerHover,
  isDark = false,
  routes = [],
  userLocation = [40.7128, -74.0060],
  destination = null
}) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: apiKey,
  });

  const mapCenter = useMemo(() => ({ lat: userLocation[0], lng: userLocation[1] }), [userLocation]);
  const routeColors = {
    safest: "#10B981",
    balanced: "#3B82F6",
    fastest: "#F59E0B"
  };

  if (!isLoaded) return <div>Loading map…</div>;

  return (
    <div className="w-full h-full rounded-2xl overflow-hidden shadow-inner">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={mapCenter}
        zoom={14}
        options={{
          disableDefaultUI: false,
          styles: isDark ? [
            { elementType: 'geometry', stylers: [{ color: '#1a1a1a' }] },
            { elementType: 'labels.text.fill', stylers: [{ color: '#f5f5f5' }] },
            { elementType: 'labels.text.stroke', stylers: [{ color: '#1a1a1a' }] },
          ] : undefined,
        }}
      >
        {/* Place markers for day mode */}
        {places.map((place, index) => (
          <Marker
            key={place.id}
            position={{
              lat: place.latitude || 40.7128 + (index * 0.005),
              lng: place.longitude || -74.0060 + (index * 0.005)
            }}
            label={createNumberedLabel(index + 1, place.status, highlightedId === place.id)}
            onMouseOver={() => onMarkerHover?.(place.id)}
            onMouseOut={() => onMarkerHover?.(null)}
          />
        ))}

        {/* Routes for night mode */}
        {routes.map((route) => (
          <Polyline
            key={route.id}
            path={route.path.map(([lat, lng]) => ({ lat, lng }))}
            options={{
              strokeColor: routeColors[route.type] || "#3B82F6",
              strokeWeight: route.type === "safest" ? 6 : 4,
              strokeOpacity: 0.8,
            }}
          />
        ))}

        {/* User location marker */}
        <Marker
          position={mapCenter}
          icon={{
            url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
            scaledSize: { width: 40, height: 40 },
          }}
        />

        {/* Destination marker */}
        {destination && (
          <Marker
            position={{ lat: destination.latitude, lng: destination.longitude }}
            icon={{
              url: 'https://maps.google.com/mapfiles/ms/icons/purple-dot.png',
              scaledSize: { width: 44, height: 44 },
            }}
          />
        )}
      </GoogleMap>
    </div>
  );
}