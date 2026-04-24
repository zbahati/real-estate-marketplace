import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import type { Listing } from '../types';
import { COLORS, SPACING, RADIUS, FONT } from '../theme';

export interface ListingCardProps {
  listing: Listing;
  onPress?: (listing: Listing) => void;
}

export default function ListingCard({ listing, onPress }: ListingCardProps) {
  const imageUrl = listing.images && listing.images.length > 0 ? listing.images[0].url : null;
  const isVehicle = (listing.category || '').toLowerCase() === 'car' || (listing.category || '').toLowerCase() === 'vehicle';

  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress?.(listing)} activeOpacity={0.85}>
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.image} />
      ) : (
        <View style={styles.imagePlaceholder} />
      )}

      <View style={styles.content}>
        <View style={styles.rowTop}>
          <Text style={styles.title} numberOfLines={1}>{listing.title}</Text>
          {listing.price !== undefined && (
            <Text style={styles.price}>${listing.price.toLocaleString()}</Text>
          )}
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.type}>{listing.listing_type ?? '—'}</Text>
          <Text style={styles.cat}>{listing.category ?? '—'}</Text>
          {listing.distance !== undefined && (
            <Text style={styles.distance}>{String(listing.distance)} km</Text>
          )}
          {!isVehicle && listing.bedrooms !== undefined && (
            <Text style={styles.meta}>{listing.bedrooms} bd</Text>
          )}
          {!isVehicle && listing.bathrooms !== undefined && (
            <Text style={styles.meta}>{listing.bathrooms} ba</Text>
          )}
        </View>

        {listing.description ? (
          <Text style={styles.desc} numberOfLines={2}>{listing.description}</Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    marginBottom: SPACING.lg,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  image: {
    width: '100%',
    height: 240,
  },
  imagePlaceholder: {
    width: '100%',
    height: 240,
    backgroundColor: COLORS.primaryLight,
  },
  content: {
    padding: SPACING.md,
  },
  title: {
    fontSize: FONT.subtitle,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  price: {
    marginTop: 6,
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: FONT.body,
  },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  type: {
    backgroundColor: COLORS.primaryLight,
    color: COLORS.primary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    fontWeight: '700',
    marginRight: SPACING.sm,
    overflow: 'hidden',
  },
  cat: {
    backgroundColor: COLORS.background,
    color: COLORS.textSecondary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    marginRight: SPACING.sm,
    overflow: 'hidden',
  },
  meta: {
    color: COLORS.textSecondary,
    marginRight: SPACING.sm,
  },
  desc: {
    marginTop: 6,
    color: COLORS.textSecondary,
  },
  distance: {
    color: COLORS.textSecondary,
    marginRight: SPACING.sm,
    fontSize: FONT.small,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
