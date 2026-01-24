import { useMemo } from "react";
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

const ACTIVITY_COLOR_STOPS = [
  { stop: 0, color: "#bfe7ff" },
  { stop: 0.45, color: "#ffe08a" },
  { stop: 0.7, color: "#f4a261" },
  { stop: 1, color: "#b00020" },
];

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const hexToRgb = (hex) => {
  const normalized = hex.replace("#", "");
  const value = parseInt(normalized, 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
};

const rgbToHex = ({ r, g, b }) => {
  const toHex = (channel) => channel.toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

const mixColors = (fromHex, toHex, t) => {
  const from = hexToRgb(fromHex);
  const to = hexToRgb(toHex);
  const mix = (start, end) => Math.round(start + (end - start) * t);
  return rgbToHex({
    r: mix(from.r, to.r),
    g: mix(from.g, to.g),
    b: mix(from.b, to.b),
  });
};

// Map people counts to a light-blue -> yellow -> orange -> red ramp.
const getActivityColor = (t) => {
  const clamped = clamp(t, 0, 1);
  const upperIndex = ACTIVITY_COLOR_STOPS.findIndex((stop) => stop.stop >= clamped);
  if (upperIndex === -1) return ACTIVITY_COLOR_STOPS[ACTIVITY_COLOR_STOPS.length - 1].color;
  if (upperIndex === 0) return ACTIVITY_COLOR_STOPS[0].color;
  const lower = ACTIVITY_COLOR_STOPS[upperIndex - 1];
  const upper = ACTIVITY_COLOR_STOPS[upperIndex];
  const localT = (clamped - lower.stop) / (upper.stop - lower.stop);
  return mixColors(lower.color, upper.color, localT);
};

export default function MapView({
  places = [],
  highlightedId,
  onMarkerHover,
  isDark = false,
  routes = [],
  userLocation = [45.5019, -73.5674],
  destination = null,
  streetActivity = [],
  mapCenter = null,
  zoom = 14,
}) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: apiKey,
  });

  const center = useMemo(() => {
    const [lat, lng] = mapCenter ?? userLocation;
    return { lat, lng };
  }, [mapCenter, userLocation]);
  const userPosition = useMemo(() => ({ lat: userLocation[0], lng: userLocation[1] }), [userLocation]);
  const routeColors = {
    safest: "#10B981",
    balanced: "#3B82F6",
    fastest: "#F59E0B"
  };
  const activityRange = useMemo(() => {
    if (streetActivity.length === 0) return { min: 0, max: 1 };
    let min = Infinity;
    let max = -Infinity;
    streetActivity.forEach((street) => {
      min = Math.min(min, street.people);
      max = Math.max(max, street.people);
    });
    if (min === max) return { min, max: min + 1 };
    return { min, max };
  }, [streetActivity]);

  const getActivityStyle = (people) => {
    const range = activityRange.max - activityRange.min;
    const normalized = range === 0 ? 0 : (people - activityRange.min) / range;
    const clamped = clamp(normalized, 0, 1);
    return {
      color: getActivityColor(clamped),
      weight: 2 + clamped * 4,
    };
  };

  if (!isLoaded) return <div>Loading map…</div>;

  return (
    <div className="w-full h-full rounded-2xl overflow-hidden shadow-inner">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={zoom}
        options={{
          disableDefaultUI: false,
          styles: isDark ? [
            { elementType: 'geometry', stylers: [{ color: '#1a1a1a' }] },
            { elementType: 'labels.text.fill', stylers: [{ color: '#f5f5f5' }] },
            { elementType: 'labels.text.stroke', stylers: [{ color: '#1a1a1a' }] },
          ] : undefined,
        }}
      >
        {/* Street activity overlay */}
        {streetActivity.map((street) => {
          const style = getActivityStyle(street.people);
          return (
            <Polyline
              key={street.id || street.name}
              path={street.path.map(([lat, lng]) => ({ lat, lng }))}
              options={{
                strokeColor: style.color,
                strokeWeight: style.weight,
                strokeOpacity: isDark ? 0.9 : 0.75,
                zIndex: 1,
                clickable: false,
              }}
            />
          );
        })}

        {/* Place markers for day mode */}
        {places.map((place, index) => (
          <Marker
            key={place.id}
            position={{
              lat: place.latitude || 45.5019 + (index * 0.005),
              lng: place.longitude || -73.5674 + (index * 0.005)
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
              zIndex: 2,
            }}
          />
        ))}

        {/* User location marker */}
        <Marker
          position={userPosition}
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
