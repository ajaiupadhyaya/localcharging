import React, { useEffect } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { colors, typography } from '@/constants/theme';
import { useAuth } from '@/lib/auth/AuthProvider';
import { supabase } from '@/lib/auth/supabase';
import { bookingStatusLabel, canSeePrivateLocation } from '@/lib/bookings/stateMachine';
import { ActiveChargingPanel } from '@/features/bookings/ActiveChargingPanel';
import { BookingMessages } from '@/features/messaging/BookingMessages';
import { cancelBookingPayment, captureBookingPayment, notifyBooking } from '@/lib/payments/stripe';
import { openInMaps } from '@/lib/maps/openInMaps';
import { blockUser, reportUser } from '@/lib/trust/reports';
import type { Booking, ChargingSession } from '@/types';

type BookingDetail = Booking & {
  host_id?: string;
  charger?: {
    name?: string;
    exact_address?: string | null;
    arrival_instructions?: string | null;
    access_instructions_private?: string | null;
    private_lat?: number | null;
    private_lng?: number | null;
    host_id?: string;
  };
};

export default function BookingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();

  const { data: booking, isLoading, refetch } = useQuery({
    queryKey: ['booking', id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_booking_detail', { p_booking_id: id });
      if (error) throw error;
      return data as BookingDetail;
    },
    enabled: Boolean(id),
  });

  const { data: session } = useQuery({
    queryKey: ['session', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('charging_sessions')
        .select('*')
        .eq('booking_id', id!)
        .maybeSingle();
      return data as ChargingSession | null;
    },
    enabled: Boolean(id) && booking?.status === 'charging',
  });

  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`booking-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings', filter: `id=eq.${id}` }, () => {
        refetch();
        qc.invalidateQueries({ queryKey: ['booking', id] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, refetch, qc]);

  if (isLoading || !booking) {
    return <ActivityIndicator style={{ flex: 1 }} color={colors.electricIndigo} />;
  }

  const charger = booking.charger;
  const showPrivate = canSeePrivateLocation(booking.status);
  const isHost = user?.id === booking.host_id || user?.id === charger?.host_id;
  const otherUserId = isHost ? booking.driver_id : booking.host_id ?? charger?.host_id;

  const transition = async (status: string, reason?: string) => {
    const { error } = await supabase.rpc('transition_booking', {
      p_booking_id: id,
      p_new_status: status,
      p_reason: reason ?? null,
    });
    if (error) Alert.alert('Could not update', error.message);
    if (status === 'cancelled' || status === 'no_show') {
      await cancelBookingPayment(id!).catch(() => undefined);
      notifyBooking(id!, 'booking_cancelled').catch(() => undefined);
    }
    refetch();
  };

  const startSession = async () => {
    await supabase.rpc('start_session', { p_booking_id: id, p_start_soc: booking.start_soc });
    refetch();
  };

  const endSession = async () => {
    const endSoc = Math.min(100, (booking.start_soc ?? 24) + 30);
    const energy = booking.requested_kwh ?? 20;
    const finalCost = booking.estimated_cost ?? 0;
    await supabase.rpc('end_session', {
      p_booking_id: id,
      p_end_soc: endSoc,
      p_energy_kwh: energy,
      p_final_cost: finalCost,
    });
    if (finalCost > 0) {
      await captureBookingPayment(id!, finalCost).catch(() => undefined);
    }
    refetch();
    router.push(`/booking/${id}/review`);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.status}>{bookingStatusLabel(booking.status)}</Text>
      <Text style={styles.title}>{charger?.name}</Text>
      {showPrivate && charger?.exact_address ? (
        <View style={styles.privateBlock}>
          <Text style={styles.label}>ADDRESS</Text>
          <Text style={styles.body}>{charger.exact_address}</Text>
          {charger.arrival_instructions ? (
            <>
              <Text style={styles.label}>ARRIVAL</Text>
              <Text style={styles.body}>{charger.arrival_instructions}</Text>
            </>
          ) : null}
          {charger.access_instructions_private ? (
            <>
              <Text style={styles.label}>ACCESS</Text>
              <Text style={styles.body}>{charger.access_instructions_private}</Text>
            </>
          ) : null}
          <Button
            title="Open in Maps"
            variant="secondary"
            onPress={() => openInMaps(charger.exact_address!, charger.private_lat, charger.private_lng)}
          />
        </View>
      ) : (
        <Text style={styles.hint}>Exact location unlocks after approval.</Text>
      )}
      {booking.status === 'approved' ? (
        <>
          <Button title="I'm on my way" onPress={() => transition('arriving')} fullWidth />
          <Button title="Check in" variant="secondary" onPress={() => transition('checked_in')} fullWidth />
        </>
      ) : null}
      {['checked_in', 'arriving', 'approved'].includes(booking.status) ? (
        <Button title="Start charging" onPress={startSession} fullWidth />
      ) : null}
      {booking.status === 'charging' ? (
        <ActiveChargingPanel booking={booking} session={session} onEnd={endSession} />
      ) : null}
      {booking.status === 'completed' ? (
        <Button title="Leave a review" onPress={() => router.push(`/booking/${id}/review`)} fullWidth />
      ) : null}
      {['requested', 'approved', 'arriving', 'checked_in'].includes(booking.status) ? (
        <Button title="Cancel booking" variant="ghost" onPress={() => transition('cancelled')} fullWidth />
      ) : null}
      {isHost && ['approved', 'arriving'].includes(booking.status) ? (
        <Button title="Mark no-show" variant="danger" onPress={() => transition('no_show')} fullWidth />
      ) : null}
      {otherUserId ? (
        <Button
          title="Report this person"
          variant="ghost"
          onPress={() => {
            if (!user) return;
            reportUser(otherUserId, user.id, 'safety', 'Reported from booking');
            Alert.alert('Reported', 'Thanks — we’ll review this.');
          }}
        />
      ) : null}
      {otherUserId && user ? (
        <Button
          title="Block this person"
          variant="ghost"
          onPress={async () => {
            await blockUser(user.id, otherUserId);
            Alert.alert('Blocked', 'You won’t see new requests from them.');
          }}
        />
      ) : null}
      <BookingMessages bookingId={id!} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, gap: 16, backgroundColor: colors.warmWhite },
  status: { ...typography.label, color: colors.electricIndigo },
  title: { ...typography.display, color: colors.graphite },
  hint: { ...typography.body, color: colors.neutralGray },
  privateBlock: { gap: 4, padding: 16, backgroundColor: colors.warmWhite, borderWidth: 1, borderColor: colors.border, borderRadius: 16 },
  label: { ...typography.label, color: colors.neutralGray },
  body: { ...typography.body, color: colors.graphite },
});
