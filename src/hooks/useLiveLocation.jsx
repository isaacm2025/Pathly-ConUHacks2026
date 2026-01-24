import { useState, useEffect } from "react";

export default function useLiveLocation(defaultLocation = [40.7128, -74.0060]) {
  const [location, setLocation] = useState(defaultLocation);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }
    const success = (pos) => {
      const { latitude, longitude } = pos.coords;
      setLocation([latitude, longitude]);
    };
    const fail = (err) => {
      setError(err.message);
    };
    const watcher = navigator.geolocation.watchPosition(success, fail, {
      enableHighAccuracy: true,
      maximumAge: 10000,
      timeout: 20000,
    });
    return () => navigator.geolocation.clearWatch(watcher);
  }, []);

  return { location, error };
}
