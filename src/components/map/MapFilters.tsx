import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radii, typography } from '@/constants/theme';
import type { MapFilter } from '@/types';

const FILTERS: { id: MapFilter; label: string }[] = [
  { id: 'any', label: 'Any' },
  { id: 'residential', label: 'Residential' },
  { id: 'public', label: 'Public' },
  { id: 'fast', label: 'Fast' },
  { id: 'available', label: 'Available now' },
];

interface MapFiltersProps {
  active: MapFilter;
  onChange: (filter: MapFilter) => void;
  onExpand?: () => void;
}

export function MapFiltersBar({ active, onChange, onExpand }: MapFiltersProps) {
  return (
    <View style={styles.wrap}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {FILTERS.map((f) => (
          <Pressable
            key={f.id}
            onPress={() => onChange(f.id)}
            style={[styles.chip, active === f.id && styles.chipActive]}
            accessibilityRole="button"
            accessibilityState={{ selected: active === f.id }}
          >
            <Text style={[styles.chipText, active === f.id && styles.chipTextActive]}>{f.label}</Text>
          </Pressable>
        ))}
        {onExpand ? (
          <Pressable onPress={onExpand} style={styles.chip} accessibilityRole="button">
            <Text style={styles.chipText}>More filters</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingVertical: 8 },
  row: { gap: 8, paddingHorizontal: 16 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.control,
    backgroundColor: 'rgba(20,21,24,0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  chipActive: {
    backgroundColor: colors.electricIndigo,
    borderColor: colors.electricIndigo,
  },
  chipText: { ...typography.caption, color: colors.warmWhite, fontWeight: '500' },
  chipTextActive: { color: colors.white },
});
