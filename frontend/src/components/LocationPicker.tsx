// components/LocationPicker.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Region } from 'react-native-maps';

import { COLORS, SPACING, RADIUS, FONT } from '../theme';
import { useUserLocation } from '../hooks/useUserLocation';

interface LocationPickerProps {
  visible: boolean;
  onClose: () => void;
  onLocationSelect: (lat: number, lng: number) => void;
  initialLat?: number;
  initialLng?: number;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  visible,
  onClose,
  onLocationSelect,
  initialLat,
  initialLng,
}) => {
  const { location: userLocation } = useUserLocation();

  const [selectedLat, setSelectedLat] = useState<number>(initialLat || -1.701);
  const [selectedLng, setSelectedLng] = useState<number>(initialLng || 29.256);
  const [isConfirming, setIsConfirming] = useState(false);

  // Reset when modal opens
  useEffect(() => {
    if (visible) {
      if (initialLat && initialLng) {
        setSelectedLat(initialLat);
        setSelectedLng(initialLng);
      } else if (userLocation) {
        setSelectedLat(userLocation.latitude);
        setSelectedLng(userLocation.longitude);
      }
    }
  }, [visible, initialLat, initialLng, userLocation]);

  const handleRegionChangeComplete = (region: Region) => {
    setSelectedLat(region.latitude);
    setSelectedLng(region.longitude);
  };

  const handleConfirmLocation = () => {
    setIsConfirming(true);
    onLocationSelect(selectedLat, selectedLng);
    setTimeout(() => {
      setIsConfirming(false);
      onClose();
    }, 200);
  };

  const initialRegion: Region = {
    latitude: selectedLat,
    longitude: selectedLng,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>

          {/* HEADER */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.sideButton}>
              <Text style={styles.closeText}>Cancel</Text>
            </TouchableOpacity>

            <View style={styles.headerCenter}>
              <Text style={styles.title}>Select Location</Text>
            </View>

            <TouchableOpacity onPress={handleConfirmLocation} style={styles.sideButton}>
              {isConfirming ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <Text style={styles.confirmText}>Done</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* MAP */}
          <MapView
            style={styles.map}
            initialRegion={initialRegion}
            onRegionChangeComplete={handleRegionChangeComplete}
            showsUserLocation
            showsMyLocationButton
          >
            <Marker
              coordinate={{ latitude: selectedLat, longitude: selectedLng }}
              draggable
              onDragEnd={(e) => {
                setSelectedLat(e.nativeEvent.coordinate.latitude);
                setSelectedLng(e.nativeEvent.coordinate.longitude);
              }}
            />
          </MapView>

          {/* FOOTER */}
          <View style={styles.footer}>
            <Text style={styles.coordinatesText}>
              📍 {selectedLat.toFixed(6)}, {selectedLng.toFixed(6)}
            </Text>
            <Text style={styles.instructionText}>
              Drag the pin or move the map
            </Text>
          </View>

        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.card,
  },

  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  /* HEADER */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  sideButton: {
    width: 80,
  },

  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },

  title: {
    fontSize: FONT.subtitle,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },

  closeText: {
    fontSize: FONT.body,
    color: COLORS.textSecondary,
  },

  confirmText: {
    fontSize: FONT.body,
    color: COLORS.primary,
    fontWeight: '600',
    textAlign: 'right',
  },

  /* MAP */
  map: {
    flex: 1,
  },

  /* FOOTER */
  footer: {
    padding: SPACING.md,
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },

  coordinatesText: {
    fontSize: FONT.small,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },

  instructionText: {
    fontSize: FONT.small,
    color: COLORS.primary,
    textAlign: 'center',
    fontWeight: '500',
  },
});