// app/(tabs)/map.tsx
import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, Alert } from 'react-native';
import MapView, { Region } from 'react-native-maps';
import { router } from 'expo-router';
import { useUserLocation } from '../../src/hooks/useUserLocation';
import { getNearbyListings } from '../../src/api/listings';
import { MapMarker } from '../../src/components/MapMarker';
import { COLORS, SPACING, FONT } from '../../src/theme';
import type { Listing } from '../../src/types';

export default function MapScreen() {
  const { location, errorMsg, loading: locationLoading } = useUserLocation();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loadingListings, setLoadingListings] = useState(false);
  const mapRef = useRef<MapView>(null);

  // Fetch listings when location is ready
  useEffect(() => {
    if (location) {
      fetchNearbyListings();
    }
  }, [location]);

  const fetchNearbyListings = async () => {
    if (!location) return;
    setLoadingListings(true);
    try {
      // radius = 5 km (adjust as needed)
      const nearby = await getNearbyListings({
        lat: location.latitude,
        lng: location.longitude,
        radius: 5,
        limit: 50,
      });
      setListings(nearby);
    } catch (err) {
      console.error('Failed to load nearby listings:', err);
      Alert.alert('Error', 'Could not load properties on map');
    } finally {
      setLoadingListings(false);
    }
  };

  const handleMarkerPress = (listingId?: number) => {
    // Navigate to listing detail screen (adjust route name if needed)
    router.push(`/listings/${listingId}`); // Ensure this route exists in your app
  };

  // Loading states
  if (locationLoading || (loadingListings && listings.length === 0)) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading map...</Text>
      </View>
    );
  }

  if (errorMsg) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{errorMsg}</Text>
        <Text style={styles.infoText}>Enable location to see properties near you.</Text>
      </View>
    );
  }

  if (!location) {
    return (
      <View style={styles.centered}>
        <Text style={styles.infoText}>Waiting for location...</Text>
      </View>
    );
  }

  const initialRegion: Region = {
    latitude: location.latitude,
    longitude: location.longitude,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton
      >
        {listings.map((listing) => (
          <MapMarker
            key={listing.id}
            coordinate={{
              latitude: listing.lat,
              longitude: listing.lng,
            }}
            title={listing.title}
            price={listing.price}
            onPress={() => handleMarkerPress(listing.id)}
          />
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONT.body,
    color: COLORS.textSecondary,
  },
  errorText: {
    fontSize: FONT.body,
    color: COLORS.danger,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  infoText: {
    fontSize: FONT.small,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});