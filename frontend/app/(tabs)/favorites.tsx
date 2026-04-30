import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl, Platform, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useAuthGuard } from '../../src/hooks/useAuthGuard';
import { getFavorites, removeFavorite } from '../../src/api/favorites';
import { useAuthStore } from '../../src/store/authStore';
import { COLORS, SPACING, FONT, RADIUS } from '../../src/theme';
import type { Listing } from '../../src/types';

interface FavoriteCardProps {
  item: Listing;
  onPress: (id: number) => void;
  onRemove: (id: number) => void;
  isRemoving: boolean;
}

const SWIPE_THRESHOLD = -80;

function FavoriteCard({ item, onPress, onRemove, isRemoving }: FavoriteCardProps) {
  const translateX = useSharedValue(0);

  const imageUrl = item.images && item.images.length > 0 ? item.images[0].url : null;
  const locationLabel = item.location
    ? typeof item.location === 'string'
      ? item.location
      : item.location.name ?? [item.location.city, item.location.country].filter(Boolean).join(', ')
    : '';
  const priceLabel = item.price !== undefined ? `RWF ${Number(item.price).toLocaleString()}` : 'Price on request';

  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onUpdate((event) => {
      if (event.translationX < 0) {
        translateX.value = Math.max(event.translationX, SWIPE_THRESHOLD);
      }
    })
    .onEnd((event) => {
      if (event.translationX < SWIPE_THRESHOLD + 20) {
        translateX.value = withTiming(SWIPE_THRESHOLD, { duration: 200 });
      } else {
        translateX.value = withTiming(0, { duration: 200 });
      }
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const handleRemovePress = useCallback(() => {
    translateX.value = withTiming(0, { duration: 200 });
    onRemove(item.id);
  }, [item.id, onRemove, translateX]);

  return (
    <GestureHandlerRootView>
      <Animated.View style={[styles.cardContainer, cardStyle]}>
        <View style={styles.cardRow}>
          <Animated.View style={[styles.cardInner, { height: isRemoving ? 0 : undefined, opacity: isRemoving ? 0 : 1 }]}>
            <GestureDetector gesture={panGesture}>
              <Animated.View style={styles.cardContent}>
              {imageUrl ? (
                <View style={styles.imageWrap}>
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => onPress(item.id)}
                    style={styles.imageContainer}
                  >
                    <Image source={{ uri: imageUrl }} style={styles.image} />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.imageWrap}>
                  <View style={[styles.image, { backgroundColor: COLORS.primaryLight }]} />
                </View>
              )}

                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => onPress(item.id)}
                  style={styles.cardInfo}
                >
                  <Text style={styles.price} numberOfLines={1}>{priceLabel}</Text>
                  <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
                  {locationLabel ? (
                    <View style={styles.locationRow}>
                      <Ionicons name="location-outline" size={12} color={COLORS.textSecondary} />
                      <Text style={styles.location} numberOfLines={1}>{locationLabel}</Text>
                    </View>
                  ) : null}
                  <View style={styles.metaRow}>
                    {item.category ? (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{item.category}</Text>
                      </View>
                    ) : null}
                    {item.listing_type ? (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{item.listing_type}</Text>
                      </View>
                    ) : null}
                    {item.bedrooms ? (
                      <Text style={styles.metaItem}>{item.bedrooms} bd</Text>
                    ) : null}
                    {item.bathrooms ? (
                      <Text style={styles.metaItem}>{item.bathrooms} ba</Text>
                    ) : null}
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={handleRemovePress}
                  activeOpacity={0.7}
                >
                  {isRemoving ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Ionicons name="trash" size={20} color="#fff" />
                  )}
                </TouchableOpacity>
              </Animated.View>
            </GestureDetector>
          </Animated.View>
        </View>

        <View style={[styles.deleteBackground, { width: -SWIPE_THRESHOLD }]}>
          <Ionicons name="trash" size={24} color="#fff" />
        </View>
      </Animated.View>
    </GestureHandlerRootView>
  );
}

function SkeletonCard() {
  return (
    <View style={styles.skeletonCard}>
      <View style={styles.skeletonImage} />
      <View style={styles.skeletonContent}>
        <View style={[styles.skeletonLine, { width: '60%', height: 16 }]} />
        <View style={[styles.skeletonLine, { width: '80%', height: 14, marginTop: SPACING.sm }]} />
        <View style={[styles.skeletonLine, { width: '40%', height: 12, marginTop: SPACING.sm }]} />
        <View style={styles.skeletonMeta}>
          <View style={[styles.skeletonLine, { width: 60, height: 20 }]} />
          <View style={[styles.skeletonLine, { width: 60, height: 20 }]} />
        </View>
      </View>
    </View>
  );
}

