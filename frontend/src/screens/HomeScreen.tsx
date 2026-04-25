import React, { useEffect, useRef, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, TouchableOpacity, Animated, TextInput, Platform } from 'react-native';
import { getNearbyListings } from '../api/listings';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import type { Listing } from '../types';
import ListingCard from '../components/ListingCard';
import { Feather as Icon } from '@expo/vector-icons';
import { SPACING, COLORS, FONT, RADIUS } from '../theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';

export default function HomeScreen() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [listingType, setListingType] = useState('');
  const [ownerFallback, setOwnerFallback] = useState(false);
  const { token } = useAuthStore();
  const router = useRouter();

  // listing types are searchable via text query (q)

  useEffect(() => {
    loadListings();
  }, []);

  const insets = useSafeAreaInsets();

  // animated header hide on scroll — compute header height using safe area
  const HEADER_BASE = 56;
  const HEADER_HEIGHT = insets.top + HEADER_BASE;

  const scrollY = useRef(new Animated.Value(0)).current;
  const headerTranslate = scrollY.interpolate({
    inputRange: [0, HEADER_HEIGHT],
    outputRange: [0, -HEADER_HEIGHT],
    extrapolate: 'clamp',
  });

  const [searchVisible, setSearchVisible] = useState(false);
  const searchInputRef = useRef<TextInput | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // const loadListings = async () => {
  //   setLoading(true);
  //   try {
  //     // Request nearby listings without explicit coords. Backend will
  //     // use IP-based geo lookup or default center (Gisenyi) if needed.
  //     const data = await getNearbyListings({ q: query || undefined, listing_type: listingType || undefined, category: selectedCategory || undefined });
  //     setListings(data || []);
  //     // derive categories from fetched listings (filter out undefined with a type guard)
  //     const cats = Array.from(
  //       new Set((data || []).map((l: Listing) => l.category).filter((c): c is string => !!c))
  //     );
  //     setCategories(cats);

  //     // If no public listings found, and user is authenticated, show their listings as a fallback
  //     if ((data || []).length === 0 && token) {
  //       try {
  //         const res = await api.get('/listings/my');
  //         const myList = res.data && res.data.data !== undefined ? res.data.data : res.data;
  //         if (Array.isArray(myList) && myList.length > 0) {
  //           setListings(myList);
  //           setOwnerFallback(true);
  //         }
  //       } catch (err) {
  //         // ignore
  //       }
  //     } else {
  //       setOwnerFallback(false);
  //     }
  //   } catch (err) {
  //     console.error('Failed to load listings', err);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

const loadListings = async () => {
  setLoading(true);

  try {
    let coords = null;

    // STEP 1: Get device location
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        coords = {
          lat: location.coords.latitude,
          lng: location.coords.longitude,
        };

        console.log('📍 Device location:', coords);
      } else {
        console.log('❌ Location permission denied');
      }
    } catch (err) {
      console.log('❌ Location error:', err);
    }

    // STEP 2: Call API
    const data = await getNearbyListings({
      lat: coords?.lat,
      lng: coords?.lng,
      q: query || undefined,
      listing_type: listingType || undefined,
      category: selectedCategory || undefined,
    });

    console.log('📦 Listings received:', data.length);

    setListings(data || []);

    // categories
    const cats = Array.from(
      new Set(
        (data || [])
          .map((l: Listing) => l.category)
          .filter((c): c is string => !!c)
      )
    );

    setCategories(cats);

  } catch (err) {
    console.error('❌ Failed to load listings', err);
  } finally {
    setLoading(false);
  }
};
  React.useEffect(() => {
    if (searchVisible) {
      const t = setTimeout(() => searchInputRef.current?.focus(), 60);
      return () => clearTimeout(t);
    }
    return;
  }, [searchVisible]);

  React.useEffect(() => () => { if (searchTimer.current) clearTimeout(searchTimer.current); }, []);

  return (
    <SafeAreaView style={styles.wrapper}>
      <Animated.View style={[styles.topBar, { transform: [{ translateY: headerTranslate }], paddingTop: insets.top, height: HEADER_HEIGHT }]}>
        <View style={[styles.topBarInner, { height: HEADER_BASE }]}>
          {!searchVisible ? (
            <>
              <View style={{ width: 24 }} />
              <View style={styles.topIcons}>
                <TouchableOpacity onPress={() => setSearchVisible(true)} style={styles.iconBtn}>
                  <Icon name="search" size={20} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { /* optional filter action */ }} style={styles.iconBtn}>
                  <Icon name="sliders" size={20} color={COLORS.textPrimary} />
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <View style={styles.searchRow}>
              <TextInput
                ref={(r) => { searchInputRef.current = r; }}
                placeholder="Search locations, price or title"
                value={query}
                onChangeText={(text) => {
                  setQuery(text);
                  if (searchTimer.current) clearTimeout(searchTimer.current);
                  searchTimer.current = setTimeout(() => {
                    loadListings();
                  }, 500);
                }}
                style={styles.searchInputInline}
                returnKeyType="search"
                onSubmitEditing={() => { if (searchTimer.current) clearTimeout(searchTimer.current); loadListings(); setSearchVisible(false); }}
              />
              <TouchableOpacity onPress={() => {
                if (query) {
                  setQuery('');
                  if (searchTimer.current) clearTimeout(searchTimer.current);
                  loadListings();
                } else {
                  setSearchVisible(false);
                }
              }} style={styles.iconBtn}>
                <Icon name="x" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Animated.View>

      {ownerFallback && (
        <View style={{ paddingHorizontal: SPACING.lg, marginBottom: SPACING.sm }}>
          <Text style={{ color: COLORS.warning || '#b45309' }}>Showing your listings (not published publicly)</Text>
        </View>
      )}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <Animated.FlatList
          data={listings}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <ListingCard
              listing={item}
              onPress={() => router.push({ pathname: '/listings/[id]', params: { id: String(item.id) } })}
            />
          )}
          ListEmptyComponent={<Text style={styles.empty}>No nearby listings found.</Text>}
          contentContainerStyle={{ padding: SPACING.md, paddingTop: HEADER_HEIGHT + SPACING.md, paddingBottom: 48 }}
          refreshing={loading}
          onRefresh={loadListings}
          initialNumToRender={6}
          windowSize={10}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
          scrollEventThrottle={16}
        />
      )}

      {/* inline search handled in top bar; modal removed */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: COLORS.background },
  topBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    zIndex: 20,
    backgroundColor: 'rgba(255,255,255,0.001)',
    paddingTop: Platform.OS === 'android' ? 24 : 0,
    elevation: 12,
  },
  topBarInner: { height: 64, paddingHorizontal: SPACING.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: Platform.OS === 'ios' ? 6 : 0 },
  topIcons: { flexDirection: 'row', alignItems: 'center' },
  iconBtn: { padding: 12, marginLeft: SPACING.sm, borderRadius: 8 },
  searchRow: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  searchInputInline: { flex: 1, paddingVertical: 8, paddingHorizontal: SPACING.md, backgroundColor: COLORS.card, borderRadius: RADIUS.md },
  filtersWrap: { paddingTop: SPACING.sm },
  tabsRow: { flexDirection: 'row', paddingHorizontal: SPACING.lg, marginBottom: SPACING.sm },
  tab: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, backgroundColor: COLORS.card, marginRight: SPACING.sm },
  tabActive: { backgroundColor: COLORS.primary },
  tabText: { color: COLORS.textPrimary, fontWeight: '600' },
  tabTextActive: { color: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background },
  empty: { textAlign: 'center', marginTop: SPACING.lg, color: COLORS.textSecondary },

});
