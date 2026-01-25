import { useEffect, useMemo, useState } from "react";

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.nchc.org.tw/api/interpreter",
];

const DEFAULT_ROAD_TYPES = [
  "motorway",
  "trunk",
  "primary",
  "secondary",
  "tertiary",
  "unclassified",
  "residential",
  "living_street",
  "service",
];

const ROAD_ACTIVITY_WEIGHTS = {
  motorway: 1.15,
  trunk: 1.1,
  primary: 1,
  secondary: 0.95,
  tertiary: 0.9,
  unclassified: 0.8,
  residential: 0.7,
  living_street: 0.55,
  service: 0.5,
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const seededRandom = (seed) => {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
};

const getBoundsCenter = (bounds) => ({
  lat: (bounds.north + bounds.south) / 2,
  lng: (bounds.east + bounds.west) / 2,
});

const getPathCenter = (path) => {
  if (!path.length) return { lat: 0, lng: 0 };
  const total = path.reduce(
    (acc, [lat, lng]) => {
      acc.lat += lat;
      acc.lng += lng;
      return acc;
    },
    { lat: 0, lng: 0 }
  );
  return { lat: total.lat / path.length, lng: total.lng / path.length };
};

const getDistance = (a, b) => Math.hypot(a.lat - b.lat, a.lng - b.lng);

const estimatePeople = ({ id, path, highway, center }) => {
  const pathCenter = getPathCenter(path);
  // Handle center as array [lat, lng] or object {lat, lng}
  const centerObj = Array.isArray(center)
    ? { lat: center[0], lng: center[1] }
    : center;
  const distance = getDistance(pathCenter, centerObj);
  const base = 1 - clamp(distance / 0.085, 0, 1);
  const noise = seededRandom(id);
  const roadWeight = ROAD_ACTIVITY_WEIGHTS[highway] ?? 0.75;
  const intensity = clamp((base * 0.75 + noise * 0.25) * roadWeight, 0, 1);
  return Math.round(8 + intensity * 160);
};

const buildQuery = (bounds, roadTypes) => {
  const highwayFilter = roadTypes.join("|");
  return `
[out:json][timeout:25];
(
  way["highway"~"${highwayFilter}"](${bounds.south},${bounds.west},${bounds.north},${bounds.east});
);
out geom;`;
};

const fetchOverpass = async (query, signal) => {
  let lastError;
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const response = await fetch(`${endpoint}?data=${encodeURIComponent(query)}`, { signal });
      if (!response.ok) {
        throw new Error(`Overpass error ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      if (signal?.aborted) throw error;
      lastError = error;
    }
  }
  throw lastError;
};

export default function useStreetActivity({
  bounds,
  center,
  roadTypes = DEFAULT_ROAD_TYPES,
} = {}) {
  const [streetActivity, setStreetActivity] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const boundsKey = useMemo(() => {
    if (!bounds) return null;
    return `${bounds.south}:${bounds.west}:${bounds.north}:${bounds.east}`;
  }, [bounds]);

  useEffect(() => {
    if (!bounds) return;
    const controller = new AbortController();
    const run = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const query = buildQuery(bounds, roadTypes);
        const data = await fetchOverpass(query, controller.signal);
        const mapCenter = center || getBoundsCenter(bounds);
        const streets = (data.elements || [])
          .filter((element) => element.type === "way" && element.geometry?.length > 1)
          .map((way) => {
            const path = way.geometry.map((node) => [node.lat, node.lon]);
            return {
              id: `way-${way.id}`,
              name: way.tags?.name || way.tags?.ref || "Unnamed street",
              people: estimatePeople({
                id: way.id,
                path,
                highway: way.tags?.highway,
                center: mapCenter,
              }),
              path,
            };
          });
        setStreetActivity(streets);
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };
    run();
    return () => controller.abort();
  }, [boundsKey, center, roadTypes]);

  return { streetActivity, isLoading, error };
}
