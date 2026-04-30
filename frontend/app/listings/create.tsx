// app/listing/create.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { LocationPicker } from '../../src/components/LocationPicker';
import api, { setAuthToken } from '../../src/services/api';
import { COLORS, SPACING, RADIUS, FONT } from '../../src/theme';
import { useAuthStore } from '../../src/store/authStore';

export default function CreateListingScreen() {
  const { token, user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('house');
  const [listingType, setListingType] = useState('rent');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('Rwanda');
  
  // Location state (lat/lng only - no address needed)
  const [selectedLat, setSelectedLat] = useState<number | null>(null);
  const [selectedLng, setSelectedLng] = useState<number | null>(null);

  if (token) {
    setAuthToken(token);
  }

  // Simplified location handler - only takes lat/lng
  const handleLocationSelect = (lat: number, lng: number) => {
    setSelectedLat(lat);
    setSelectedLng(lng);
  };

  const handleSubmit = async () => {
    // Validation
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }
    if (!price || isNaN(Number(price))) {
      Alert.alert('Error', 'Please enter a valid price');
      return;
    }
    if (!selectedLat || !selectedLng) {
      Alert.alert('Error', 'Please select property location on the map');
      return;
    }
    if (!city.trim()) {
      Alert.alert('Error', 'Please enter city name');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/listings', {
        title: title.trim(),
        description: description.trim(),
        price: Number(price),
        currency: 'RWF',
        category,
        listing_type: listingType,
        city: city.trim(),
        country: country.trim(),
        lat: selectedLat,
        lng: selectedLng,
      });

      if (response.status === 201) {
        Alert.alert('Success', 'Listing created successfully!', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      }
    } catch (error: any) {
      console.error('Create listing error:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to create listing'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.label}>Title *</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="e.g., Modern 3BR House in Kigali"
          placeholderTextColor={COLORS.textSecondary}
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Describe your property..."
          placeholderTextColor={COLORS.textSecondary}
          multiline
          numberOfLines={4}
        />

        <Text style={styles.label}>Price (RWF) *</Text>
        <TextInput
          style={styles.input}
          value={price}
          onChangeText={setPrice}
          placeholder="e.g., 150000"
          keyboardType="numeric"
          placeholderTextColor={COLORS.textSecondary}
        />

        <Text style={styles.label}>Category *</Text>
        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.option, category === 'house' && styles.optionSelected]}
            onPress={() => setCategory('house')}
          >
            <Text style={[styles.optionText, category === 'house' && styles.optionTextSelected]}>
              House
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.option, category === 'land' && styles.optionSelected]}
            onPress={() => setCategory('land')}
          >
            <Text style={[styles.optionText, category === 'land' && styles.optionTextSelected]}>
              Land
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.option, category === 'car' && styles.optionSelected]}
            onPress={() => setCategory('car')}
          >
            <Text style={[styles.optionText, category === 'car' && styles.optionTextSelected]}>
              Car
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Listing Type *</Text>
        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.option, listingType === 'rent' && styles.optionSelected]}
            onPress={() => setListingType('rent')}
          >
            <Text style={[styles.optionText, listingType === 'rent' && styles.optionTextSelected]}>
              For Rent
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.option, listingType === 'sale' && styles.optionSelected]}
            onPress={() => setListingType('sale')}
          >
            <Text style={[styles.optionText, listingType === 'sale' && styles.optionTextSelected]}>
              For Sale
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>City *</Text>
        <TextInput
          style={styles.input}
          value={city}
          onChangeText={setCity}
          placeholder="e.g., Kigali, Gisenyi, Musanze"
          placeholderTextColor={COLORS.textSecondary}
        />

        <Text style={styles.label}>Country</Text>
        <TextInput
          style={styles.input}
          value={country}
          onChangeText={setCountry}
          placeholder="Rwanda"
          placeholderTextColor={COLORS.textSecondary}
        />

        <Text style={styles.label}>Property Location *</Text>
        <TouchableOpacity
          style={styles.locationButton}
          onPress={() => setShowLocationPicker(true)}
        >
          <Text style={styles.locationButtonText}>
            {selectedLat && selectedLng
              ? `📍 Location set: ${selectedLat.toFixed(6)}, ${selectedLng.toFixed(6)}`
              : '📌 Tap to pick exact location on map'}
          </Text>
        </TouchableOpacity>
        {selectedLat && selectedLng && (
          <Text style={styles.coordinatesHint}>
            Pin will appear on map at these coordinates
          </Text>
        )}

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.card} />
          ) : (
            <Text style={styles.submitButtonText}>Create Listing</Text>
          )}
        </TouchableOpacity>
      </View>

      <LocationPicker
        visible={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
        onLocationSelect={handleLocationSelect}
        initialLat={selectedLat || undefined}
        initialLng={selectedLng || undefined}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  form: {
    padding: SPACING.lg,
  },
  label: {
    fontSize: FONT.body,
    fontWeight: '500',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
    marginTop: SPACING.md,
  },
  input: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: FONT.body,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  option: {
    flex: 1,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    backgroundColor: COLORS.card,
  },
  optionSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  optionText: {
    color: COLORS.textSecondary,
  },
  optionTextSelected: {
    color: COLORS.card,
    fontWeight: '600',
  },
  locationButton: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  locationButtonText: {
    color: COLORS.primary,
    fontWeight: '500',
  },
  coordinatesHint: {
    fontSize: FONT.small,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.xl,
    marginBottom: SPACING.xl,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: COLORS.card,
    fontSize: FONT.body,
    fontWeight: '600',
  },
});