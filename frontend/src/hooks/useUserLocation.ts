// hooks/useUserLocation.ts
import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

interface UserLocation {
  latitude: number;
  longitude: number;
}

export const useUserLocation = () => {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrorMsg('Permission to access location was denied');
          setLoading(false);
          return;
        }

        const userLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setLocation({
          latitude: userLocation.coords.latitude,
          longitude: userLocation.coords.longitude,
        });
      } catch (error) {
        setErrorMsg('Failed to get location');
        console.error(error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { location, errorMsg, loading };
};