export default function Favorites() {
  const { isAuthenticated, initialized } = useAuthGuard();
  const router = useRouter();
  const { removeFavoriteId } = useAuthStore();

  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [removing, setRemoving] = useState<number | null>(null);

  const loadFavorites = useCallback(async () => {
    try {
      const data = await getFavorites();
      setListings(data);
    } catch (err) {
      console.error('Failed to load favorites', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (initialized && isAuthenticated) {
      loadFavorites();
    }
  }, [initialized, isAuthenticated, loadFavorites]);

  useFocusEffect(
    useCallback(() => {
      if (initialized && isAuthenticated) {
        loadFavorites();
      }
    }, [initialized, isAuthenticated, loadFavorites])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadFavorites();
  };

  const handlePress = useCallback((id: number) => {
    router.push(`/listings/${id}` as any);
  }, [router]);

  const handleRemove = useCallback((id: number) => {
    setRemoving(id);
    removeFavoriteId(id);
    setListings((prev) => prev.filter((item) => item.id !== id));
    removeFavorite(id).catch(() => {
      loadFavorites();
    }).finally(() => {
      setRemoving(null);
    });
  }, [removeFavoriteId, loadFavorites]);

  const renderSkeletons = () => {
    const items = [1, 2, 3, 4];
    return items.map((i) => <SkeletonCard key={i} />);
  };

  if (!initialized) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <SafeAreaView style={styles.wrapper} edges={['bottom']}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Favorites</Text>
          {listings.length > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{listings.length}</Text>
            </View>
          )}
        </View>
        <Text style={styles.headerSubtitle}>
          {listings.length === 0 ? 'Save listings you love to view later' : `You have ${listings.length} saved listing${listings.length !== 1 ? 's' : ''}`}
        </Text>
      </View>

      {loading ? (
        <View style={styles.listContent}>
          {renderSkeletons()}
        </View>
      ) : listings.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconWrap}>
            <Ionicons name="heart-outline" size={64} color={COLORS.primaryLight} />
          </View>
          <Text style={styles.emptyTitle}>No favorites yet</Text>
          <Text style={styles.emptyText}>Tap the heart icon on any listing to save it here</Text>
          <TouchableOpacity
            style={styles.exploreBtn}
            onPress={() => router.push('/(tabs)' as any)}
            activeOpacity={0.8}
          >
            <Ionicons name="search" size={18} color="#fff" />
            <Text style={styles.exploreBtnText}>Explore Listings</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={listings}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <FavoriteCard
              item={item}
              onPress={handlePress}
              onRemove={handleRemove}
              isRemoving={removing === item.id}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={COLORS.primary}
            />
          }
          initialNumToRender={6}
          maxToRenderPerBatch={5}
          windowSize={10}
          removeClippedSubviews={Platform.OS === 'android'}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FONT.title,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  countBadge: {
    marginLeft: SPACING.sm,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  countText: {
    color: '#fff',
    fontSize: FONT.small,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: FONT.small,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
  },

  // Card styles
  cardContainer: {
    marginBottom: SPACING.md,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  cardInner: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: COLORS.card,
  },
  imageWrap: {
    width: 120,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  imageContainer: {
    width: 120,
    height: 120,
  },
  image: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.border,
    resizeMode: 'cover',
  },
  cardInfo: {
    flex: 1,
    padding: SPACING.md,
    justifyContent: 'center',
  },
  price: {
    fontSize: FONT.body,
    fontWeight: '800',
    color: COLORS.primary,
  },
  title: {
    fontSize: FONT.body,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: SPACING.xs,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
    gap: 4,
  },
  location: {
    fontSize: FONT.small,
    color: COLORS.textSecondary,
    marginLeft: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  badge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: FONT.small - 1,
  },
  metaItem: {
    fontSize: FONT.small,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  removeBtn: {
    width: 48,
    backgroundColor: COLORS.danger,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.md,
    margin: SPACING.sm,
  },
  deleteBackground: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: COLORS.danger,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.md,
  },

  // Skeleton styles
  skeletonCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  skeletonImage: {
    width: 120,
    height: 120,
    backgroundColor: COLORS.border,
  },
  skeletonContent: {
    flex: 1,
    padding: SPACING.md,
    justifyContent: 'center',
  },
  skeletonLine: {
    backgroundColor: COLORS.border,
    borderRadius: 6,
  },
  skeletonMeta: {
    flexDirection: 'row',
    marginTop: SPACING.sm,
    gap: SPACING.sm,
  },

  // Empty state
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  emptyIconWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  emptyTitle: {
    fontSize: FONT.subtitle,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    fontSize: FONT.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SPACING.lg,
  },
  exploreBtn: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    gap: SPACING.sm,
  },
  exploreBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: FONT.body,
  },
});
