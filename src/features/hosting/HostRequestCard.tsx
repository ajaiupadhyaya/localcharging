import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { colors, typography } from '@/constants/theme';
import { supabase } from '@/lib/auth/supabase';
import type { Booking } from '@/types';

interface HostRequestCardProps {
  booking: Booking & {
    profiles?: { display_name: string };
    chargers?: { name: string };
  };
}

export function HostRequestCard({ booking }: HostRequestCardProps) {
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const qc = useQueryClient();

  const approve = async () => {
    setLoading(true);
    const { error } = await supabase.rpc('approve_booking', { p_booking_id: booking.id });
    setLoading(false);
    if (error) Alert.alert('Error', error.message);
    else qc.invalidateQueries({ queryKey: ['host-requests'] });
  };

  const decline = async () => {
    setLoading(true);
    const { error } = await supabase.rpc('decline_booking', {
      p_booking_id: booking.id,
      p_host_response: response || null,
    });
    setLoading(false);
    if (error) Alert.alert('Error', error.message);
    else qc.invalidateQueries({ queryKey: ['host-requests'] });
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>New charging request</Text>
      <Text style={styles.body}>
        {booking.profiles?.display_name ?? 'Driver'} wants to charge
      </Text>
      <Text style={styles.meta}>Est. ${booking.estimated_cost?.toFixed(2)} · ~{booking.requested_kwh} kWh</Text>
      {booking.driver_message ? (
        <Text style={styles.message}>"{booking.driver_message}"</Text>
      ) : null}
      <TextField placeholder="Suggest another time or note…" value={response} onChangeText={setResponse} />
      <View style={styles.actions}>
        <Button title="Approve" onPress={approve} loading={loading} />
        <Button title="Decline" variant="secondary" onPress={decline} loading={loading} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    gap: 8,
    marginBottom: 12,
  },
  title: { ...typography.label, color: colors.neutralGray },
  body: { ...typography.body, fontWeight: '600', color: colors.graphite },
  meta: { ...typography.caption, color: colors.neutralGray },
  message: { ...typography.body, color: colors.graphite, fontStyle: 'italic' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 4 },
});
