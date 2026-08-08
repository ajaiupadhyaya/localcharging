import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, typography } from '@/constants/theme';
import type { AvailabilityState } from '@/types';

const LABELS: Record<AvailabilityState, string> = {
  available: 'Available',
  request_required: 'Request required',
  pending_approval: 'Pending approval',
  reserved: 'Reserved',
  charging: 'Charging',
  temporarily_unavailable: 'Unavailable',
  offline: 'Offline',
  unknown: 'Unknown',
};

const COLORS: Partial<Record<AvailabilityState, string>> = {
  available: colors.success,
  request_required: colors.electricIndigo,
  charging: colors.electricIndigo,
  temporarily_unavailable: colors.warning,
  offline: colors.neutralGray,
  unknown: colors.neutralGray,
};

export function StatusIndicator({ state }: { state: AvailabilityState }) {
  const color = COLORS[state] ?? colors.neutralGray;
  return (
    <View style={styles.row} accessibilityLabel={`Status: ${LABELS[state]}`}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.text}>{LABELS[state]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  text: { ...typography.caption, color: colors.graphite, fontWeight: '500' },
});
