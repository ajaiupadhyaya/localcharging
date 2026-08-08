import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { colors, typography } from '@/constants/theme';
import type { Booking, ChargingSession } from '@/types';

interface ActiveChargingPanelProps {
  booking: Booking;
  session: ChargingSession | null | undefined;
  onEnd: () => void;
}

export function ActiveChargingPanel({ booking, session, onEnd }: ActiveChargingPanelProps) {
  const [progress, setProgress] = useState(booking.start_soc ?? 24);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => Math.min(booking.target_soc ?? 80, p + 0.5));
    }, 3000);
    return () => clearInterval(interval);
  }, [booking.target_soc]);

  const isEstimate = !session || session.telemetry_source === 'estimate';

  return (
    <View style={styles.panel}>
      <Text style={styles.label}>CHARGING{isEstimate ? ' (estimated)' : ''}</Text>
      <Text style={styles.soc}>{Math.round(progress)}%</Text>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${progress}%` }]} />
      </View>
      <Text style={styles.meta}>
        ~{(booking.requested_kwh ?? 0) * (progress / 100)} kWh · ~${booking.estimated_cost?.toFixed(2)}
      </Text>
      <Text style={styles.power}>Power · ~11.2 kW (estimate)</Text>
      <Button title="End session" variant="secondary" onPress={onEnd} fullWidth />
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { gap: 8, padding: 16, borderWidth: 1, borderColor: colors.border, borderRadius: 16 },
  label: { ...typography.label, color: colors.electricIndigo },
  soc: { ...typography.display, color: colors.graphite },
  barTrack: { height: 8, backgroundColor: colors.border, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: colors.electricIndigo },
  meta: { ...typography.body, color: colors.graphite },
  power: { ...typography.caption, color: colors.neutralGray },
});
