import React, { useCallback, useMemo } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import type { Listing } from '../types';
import { COLORS, SPACING, RADIUS, FONT } from '../theme';

export interface ListingCardProps {
  listing: Listing;
  onPress?: (id: number) => void;
}

const ListingCard = React.memo(function ListingCard({ listing, onPress }: ListingCardProps) {
  const imageUrl = listing.images && listing.images.length > 0 ? listing.images[0].url : null;
  const isVehicle = (listing.category || '').toLowerCase() === 'car' || (listing.category || '').toLowerCase() === 'vehicle';
  const locationLabel = listing.location
    ? typeof listing.location === 'string'
      ? listing.location
      : listing.location.name ?? [listing.location.city, listing.location.country].filter(Boolean).join(', ')
    : '';
  const priceLabel =
    listing.price !== undefined ? `RWF ${Number(listing.price).toLocaleString()}` : 'Price on request';

  const handlePress = useCallback(() => {
    onPress?.(listing.id);
  }, [onPress, listing.id]);

  const metaContent = useMemo(() => (
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
  ), [listing.listing_type, listing.category, listing.distance, listing.bedrooms, listing.bathrooms, isVehicle]);

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress} activeOpacity={0.85}>
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.image} />
      ) : (
        <View style={styles.imagePlaceholder} />
      )}

      <View style={styles.content}>
        <View style={styles.rowTop}>
          <Text style={styles.title} numberOfLines={1}>{listing.title}</Text>
          <Text style={styles.price}>{priceLabel}</Text>
        </View>

        {locationLabel ? (
          <Text style={styles.location} numberOfLines={1}>{locationLabel}</Text>
        ) : null}

        {metaContent}

        {listing.description ? (
          <Text style={styles.desc} numberOfLines={2}>{listing.description}</Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
});

export default ListingCard;

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
    flex: 1,
    fontSize: FONT.subtitle,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  price: {
    marginLeft: SPACING.sm,
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
    flexWrap: 'wrap',
  },
  location: {
    marginTop: 6,
    color: COLORS.textSecondary,
    fontSize: FONT.small,
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
