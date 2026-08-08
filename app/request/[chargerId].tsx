import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { colors, typography } from '@/constants/theme';
import { useAuth } from '@/lib/auth/AuthProvider';
import { useChargerDetail } from '@/hooks/useNearbyChargers';
import { calculatePricing, estimateEnergyKwh } from '@/lib/pricing/estimate';
import { supabase } from '@/lib/auth/supabase';
import { AnalyticsEvents, track } from '@/lib/analytics/events';
import { PLATFORM_FEE_RATE } from '@/constants/theme';

export default function RequestChargeScreen() {
  const { chargerId } = useLocalSearchParams<{ chargerId: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const { data: charger } = useChargerDetail(chargerId, user?.id);
  const [message, setMessage] = useState('');
  const [startSoc, setStartSoc] = useState('24');
  const [targetSoc, setTargetSoc] = useState('80');
  const [loading, setLoading] = useState(false);

  if (!user) {
    router.replace('/(auth)/sign-in');
    return null;
  }

  const battery = 75;
  const start = Number(startSoc) || 24;
  const target = Number(targetSoc) || 80;
  const kwh = estimateEnergyKwh(battery, start, target);
  const pricing = charger
    ? calculatePricing({
        pricingType: charger.pricing_type,
        pricePerKwh: charger.price_per_kwh,
        pricePerSession: charger.price_per_session,
        pricePerHour: charger.price_per_hour,
        requestedKwh: kwh,
        durationHours: 2,
        platformFeeRate: PLATFORM_FEE_RATE,
      })
    : null;

  const submit = async () => {
    if (!charger) return;
    setLoading(true);
    const now = new Date();
    const end = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const { data, error } = await supabase.rpc('create_booking', {
      p_charger_id: chargerId,
      p_vehicle_id: null,
      p_requested_start: now.toISOString(),
      p_requested_end: end.toISOString(),
      p_start_soc: start,
      p_target_soc: target,
      p_requested_kwh: kwh,
      p_estimated_cost: pricing?.total ?? 0,
      p_driver_message: message || null,
    });
    setLoading(false);
    if (error) {
      Alert.alert('Could not send request', error.message);
      return;
    }
    track(AnalyticsEvents.BOOKING_REQUESTED, { charger_id: chargerId });
    router.replace(`/booking/${data}`);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Can you charge here?</Text>
      <Text style={styles.subtitle}>{charger?.name ?? 'Charger'}</Text>
      <Text style={styles.section}>Today · 2 hour window</Text>
      <TextField label="Current charge (%)" value={startSoc} onChangeText={setStartSoc} keyboardType="numeric" />
      <TextField label="Target charge (%)" value={targetSoc} onChangeText={setTargetSoc} keyboardType="numeric" />
      <Text style={styles.estimate}>~{kwh} kWh · Est. ${pricing?.total.toFixed(2) ?? '0.00'}</Text>
      <TextField
        label="Message (optional)"
        value={message}
        onChangeText={setMessage}
        placeholder="Hey — passing through and need enough charge to get home."
        multiline
      />
      <Button title="Send request" onPress={submit} loading={loading} fullWidth />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, gap: 12, backgroundColor: colors.warmWhite, flexGrow: 1 },
  title: { ...typography.display, color: colors.graphite },
  subtitle: { ...typography.title, color: colors.graphite },
  section: { ...typography.body, color: colors.neutralGray },
  estimate: { ...typography.body, fontWeight: '600', color: colors.graphite },
});
