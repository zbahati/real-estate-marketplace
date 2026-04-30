import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image, TouchableOpacity, Linking, Modal, Dimensions, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import api from '../../src/services/api';
import { addFavorite, removeFavorite, getFavorites } from '../../src/api/favorites';
import { useAuthStore } from '../../src/store/authStore';
import { COLORS, SPACING, FONT, RADIUS } from '../../src/theme';

type Params = { id?: string };
const MIN_GALLERY_ZOOM = 1;
const MAX_GALLERY_ZOOM = 3;

function clampZoom(value: number) {
  'worklet';
  return Math.min(Math.max(value, MIN_GALLERY_ZOOM), MAX_GALLERY_ZOOM);
}

type ZoomableGalleryImageProps = {
  uri: string;
  width: number;
  height: number;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  containerWidth: number;
  containerHeight: number;
  canPan: boolean;
};

function ZoomableGalleryImage({ uri, width, height, zoom, onZoomChange, containerWidth, containerHeight, canPan }: ZoomableGalleryImageProps) {
  const scale = useSharedValue(zoom);
  const startScale = useSharedValue(zoom);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedOffsetX = useSharedValue(0);
  const savedOffsetY = useSharedValue(0);

  React.useEffect(() => {
    scale.value = withTiming(zoom, { duration: 120 });
    startScale.value = zoom;
    if (zoom === MIN_GALLERY_ZOOM) {
      translateX.value = withTiming(0, { duration: 120 });
      translateY.value = withTiming(0, { duration: 120 });
      savedOffsetX.value = 0;
      savedOffsetY.value = 0;
    }
  }, [scale, startScale, zoom, translateX, translateY, savedOffsetX, savedOffsetY]);

  const clampTranslation = (tx: number, ty: number, currentScale: number) => {
    'worklet';
    const scaledW = width * currentScale;
    const scaledH = height * currentScale;
    const maxX = Math.max(0, (scaledW - containerWidth) / 2);
    const maxY = Math.max(0, (scaledH - containerHeight) / 2);
    return {
      x: Math.min(Math.max(tx, -maxX), maxX),
      y: Math.min(Math.max(ty, -maxY), maxY),
    };
  };

  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      startScale.value = scale.value;
      savedOffsetX.value = translateX.value;
      savedOffsetY.value = translateY.value;
    })
    .onUpdate((event) => {
      const nextZoom = clampZoom(startScale.value * event.scale);
      scale.value = nextZoom;
      const clamped = clampTranslation(savedOffsetX.value, savedOffsetY.value, nextZoom);
      translateX.value = clamped.x;
      translateY.value = clamped.y;
      runOnJS(onZoomChange)(Number(nextZoom.toFixed(2)));
    })
    .onEnd(() => {
      const nextZoom = clampZoom(scale.value);
      scale.value = withTiming(nextZoom, { duration: 120 });
      runOnJS(onZoomChange)(Number(nextZoom.toFixed(2)));
    });

  const conditionalPan = Gesture.Pan()
    .minPointers(1)
    .maxPointers(1)
    .enabled(canPan)
    .onStart(() => {
      savedOffsetX.value = translateX.value;
      savedOffsetY.value = translateY.value;
    })
    .onUpdate((event) => {
      const clamped = clampTranslation(savedOffsetX.value + event.translationX, savedOffsetY.value + event.translationY, scale.value);
      translateX.value = clamped.x;
      translateY.value = clamped.y;
    })
    .onEnd(() => {
      const clamped = clampTranslation(translateX.value, translateY.value, scale.value);
      translateX.value = withTiming(clamped.x, { duration: 120 });
      translateY.value = withTiming(clamped.y, { duration: 120 });
    });

  const combinedGesture = Gesture.Simultaneous(pinchGesture, conditionalPan);

  const imageStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateX: translateX.value }, { translateY: translateY.value }],
  }));

  return (
    <GestureDetector gesture={combinedGesture}>
      <Animated.Image
        source={{ uri }}
        style={[
          styles.galleryImage,
          imageStyle,
          {
            width,
            height,
          },
        ]}
      />
    </GestureDetector>
  );
}

