import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import MapView, { Circle, Marker, type Region } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';

import { getListings } from '../../src/api/listings';
import type { Listing } from '../../src/types';
import { COLORS, FONT, RADIUS, SPACING } from '../../src/theme';
import {
  formatAccuracy,
  getReliableNearbySearchLocation,
  MARKET_CENTER,
  type DeviceLocation,
} from '../../src/utils/deviceLocation';

const MAP_LISTING_LIMIT = 100;
const MAP_REGION_DELTA = 0.04;

type ListingWithCoordinate = Listing & {
  coordinate: {
    latitude: number;
    longitude: number;
  };
};

const toNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const getListingCoordinate = (listing: Listing) => {
  const latitude = toNumber(listing.lat);
  const longitude = toNumber(listing.lng);

  if (latitude === null || longitude === null) return null;

  return { latitude, longitude };
};

const formatPrice = (listing: Listing) => {
  if (listing.price === undefined || listing.price === null) return 'Price available on request';
  return `RWF ${Number(listing.price).toLocaleString()}`;
};

const formatDistance = (distance?: number) => {
  if (distance === undefined || distance === null) return undefined;
  const parsed = Number(distance);
  if (!Number.isFinite(parsed)) return undefined;
  return `${parsed.toFixed(parsed < 1 ? 1 : 0)} km away`;
};


export default function MapScreen() {
  const [deviceLocation, setDeviceLocation] = useState<DeviceLocation | null>(null);
  const [mapCenter, setMapCenter] = useState<DeviceLocation>({
    latitude: MARKET_CENTER.latitude,
    longitude: MARKET_CENTER.longitude,
    accuracy: null,
  });
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const mapRef = useRef<MapView>(null);
  const router = useRouter();

  const nearbyListings = useMemo<ListingWithCoordinate[]>(
    () =>
      listings
        .map((listing) => {
          const coordinate = getListingCoordinate(listing);

          if (!coordinate) return null;

          return {
            ...listing,
            coordinate,
          };
        })
        .filter((listing): listing is ListingWithCoordinate => listing !== null),
    [listings]
  );

  const initialRegion = useMemo<Region | undefined>(() => {
    return {
      latitude: mapCenter.latitude,
      longitude: mapCenter.longitude,
      latitudeDelta: MAP_REGION_DELTA,
      longitudeDelta: MAP_REGION_DELTA,
    };
  }, [mapCenter]);

  const fitMapToListings = useCallback((data: Listing[]) => {
    const coordinates = data
      .map(getListingCoordinate)
      .filter((coordinate): coordinate is { latitude: number; longitude: number } => coordinate !== null);

    if (coordinates.length === 0) return;

    setMapCenter({
      ...coordinates[0],
      accuracy: null,
    });

    requestAnimationFrame(() => {
      mapRef.current?.fitToCoordinates(coordinates, {
        animated: true,
        edgePadding: {
          top: 80,
          right: 40,
          bottom: 180,
          left: 40,
        },
      });
    });
  }, []);

  const loadMapListings = useCallback(async () => {
    const data = await getListings({
      limit: MAP_LISTING_LIMIT,
    });

    setListings(data);
    setMessage(data.length === 0 ? 'No published listings found.' : null);
    fitMapToListings(data);
  }, [fitMapToListings]);

  const locateAndLoad = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setMessage(null);

      try {
        await loadMapListings();

        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === Location.PermissionStatus.GRANTED) {
          const searchLocation = await getReliableNearbySearchLocation();
          setDeviceLocation(searchLocation.location);
          setMessage((currentMessage) => currentMessage ?? searchLocation.message);
        }
      } catch (err) {
        console.error('Failed to load listings on map', err);
        setMessage(
          err instanceof Error && err.message === 'LOCATION_SERVICES_DISABLED'
            ? 'Turn on device location services to show your position on the map.'
            : 'Could not load map listings. Check your connection and try again.'
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [loadMapListings]
  );

  useEffect(() => {
    locateAndLoad();
  }, [locateAndLoad]);

  if (loading || !initialRegion) {
    return (
      <View style={styles.center}>
        {loading ? <ActivityIndicator size="large" color={COLORS.primary} /> : null}
        <Text style={styles.centerText}>
          {loading ? 'Loading listings map...' : 'Map unavailable'}
        </Text>
        {message ? <Text style={styles.message}>{message}</Text> : null}
        {!loading && message ? (
          <Pressable style={styles.primaryButton} onPress={() => locateAndLoad()}>
            <Text style={styles.primaryButtonText}>Try again</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={initialRegion}
      >
        {deviceLocation?.accuracy ? (
          <Circle
            center={{
              latitude: deviceLocation.latitude,
              longitude: deviceLocation.longitude,
            }}
            radius={Math.min(deviceLocation.accuracy, 5000)}
            strokeColor="rgba(37, 99, 235, 0.28)"
            fillColor="rgba(37, 99, 235, 0.10)"
          />
        ) : null}

        <Marker
          coordinate={{
            latitude: mapCenter.latitude,
            longitude: mapCenter.longitude,
          }}
          title="Marketplace center"
          pinColor={COLORS.primary}
        />

        {deviceLocation ? (
          <Marker
            coordinate={{
              latitude: deviceLocation.latitude,
              longitude: deviceLocation.longitude,
            }}
            title="Your device location"
            description={
              formatAccuracy(deviceLocation.accuracy)
                ? `Accuracy: ${formatAccuracy(deviceLocation.accuracy)}`
                : undefined
            }
            pinColor={COLORS.success}
          />
        ) : null}

        {nearbyListings.map((listing) => (
          <Marker
            key={String(listing.id)}
            coordinate={listing.coordinate}
            title={listing.title}
            description={[formatPrice(listing), formatDistance(listing.distance)]
              .filter(Boolean)
              .join(' - ')}
            onCalloutPress={() =>
              router.push({ pathname: '/listings/[id]', params: { id: String(listing.id) } })
            }
          />
        ))}
      </MapView>

      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>
          {nearbyListings.length} {nearbyListings.length === 1 ? 'listing' : 'listings'} on map
        </Text>
        <Text style={styles.summaryText}>
          Showing all published properties with saved map coordinates.
        </Text>
        {message ? <Text style={styles.message}>{message}</Text> : null}
      </View>

      <Pressable
        style={styles.refreshButton}
        onPress={() => locateAndLoad(true)}
        disabled={refreshing}
      >
        {refreshing ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Ionicons name="locate" size={20} color="#fff" />
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  map: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
    backgroundColor: COLORS.background,
  },
  centerText: {
    marginTop: SPACING.md,
    color: COLORS.textPrimary,
    fontSize: FONT.body,
    fontWeight: '600',
  },
  message: {
    marginTop: SPACING.sm,
    color: COLORS.textSecondary,
    fontSize: FONT.small,
    textAlign: 'center',
  },
  primaryButton: {
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.primary,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  summary: {
    position: 'absolute',
    left: SPACING.md,
    right: SPACING.md,
    bottom: SPACING.lg + 64,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  summaryTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT.subtitle,
    fontWeight: '800',
  },
  summaryText: {
    marginTop: SPACING.xs,
    color: COLORS.textSecondary,
    fontSize: FONT.small,
  },
  refreshButton: {
    position: 'absolute',
    right: SPACING.md,
    bottom: SPACING.lg,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
});
