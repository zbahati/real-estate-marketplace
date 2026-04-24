import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Button from './Button';
import { SPACING, COLORS, FONT } from '../theme';

export default function HomeHero() {
  return (
    <View style={styles.hero}>
      <Text style={styles.title}>Find your next place</Text>
      <Text style={styles.subtitle}>Nearby homes, cars and lands — updated daily</Text>
      <Button title="Create Listing" onPress={() => { /* noop for now */ }} />
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg, paddingBottom: SPACING.md },
  title: { fontSize: FONT.title, fontWeight: '800', color: COLORS.textPrimary, marginBottom: SPACING.xs },
  subtitle: { color: COLORS.textSecondary, fontSize: FONT.body, marginBottom: SPACING.sm },
});