export default function ListingDetails() {
  const { id } = useLocalSearchParams<Params>();
  const router = useRouter();
  const { token, favoriteIds, addFavoriteId, removeFavoriteId, setFavoriteIds } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [listing, setListing] = useState<any>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [galleryVisible, setGalleryVisible] = useState(false);
  const [galleryZoom, setGalleryZoom] = useState(1);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const windowWidth = Dimensions.get('window').width;
  const windowHeight = Dimensions.get('window').height;
  const insets = useSafeAreaInsets();
  const listingId = listing?.id ? Number(listing.id) : null;

  const isFavorite = listingId != null && favoriteIds.has(listingId);

  useEffect(() => {
    if (token) {
      getFavorites().then((data) => {
        setFavoriteIds(data.map((item) => item.id));
      }).catch(() => {});
    }
  }, [token, setFavoriteIds]);

  const toggleFavorite = useCallback(async () => {
    if (!token) {
      Alert.alert('Login Required', 'Please login to save favorites', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Login', onPress: () => router.push('/(auth)/login' as any) },
      ]);
      return;
    }
    if (!listingId) return;
    setFavoriteLoading(true);
    try {
      if (isFavorite) {
        await removeFavorite(listingId);
        removeFavoriteId(listingId);
      } else {
        await addFavorite(listingId);
        addFavoriteId(listingId);
      }
    } catch {
      Alert.alert('Error', 'Failed to update favorites');
    } finally {
      setFavoriteLoading(false);
    }
  }, [token, listingId, isFavorite, router, addFavoriteId, removeFavoriteId]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/listings/${id}`);
      const payload = res.data && res.data.data !== undefined ? res.data.data : res.data;
      setListing(payload);
    } catch (err: any) {
      console.error('listing load error', err);
      setError('Failed to load listing');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!id) return;
    load();
  }, [id, load]);

  const openWhatsApp = (phone?: string) => {
    if (!phone) return;
    const text = encodeURIComponent('Hello from real estate marketplace, I am interested in your postings, is it still available?');
    const url = `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${text}`;
    Linking.openURL(url).catch(() => alert('Unable to open WhatsApp'));
  };

  const closeGallery = () => {
    setGalleryZoom(1);
    setGalleryVisible(false);
  };

  const zoomIn = () => {
    setGalleryZoom((zoom) => Math.min(zoom + 0.5, MAX_GALLERY_ZOOM));
  };

  const zoomOut = () => {
    setGalleryZoom((zoom) => Math.max(zoom - 0.5, MIN_GALLERY_ZOOM));
  };

  if (loading) {
    return (
      <View style={[styles.center, { flex: 1 }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (error || !listing) {
    return (
      <View style={styles.center}>
        <Text style={{ color: COLORS.textSecondary }}>{error ?? 'Listing not found'}</Text>
      </View>
    );
  }

  const images: string[] = Array.isArray(listing.images) ? listing.images.map((i: any) => i.url || i) : [];
  const firstImage = images.length > 0 ? images[0] : null;

  const locationLabel = listing.location
    ? (typeof listing.location === 'string'
        ? listing.location
        : (listing.location.name ?? [listing.location.city, listing.location.country].filter(Boolean).join(', ')))
    : '';

  return (
    <SafeAreaView style={styles.wrapper} edges={["left", "right", "bottom"]}>
      {/* Image area: large main image + thumbnails */}
      <View style={[styles.imageWrap, { height: 320 }]}>
        <TouchableOpacity activeOpacity={0.9} onPress={() => setGalleryVisible(true)}>
          {images.length > 0 ? (
            <Image source={{ uri: images[activeIndex] ?? firstImage }} style={[styles.image, { width: windowWidth, height: 320 }]} />
          ) : (
            <View style={[styles.imagePlaceholder, { width: windowWidth, height: 320 }]} />
          )}
        </TouchableOpacity>

        <View style={[styles.imageOverlayTop, { top: insets.top + 8 }]}> 
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
            <Ionicons name="chevron-back" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={toggleFavorite}
            disabled={favoriteLoading}
            activeOpacity={0.7}
            style={styles.iconBtn}
          >
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={20}
              color={isFavorite ? COLORS.danger : '#fff'}
            />
          </TouchableOpacity>
        </View>

        {/* Thumbnails row */}
        {images.length > 1 && (
          <View style={styles.thumbsRow}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: SPACING.lg }}>
              {images.map((img, idx) => (
                <TouchableOpacity key={img + idx} onPress={() => setActiveIndex(idx)} style={[styles.thumbWrap, activeIndex === idx ? styles.thumbActive : null]}>
                  <Image source={{ uri: img }} style={styles.thumb} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      {/* Gallery modal (slide up) */}
      <Modal visible={galleryVisible} animationType="slide">
        <GestureHandlerRootView style={styles.modalRoot}>
        <SafeAreaView style={styles.modalSafe}>
          <View style={[styles.modalHeader, { top: insets.top + 12 }]}> 
            <Pressable onPress={closeGallery} style={styles.iconBtn}>
              <Ionicons name="close" size={20} color="#fff" />
            </Pressable>
          </View>

          <View style={[styles.zoomControls, { bottom: insets.bottom + SPACING.lg }]}>
            <Pressable
              onPress={zoomOut}
              style={[styles.zoomBtn, galleryZoom <= MIN_GALLERY_ZOOM ? styles.zoomBtnDisabled : null]}
              disabled={galleryZoom <= MIN_GALLERY_ZOOM}
            >
              <Ionicons name="remove" size={20} color="#fff" />
            </Pressable>
            <Pressable onPress={() => setGalleryZoom(1)} style={styles.zoomValueBtn}>
              <Text style={styles.zoomValueText}>{Math.round(galleryZoom * 100)}%</Text>
            </Pressable>
            <Pressable
              onPress={zoomIn}
              style={[styles.zoomBtn, galleryZoom >= MAX_GALLERY_ZOOM ? styles.zoomBtnDisabled : null]}
              disabled={galleryZoom >= MAX_GALLERY_ZOOM}
            >
              <Ionicons name="add" size={20} color="#fff" />
            </Pressable>
          </View>

          <ScrollView horizontal pagingEnabled scrollEnabled={galleryZoom <= MIN_GALLERY_ZOOM} showsHorizontalScrollIndicator={false} onMomentumScrollEnd={(e) => {
            const index = Math.round(e.nativeEvent.contentOffset.x / windowWidth);
            setActiveIndex(index);
            setGalleryZoom(1);
          }} contentOffset={{ x: activeIndex * windowWidth, y: 0 }}>
            {images.length > 0 ? images.map((img) => (
              <View key={img} style={[styles.gallerySlide, { width: windowWidth, height: windowHeight }]}>
                <ZoomableGalleryImage
                  uri={img}
                  width={windowWidth}
                  height={windowHeight * 0.82}
                  zoom={galleryZoom}
                  onZoomChange={setGalleryZoom}
                  containerWidth={windowWidth}
                  containerHeight={windowHeight * 0.82}
                  canPan={galleryZoom > MIN_GALLERY_ZOOM}
                />
              </View>
            )) : (
              <View style={{ width: windowWidth, height: windowHeight * 0.8, backgroundColor: '#000' }} />
            )}
          </ScrollView>
        </SafeAreaView>
        </GestureHandlerRootView>
      </Modal>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.price}>{listing.currency ? `${listing.currency} ${listing.price?.toLocaleString?.() ?? listing.price}` : `${listing.price}`}</Text>
          <Text style={styles.title}>{listing.title}</Text>

          <View style={styles.badgeRow}>
            {listing.category ? <View style={styles.badge}><Text style={styles.badgeText}>{String(listing.category)}</Text></View> : null}
            {listing.listing_type ? <View style={[styles.badge, { marginLeft: SPACING.sm }]}><Text style={styles.badgeText}>{String(listing.listing_type)}</Text></View> : null}
          </View>

          {/* Location + distance */}
          {(locationLabel || listing.distance) && (
            <View style={{ marginTop: SPACING.sm }}>
              <Text style={{ color: COLORS.textSecondary }}>{locationLabel}{listing.distance ? ` • 📍 ${listing.distance} km away` : ''}</Text>
            </View>
          )}
        </View>

        {/* Description */}
        <View style={{ paddingHorizontal: SPACING.lg, marginTop: SPACING.md }}>
          <Text style={{ fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.sm }}>Description</Text>
          <Text style={{ color: COLORS.textSecondary, lineHeight: 20 }}>{listing.description ?? 'No description provided.'}</Text>
        </View>
      </View>

      {/* Sticky action bar */}
      <View style={[styles.actionsWrap, { bottom: SPACING.lg + insets.bottom }] }>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => openWhatsApp(listing.phone ?? listing.owner?.phone)}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>Contact Owner</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryBtn} onPress={() => alert('Send Request (placeholder)')}>
          <Text style={{ color: COLORS.primary, fontWeight: '700' }}>Send Request</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background },
  imageWrap: { height: 280, backgroundColor: COLORS.card, borderBottomLeftRadius: RADIUS.lg, borderBottomRightRadius: RADIUS.lg, overflow: 'hidden' },
  image: { height: 320, resizeMode: 'cover', backgroundColor: COLORS.primaryLight },
  imagePlaceholder: { width: '100%', height: '100%', backgroundColor: COLORS.primaryLight },
  imageOverlayTop: { position: 'absolute', top: 12, left: 12, right: 12, flexDirection: 'row', justifyContent: 'space-between' },
  iconBtn: { width: 38, height: 38, borderRadius: 38 / 2, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center' },

  content: { flex: 1 },
  card: { backgroundColor: COLORS.card, marginTop: -RADIUS.md, marginHorizontal: SPACING.lg, padding: SPACING.lg, borderRadius: RADIUS.md, elevation: 2 },
  price: { fontSize: 20, fontWeight: '800', color: COLORS.primary },
  title: { fontSize: FONT.subtitle, fontWeight: '700', color: COLORS.textPrimary, marginTop: SPACING.xs },
  badgeRow: { flexDirection: 'row', marginTop: SPACING.sm, alignItems: 'center' },
  badge: { backgroundColor: COLORS.primaryLight, paddingHorizontal: SPACING.sm, paddingVertical: 6, borderRadius: 999 },
  badgeText: { color: COLORS.primary, fontWeight: '700' },

  actionsWrap: { position: 'absolute', left: SPACING.lg, right: SPACING.lg, bottom: SPACING.lg, flexDirection: 'column' },
  primaryBtn: { backgroundColor: COLORS.primary, padding: SPACING.md, borderRadius: RADIUS.md, alignItems: 'center' },
  secondaryBtn: { backgroundColor: COLORS.card, padding: SPACING.md, borderRadius: RADIUS.md, alignItems: 'center', marginTop: SPACING.sm },
  thumbsRow: { position: 'absolute', bottom: 8, left: 0, right: 0 },
  thumbWrap: { marginRight: SPACING.sm, borderRadius: RADIUS.sm, overflow: 'hidden', borderWidth: 2, borderColor: 'transparent', width: 96, height: 72 },
  thumb: { width: 96, height: 72, resizeMode: 'cover' },
  thumbActive: { borderColor: COLORS.primary },
  modalRoot: { flex: 1 },
  modalSafe: { flex: 1, backgroundColor: '#000' },
  modalHeader: { position: 'absolute', top: 12, left: 12, right: 12, zIndex: 10, flexDirection: 'row', justifyContent: 'flex-end' },
  gallerySlide: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden', backgroundColor: '#000' },
  galleryImage: { resizeMode: 'contain', backgroundColor: '#000' },
  zoomControls: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  zoomBtnDisabled: { opacity: 0.4 },
  zoomValueBtn: {
    minWidth: 72,
    height: 44,
    marginHorizontal: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  zoomValueText: { color: '#fff', fontWeight: '800' },
});
