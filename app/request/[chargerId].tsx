import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { TestModeBanner } from '@/components/ui/TestModeBanner';
import { colors, typography } from '@/constants/theme';
import { useAuth } from '@/lib/auth/AuthProvider';
import { useChargerDetail } from '@/hooks/useNearbyChargers';
import { calculatePricing, estimateEnergyKwh } from '@/lib/pricing/estimate';
import { supabase } from '@/lib/auth/supabase';
import { AnalyticsEvents, track } from '@/lib/analytics/events';
import { fetchPlatformFeeRate } from '@/lib/payments/platformFee';
import { authorizeBookingPayment, notifyBooking } from '@/lib/payments/stripe';
import { confirmBookingPayment } from '@/lib/payments/confirmPayment';

function toLocalInput(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function roundToHour(d: Date) {
  const next = new Date(d);
  next.setMinutes(0, 0, 0);
  if (next <= d) next.setHours(next.getHours() + 1);
  return next;
}

export default function RequestChargeScreen() {
  const { chargerId } = useLocalSearchParams<{ chargerId: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const { data: charger } = useChargerDetail(chargerId, user?.id);
  const [message, setMessage] = useState('');
  const [startSoc, setStartSoc] = useState('24');
  const [targetSoc, setTargetSoc] = useState('80');
  const [startLocal, setStartLocal] = useState(() => toLocalInput(roundToHour(new Date())));
  const [hours, setHours] = useState('2');
  const [loading, setLoading] = useState(false);
  const [battery, setBattery] = useState(75);
  const [vehicleId, setVehicleId] = useState<string | null>(null);
  const [feeRate, setFeeRate] = useState(0.12);

  useEffect(() => {
    fetchPlatformFeeRate().then(setFeeRate);
  }, []);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('vehicles')
      .select('id, battery_capacity_kwh')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.battery_capacity_kwh) setBattery(Number(data.battery_capacity_kwh));
        if (data?.id) setVehicleId(data.id);
      });
  }, [user]);

  if (!user) {
    router.replace('/(auth)/sign-in');
    return null;
  }

  const start = Number(startSoc) || 24;
  const target = Number(targetSoc) || 80;
  const durationHours = Math.max(1, Number(hours) || 2);
  const kwh = estimateEnergyKwh(battery, start, target);
  const pricing = charger
    ? calculatePricing({
        pricingType: charger.pricing_type,
        pricePerKwh: charger.price_per_kwh,
        pricePerSession: charger.price_per_session,
        pricePerHour: charger.price_per_hour,
        requestedKwh: kwh,
        durationHours,
        platformFeeRate: feeRate,
      })
    : null;

  const applyPreset = (offsetHours: number) => {
    const d = roundToHour(new Date(Date.now() + offsetHours * 3600_000));
    setStartLocal(toLocalInput(d));
  };

  const submit = async () => {
    if (!charger) return;
    setLoading(true);
    const requestedStart = new Date(startLocal);
    const requestedEnd = new Date(requestedStart.getTime() + durationHours * 3600_000);
    const { data, error } = await supabase.rpc('create_booking', {
      p_charger_id: chargerId,
      p_vehicle_id: vehicleId,
      p_requested_start: requestedStart.toISOString(),
      p_requested_end: requestedEnd.toISOString(),
      p_start_soc: start,
      p_target_soc: target,
      p_requested_kwh: kwh,
      p_estimated_cost: pricing?.total ?? 0,
      p_driver_message: message || null,
    });
    if (error) {
      setLoading(false);
      Alert.alert('Could not send request', error.message);
      return;
    }

    const bookingId = data as string;
    if ((pricing?.total ?? 0) > 0) {
      try {
        const { clientSecret } = await authorizeBookingPayment(bookingId, pricing!.total);
        await confirmBookingPayment(clientSecret);
      } catch (e) {
        await supabase.rpc('transition_booking', { p_booking_id: bookingId, p_new_status: 'cancelled', p_reason: 'payment_failed' });
        setLoading(false);
        Alert.alert('Payment', e instanceof Error ? e.message : 'Could not authorize payment. Free listings skip this step.');
        return;
      }
    }

    track(AnalyticsEvents.BOOKING_REQUESTED, { charger_id: chargerId });
    notifyBooking(bookingId, 'booking_requested').catch(() => undefined);
    setLoading(false);
    router.replace(`/booking/${bookingId}`);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Can you charge here?</Text>
      <Text style={styles.subtitle}>{charger?.name ?? 'Charger'}</Text>
      <TestModeBanner />
      <View style={styles.presets}>
        <Button title="This evening" variant="secondary" onPress={() => applyPreset(0)} />
        <Button title="Tomorrow evening" variant="secondary" onPress={() => applyPreset(24)} />
      </View>
      <TextField label="Start (local)" value={startLocal} onChangeText={setStartLocal} />
      <TextField label="Duration (hours)" value={hours} onChangeText={setHours} keyboardType="numeric" />
      <TextField label="Current charge (%)" value={startSoc} onChangeText={setStartSoc} keyboardType="numeric" />
      <TextField label="Target charge (%)" value={targetSoc} onChangeText={setTargetSoc} keyboardType="numeric" />
      <Text style={styles.estimate}>
        ~{kwh} kWh · Est. ${pricing?.total.toFixed(2) ?? '0.00'}
        {pricing && pricing.total > 0 ? ` (includes platform fee)` : ' · free listing'}
      </Text>
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
  presets: { flexDirection: 'row', gap: 8 },
  estimate: { ...typography.body, fontWeight: '600', color: colors.graphite },
});
