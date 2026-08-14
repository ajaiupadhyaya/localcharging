import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radii, typography } from '@/constants/theme';
import type { ConnectorType, MapFilter, MapFilters } from '@/types';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';

const FILTERS: { id: MapFilter; label: string }[] = [
  { id: 'any', label: 'Any' },
  { id: 'residential', label: 'Residential' },
  { id: 'public', label: 'Public' },
  { id: 'fast', label: 'Fast' },
  { id: 'available', label: 'Available now' },
];

const CONNECTORS: ConnectorType[] = ['j1772', 'nacs', 'ccs', 'chademo'];

interface MapFiltersProps {
  filters: MapFilters;
  onChange: (next: MapFilters) => void;
}

export function MapFiltersBar({ filters, onChange }: MapFiltersProps) {
  const [open, setOpen] = useState(false);
  const [maxPrice, setMaxPrice] = useState(filters.maxPrice != null ? String(filters.maxPrice) : '');

  return (
    <View style={styles.wrap}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {FILTERS.map((f) => (
          <Pressable
            key={f.id}
            onPress={() => onChange({ ...filters, category: f.id })}
            style={[styles.chip, filters.category === f.id && styles.chipActive]}
            accessibilityRole="button"
            accessibilityState={{ selected: filters.category === f.id }}
          >
            <Text style={[styles.chipText, filters.category === f.id && styles.chipTextActive]}>{f.label}</Text>
          </Pressable>
        ))}
        <Pressable onPress={() => setOpen(true)} style={styles.chip} accessibilityRole="button" accessibilityLabel="More filters">
          <Text style={styles.chipText}>More filters</Text>
        </Pressable>
      </ScrollView>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => undefined}>
            <Text style={styles.sheetTitle}>Filters</Text>
            <Text style={styles.sheetLabel}>Connector</Text>
            <View style={styles.wrapRow}>
              {CONNECTORS.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => onChange({ ...filters, connector: filters.connector === c ? undefined : c })}
                  style={[styles.chipLight, filters.connector === c && styles.chipActive]}
                >
                  <Text style={[styles.chipLightText, filters.connector === c && styles.chipTextActive]}>{c.toUpperCase()}</Text>
                </Pressable>
              ))}
            </View>
            <TextField
              label="Max price (driver total, $)"
              value={maxPrice}
              onChangeText={setMaxPrice}
              keyboardType="decimal-pad"
            />
            <Pressable
              onPress={() => onChange({ ...filters, instantApproval: !filters.instantApproval })}
              style={[styles.chipLight, filters.instantApproval && styles.chipActive]}
            >
              <Text style={[styles.chipLightText, filters.instantApproval && styles.chipTextActive]}>Instant approval only</Text>
            </Pressable>
            <Button
              title="Apply"
              onPress={() => {
                const n = Number(maxPrice);
                onChange({ ...filters, maxPrice: Number.isFinite(n) && n > 0 ? n : undefined });
                setOpen(false);
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingVertical: 8 },
  row: { gap: 8, paddingHorizontal: 16 },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.control,
    backgroundColor: 'rgba(20,21,24,0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  chipLight: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.control,
    borderWidth: 1,
    borderColor: colors.border,
    alignSelf: 'flex-start',
  },
  chipActive: {
    backgroundColor: colors.electricIndigo,
    borderColor: colors.electricIndigo,
  },
  chipText: { ...typography.caption, color: colors.warmWhite, fontWeight: '500' },
  chipLightText: { ...typography.caption, color: colors.graphite, fontWeight: '500' },
  chipTextActive: { color: colors.white },
  backdrop: { flex: 1, backgroundColor: 'rgba(20,21,24,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.warmWhite,
    padding: 20,
    gap: 12,
    borderTopLeftRadius: radii.sheetLg,
    borderTopRightRadius: radii.sheetLg,
  },
  sheetTitle: { ...typography.title, color: colors.graphite },
  sheetLabel: { ...typography.label, color: colors.neutralGray },
});
