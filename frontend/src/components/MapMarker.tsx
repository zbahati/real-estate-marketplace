// components/MapMarker.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Marker, Callout } from 'react-native-maps';
import { COLORS, SPACING, RADIUS, FONT } from '../theme';

interface MapMarkerProps {
  coordinate: {
    latitude: number;
    longitude: number;
  };
  title: string;
  price?: number;
  onPress: () => void;
}

export const MapMarker: React.FC<MapMarkerProps> = ({
  coordinate,
  title,
  price,
  onPress,
}) => {
  const formattedPrice = price !== undefined ? `$${price}` : 'Price N/A';

  return (
    <Marker coordinate={coordinate} onPress={onPress}>
      <View style={styles.markerContainer}>
        <Text style={styles.priceText}>{formattedPrice}</Text>
      </View>
      <Callout>
        <View style={styles.callout}>
          <Text style={styles.calloutTitle} numberOfLines={2}>
            {title}
          </Text>
          <Text style={styles.calloutPrice}>{formattedPrice}</Text>
        </View>
      </Callout>
    </Marker>
  );
};

const styles = StyleSheet.create({
  markerContainer: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  priceText: {
    fontSize: FONT.small,
    fontWeight: '600',
    color: COLORS.primary,
  },
  callout: {
    minWidth: 140,
    maxWidth: 200,
    padding: SPACING.sm,
  },
  calloutTitle: {
    fontSize: FONT.body,
    fontWeight: '600',
    marginBottom: SPACING.xs,
    color: COLORS.textPrimary,
  },
  calloutPrice: {
    fontSize: FONT.small,
    color: COLORS.primary,
    fontWeight: '500',
  },
});