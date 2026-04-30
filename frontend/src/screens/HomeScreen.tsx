import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Feather as Icon } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { getListings } from '../api/listings';
import ListingCard from '../components/ListingCard';
import { COLORS, RADIUS, SPACING } from '../theme';
import type { Listing } from '../types';

export default function HomeScreen() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [searchVisible, setSearchVisible] = useState(false);

  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const searchInputRef = useRef<TextInput | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const HEADER_BASE = 56;
  const HEADER_HEIGHT = insets.top + HEADER_BASE;

  const headerTranslate = scrollY.interpolate({
    inputRange: [0, HEADER_HEIGHT],
    outputRange: [0, -HEADER_HEIGHT],
    extrapolate: 'clamp',
  });

  const loadListings = useCallback(async (nextQuery: string) => {
    setLoading(true);

    try {
      const data = await getListings({
        limit: 50,
        q: nextQuery || undefined,
      });

      setListings(data);
    } catch (err) {
      console.error('Failed to load listings', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadListings('');
  }, [loadListings]);

  useEffect(() => {
    if (!searchVisible) return;

    const timer = setTimeout(() => searchInputRef.current?.focus(), 60);
    return () => clearTimeout(timer);
  }, [searchVisible]);

  useEffect(
    () => () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    },
    []
  );

  return (
    <SafeAreaView style={styles.wrapper}>
      <Animated.View
        style={[
          styles.topBar,
          {
            transform: [{ translateY: headerTranslate }],
            paddingTop: insets.top,
            height: HEADER_HEIGHT,
          },
        ]}
      >
        <View style={[styles.topBarInner, { height: HEADER_BASE }]}>
          {!searchVisible ? (
            <>
              <View style={{ width: 24 }} />
              <View style={styles.topIcons}>
                <TouchableOpacity onPress={() => setSearchVisible(true)} style={styles.iconBtn}>
                  <Icon name="search" size={20} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconBtn}>
                  <Icon name="sliders" size={20} color={COLORS.textPrimary} />
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <View style={styles.searchRow}>
              <TextInput
                ref={(ref) => {
                  searchInputRef.current = ref;
                }}
                placeholder="Search locations, price or title"
                value={query}
                onChangeText={(text) => {
                  setQuery(text);
                  if (searchTimer.current) clearTimeout(searchTimer.current);
                  searchTimer.current = setTimeout(() => {
                    loadListings(text);
                  }, 500);
                }}
                style={styles.searchInputInline}
                returnKeyType="search"
                onSubmitEditing={() => {
                  if (searchTimer.current) clearTimeout(searchTimer.current);
                  loadListings(query);
                  setSearchVisible(false);
                }}
              />
              <TouchableOpacity
                onPress={() => {
                  if (query) {
                    setQuery('');
                    if (searchTimer.current) clearTimeout(searchTimer.current);
                    loadListings('');
                  } else {
                    setSearchVisible(false);
                  }
                }}
                style={styles.iconBtn}
              >
                <Icon name="x" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Animated.View>

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
          ListEmptyComponent={<Text style={styles.empty}>No listings found.</Text>}
          contentContainerStyle={{
            padding: SPACING.md,
            paddingTop: HEADER_HEIGHT + SPACING.md,
            paddingBottom: 48,
          }}
          refreshing={loading}
          onRefresh={() => loadListings(query)}
          initialNumToRender={6}
          windowSize={10}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
            useNativeDriver: true,
          })}
          scrollEventThrottle={16}
        />
      )}
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
  topBarInner: {
    height: 64,
    paddingHorizontal: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 6 : 0,
  },
  topIcons: { flexDirection: 'row', alignItems: 'center' },
  iconBtn: { padding: 12, marginLeft: SPACING.sm, borderRadius: 8 },
  searchRow: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  searchInputInline: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  empty: { textAlign: 'center', marginTop: SPACING.lg, color: COLORS.textSecondary },
});
