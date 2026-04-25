import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList, Image, TouchableOpacity, Linking, Platform, Modal, Dimensions, ScrollView, Pressable } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../src/services/api';
import { COLORS, SPACING, FONT, RADIUS } from '../../src/theme';

type Params = { id?: string };

export default function ListingDetails() {
  const { id } = useLocalSearchParams<Params>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [listing, setListing] = useState<any>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [galleryVisible, setGalleryVisible] = useState(false);
  const windowWidth = Dimensions.get('window').width;
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!id) return;
    load();
  }, [id]);

  const load = async () => {
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
  };

  const openWhatsApp = (phone?: string) => {
    if (!phone) return;
    const text = encodeURIComponent('Hello from real estate marketplace, I am interested in your postings, is it still available?');
    const url = `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${text}`;
    Linking.openURL(url).catch(() => alert('Unable to open WhatsApp'));
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
          <TouchableOpacity onPress={() => { /* favorite placeholder */ }} style={styles.iconBtn}>
            <Ionicons name="heart" size={20} color="#fff" />
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
        <SafeAreaView style={styles.modalSafe}>
          <View style={[styles.modalHeader, { top: insets.top + 12 }]}> 
            <Pressable onPress={() => setGalleryVisible(false)} style={styles.iconBtn}>
              <Ionicons name="close" size={20} color="#fff" />
            </Pressable>
          </View>
          <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} onMomentumScrollEnd={(e) => {
            const index = Math.round(e.nativeEvent.contentOffset.x / windowWidth);
            setActiveIndex(index);
          }} contentOffset={{ x: activeIndex * windowWidth, y: 0 }}>
            {images.length > 0 ? images.map((img) => (
              <Image key={img} source={{ uri: img }} style={{ width: windowWidth, height: Dimensions.get('window').height * 0.8, resizeMode: 'contain', backgroundColor: '#000' }} />
            )) : (
              <View style={{ width: windowWidth, height: Dimensions.get('window').height * 0.8, backgroundColor: '#000' }} />
            )}
          </ScrollView>
        </SafeAreaView>
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
  modalSafe: { flex: 1, backgroundColor: '#000' },
  modalHeader: { position: 'absolute', top: 12, left: 12, right: 12, zIndex: 10, flexDirection: 'row', justifyContent: 'flex-end' },
});
