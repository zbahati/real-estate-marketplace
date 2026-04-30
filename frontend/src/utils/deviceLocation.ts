import { Platform } from 'react-native';
import * as Location from 'expo-location';

export const MARKET_CENTER = {
  latitude: -1.701,
  longitude: 29.256,
} as const;

export const DESIRED_ACCURACY_METERS = 80;
export const USABLE_ACCURACY_METERS = 750;
export const HIGH_ACCURACY_TIMEOUT_MS = 12000;
export const MARKET_FALLBACK_DISTANCE_KM = 30;

export type DeviceLocation = {
  latitude: number;
  longitude: number;
  accuracy: number | null;
};

export type NearbySearchLocation = {
  lat?: number;
  lng?: number;
  location: DeviceLocation | null;
  message: string | null;
  usedFallback: boolean;
};

const degreesToRadians = (value: number) => (value * Math.PI) / 180;

export const getDistanceKm = (
  start: { latitude: number; longitude: number },
  end: { latitude: number; longitude: number }
) => {
  const earthRadiusKm = 6371;
  const dLat = degreesToRadians(end.latitude - start.latitude);
  const dLng = degreesToRadians(end.longitude - start.longitude);
  const startLat = degreesToRadians(start.latitude);
  const endLat = degreesToRadians(end.latitude);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(startLat) * Math.cos(endLat) * Math.sin(dLng / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const formatAccuracy = (accuracy: number | null) => {
  if (accuracy === null) return null;
  return accuracy >= 1000
    ? `${(accuracy / 1000).toFixed(1)} km`
    : `${Math.round(accuracy)} m`;
};

export const getAccuracyMessage = (accuracy: number | null) => {
  if (accuracy === null) return null;

  if (accuracy > USABLE_ACCURACY_METERS) {
    return `Your GPS is still approximate within ${formatAccuracy(accuracy)}. Move outside or turn on high accuracy mode, then tap locate again.`;
  }

  if (accuracy > DESIRED_ACCURACY_METERS) {
    return `Location accuracy is about ${formatAccuracy(accuracy)}. Nearby results are based on this estimate.`;
  }

  return null;
};

const toDeviceLocation = (location: Location.LocationObject): DeviceLocation => ({
  latitude: location.coords.latitude,
  longitude: location.coords.longitude,
  accuracy: location.coords.accuracy ?? null,
});

const isBetterLocation = (
  nextLocation: Location.LocationObject,
  currentBest: Location.LocationObject | null
) => {
  if (!currentBest) return true;

  const nextAccuracy = nextLocation.coords.accuracy ?? Number.POSITIVE_INFINITY;
  const currentAccuracy = currentBest.coords.accuracy ?? Number.POSITIVE_INFINITY;

  return nextAccuracy < currentAccuracy;
};

const isHighConfidenceLocation = (location: Location.LocationObject) => {
  const accuracy = location.coords.accuracy;
  return accuracy !== null && accuracy !== undefined && accuracy <= DESIRED_ACCURACY_METERS;
};

export async function getBestDeviceLocation() {
  const servicesEnabled = await Location.hasServicesEnabledAsync();
  if (!servicesEnabled) {
    throw new Error('LOCATION_SERVICES_DISABLED');
  }

  if (Platform.OS === 'android') {
    try {
      await Location.enableNetworkProviderAsync();
    } catch {
      // Highest accuracy still works when the Android helper dialog is unavailable.
    }
  }

  const highAccuracyOptions: Location.LocationOptions = {
    accuracy: Location.Accuracy.Highest,
    mayShowUserSettingsDialog: true,
  };

  let bestLocation = await Location.getCurrentPositionAsync(highAccuracyOptions);

  if (isHighConfidenceLocation(bestLocation)) {
    return toDeviceLocation(bestLocation);
  }

  const watchedLocation = await new Promise<Location.LocationObject>((resolve) => {
    let settled = false;
    let subscription: Location.LocationSubscription | null = null;

    const finish = (location: Location.LocationObject) => {
      if (settled) return;
      settled = true;
      subscription?.remove();
      resolve(location);
    };

    const timer = setTimeout(() => finish(bestLocation), HIGH_ACCURACY_TIMEOUT_MS);

    Location.watchPositionAsync(
      {
        ...highAccuracyOptions,
        distanceInterval: 0,
        timeInterval: 1000,
      },
      (location) => {
        if (isBetterLocation(location, bestLocation)) {
          bestLocation = location;
        }

        if (isHighConfidenceLocation(bestLocation)) {
          clearTimeout(timer);
          finish(bestLocation);
        }
      }
    )
      .then((nextSubscription) => {
        if (settled) {
          nextSubscription.remove();
          return;
        }

        subscription = nextSubscription;
      })
      .catch(() => {
        clearTimeout(timer);
        finish(bestLocation);
      });
  });

  return toDeviceLocation(watchedLocation);
}

export const getReliableNearbySearchLocation = async (): Promise<NearbySearchLocation> => {
  const location = await getBestDeviceLocation();
  const accuracyMessage = getAccuracyMessage(location.accuracy);
  const distanceFromMarketKm = getDistanceKm(location, MARKET_CENTER);

  if (location.accuracy !== null && location.accuracy > USABLE_ACCURACY_METERS) {
    return {
      location,
      message: `${accuracyMessage} Showing the default Gisenyi marketplace instead.`,
      usedFallback: true,
    };
  }

  if (distanceFromMarketKm > MARKET_FALLBACK_DISTANCE_KM) {
    return {
      location,
      message: `Your device reported a location ${distanceFromMarketKm.toFixed(0)} km from Gisenyi. Showing the Gisenyi marketplace instead.`,
      usedFallback: true,
    };
  }

  return {
    lat: location.latitude,
    lng: location.longitude,
    location,
    message: accuracyMessage,
    usedFallback: false,
  };
};
