import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { SPACING, COLORS } from '../theme';

export interface CategoryItem {
  label: string;
  value: string;
}

interface Props {
  items: CategoryItem[];
  selected: string;
  onSelect: (value: string) => void;
  multiple?: boolean;
}

export default function CategoryChips({ items, selected, onSelect }: Props) {
  return (
    <View style={styles.wrap}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {items.map((it) => {
          const active = selected === it.value;
          return (
            <TouchableOpacity
              key={it.label + it.value}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => onSelect(it.value)}
            >
              <Text style={[styles.label, active && styles.labelActive]}>{it.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: SPACING.lg, marginBottom: SPACING.sm },
  row: { alignItems: 'center' },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    marginRight: SPACING.sm,
  },
  chipActive: { backgroundColor: COLORS.primary },
  label: { color: COLORS.textPrimary, fontWeight: '600' },
  labelActive: { color: '#fff' },
});
