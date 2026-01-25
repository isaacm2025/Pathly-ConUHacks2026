import React, { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { GoogleMap, Marker, Polyline, useJsApiLoader, DirectionsRenderer } from "@react-google-maps/api";

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

// Safety color scheme for night mode routes
const SAFETY_COLORS = {
  high: "#10B981",    // Green - well-lit, active
  medium: "#F59E0B",  // Amber - moderate activity
  low: "#EF4444",     // Red - low activity/isolated
};

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
  highlightedId = null,
  onMarkerHover = (id) => {},
  onMapLoad = null,
  isDark = false,
  routes = [],
  selectedRouteId = null,
  userLocation = [45.5019, -73.5674],
  destination = null,
  streetActivity = [],
  mapCenter = null,
  zoom = 14,
}) {
  const mapRef = useRef(null);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    libraries: ["places"],
  });

  // Callback when map loads
  const handleMapLoad = useCallback((map) => {
    mapRef.current = map;
    if (onMapLoad) {
      onMapLoad(map);
    }
  }, [onMapLoad]);

  // State for directions
  const [directions, setDirections] = useState(null);

  // Fetch directions when destination changes
  useEffect(() => {
    if (!isLoaded || !destination || !userLocation) {
      setDirections(null);
      return;
    }

    const directionsService = new window.google.maps.DirectionsService();

    directionsService.route(
      {
        origin: { lat: userLocation[0], lng: userLocation[1] },
        destination: { lat: destination.latitude, lng: destination.longitude },
        travelMode: window.google.maps.TravelMode.WALKING,
      },
      (result, status) => {
        if (status === window.google.maps.DirectionsStatus.OK) {
          setDirections(result);
        } else {
          setDirections(null);
        }
      }
    );
  }, [isLoaded, destination, userLocation]);

  const center = useMemo(() => {
    const [lat, lng] = mapCenter ?? userLocation;
    return { lat, lng };
  }, [mapCenter, userLocation]);
  const userPosition = useMemo(() => ({ lat: userLocation[0], lng: userLocation[1] }), [userLocation]);

  const routeColors = {
    safest: "#10B981",
    balanced: "#3B82F6",
    fastest: "#F59E0B",
    walking: "#3B82F6",  // Blue for day mode walking routes
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
    const normalized = range === 0 ? 0.5 : (people - activityRange.min) / range;
    const clamped = clamp(normalized, 0, 1);

    // Gradient from darker blue (quiet) to darker red (busy)
    const r = Math.round(59 + (220 - 59) * clamped);
    const g = Math.round(130 + (38 - 130) * clamped);
    const b = Math.round(246 + (38 - 246) * clamped);

    const color = `rgb(${r}, ${g}, ${b})`;
    const weight = 2 + clamped * 2;
    const opacity = 0.6 + clamped * 0.3;

    return {
      color,
      weight,
      opacity,
    };
  };

  // Generate color-coded route segments based on safety scores
  const getRouteSegments = (route) => {
    if (!route.path || route.path.length < 2) {
      console.warn("Route has invalid path:", route);
      return [];
    }

    const segments = [];
    const colors = route.segmentColors || [];

    for (let i = 0; i < route.path.length - 1; i++) {
      const color = colors[i] || routeColors[route.type] || "#3B82F6";
      segments.push({
        path: [route.path[i], route.path[i + 1]],
        color,
      });
    }

    return segments;
  };

  if (!isLoaded) return <div className={`w-full h-full rounded-2xl flex items-center justify-center ${isDark ? "bg-slate-800" : "bg-slate-100"}`}>
    <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
  </div>;

  return (
    <div className="w-full h-full rounded-2xl overflow-hidden shadow-inner">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={zoom}
        onLoad={handleMapLoad}
        options={{
          disableDefaultUI: false,
          styles: isDark ? [
            { elementType: 'geometry', stylers: [{ color: '#1a1a1a' }] },
            { elementType: 'labels.text.fill', stylers: [{ color: '#f5f5f5' }] },
            { elementType: 'labels.text.stroke', stylers: [{ color: '#1a1a1a' }] },
          ] : undefined,
        }}
      >
        {/* Street activity lines - Red for busy, Blue for less busy */}
        {streetActivity.map((street) => {
          const style = getActivityStyle(street.people);
          return (
            <Polyline
              key={street.id || street.name}
              path={street.path.map(([lat, lng]) => ({ lat, lng }))}
              options={{
                strokeColor: style.color,
                strokeWeight: style.weight,
                strokeOpacity: style.opacity,
                zIndex: 10,
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

        {/* Routes for night mode - color matches card type */}
        {routes.map((route) => {
          const isSelected = route.id === selectedRouteId;
          const routeColor = routeColors[route.type] || "#3B82F6";

          // Only render selected route with full visibility
          // Non-selected routes are hidden or very faint
          if (!isSelected) {
            return (
              <Polyline
                key={route.id}
                path={route.path.map(([lat, lng]) => ({ lat, lng }))}
                options={{
                  strokeColor: routeColor,
                  strokeWeight: 3,
                  strokeOpacity: 0.2,
                  zIndex: 1,
                }}
              />
            );
          }

          // Selected route renders with the route type color
          return (
            <Polyline
              key={route.id}
              path={route.path.map(([lat, lng]) => ({ lat, lng }))}
              options={{
                strokeColor: routeColor,
                strokeWeight: 6,
                strokeOpacity: 1,
                zIndex: 10,
              }}
            />
          );
        })}

        {/* Direct route line when destination is set - only for day mode (when no routes array) */}
        {directions && routes.length === 0 && (
          <DirectionsRenderer
            directions={directions}
            options={{
              suppressMarkers: true,
              polylineOptions: {
                strokeColor: "#3B82F6",
                strokeWeight: 5,
                strokeOpacity: 0.8,
              },
            }}
          />
        )}

        {/* Fallback: Simple straight line if directions not available but destination is set (day mode only) */}
        {destination && !directions && routes.length === 0 && (
          <Polyline
            path={[
              { lat: userLocation[0], lng: userLocation[1] },
              { lat: destination.latitude, lng: destination.longitude }
            ]}
            options={{
              strokeColor: "#3B82F6",
              strokeWeight: 5,
              strokeOpacity: 0.8,
              zIndex: 50,
            }}
          />
        )}

        {/* User location marker */}
        <Marker
          position={userPosition}
          icon={{
            url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
            scaledSize: { width: 40, height: 40 },
          }}
        />

        {/* Destination marker - always show when destination is set */}
        {destination && (
            <Marker
              position={{ lat: destination.latitude, lng: destination.longitude }}
              icon={{
                url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
                scaledSize: { width: 50, height: 50 },
              }}
              title={destination.label || "Destination"}
            />
        )}
      </GoogleMap>
    </div>
  );
}
