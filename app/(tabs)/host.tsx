import React from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { WebNavBar } from '@/components/layout/WebNavBar';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusIndicator } from '@/components/ui/StatusIndicator';
import { TestModeBanner } from '@/components/ui/TestModeBanner';
import { colors, typography } from '@/constants/theme';
import { useAuth } from '@/lib/auth/AuthProvider';
import { supabase } from '@/lib/auth/supabase';
import { HostRequestCard } from '@/features/hosting/HostRequestCard';
import { pauseCharger, resumeCharger } from '@/lib/trust/reports';

export default function HostScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();

  const { data: chargers = [], isLoading } = useQuery({
    queryKey: ['host-chargers', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chargers')
        .select('*')
        .eq('host_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: Boolean(user),
  });

  const { data: pendingRequests } = useQuery({
    queryKey: ['host-requests', user?.id],
    queryFn: async () => {
      const ids = chargers.map((c) => c.id);
      if (!ids.length) return [];
      const { data } = await supabase
        .from('bookings')
        .select('*, profiles:driver_id(display_name), chargers(name)')
        .in('charger_id', ids)
        .eq('status', 'requested')
        .order('created_at', { ascending: false });
      return data ?? [];
    },
    enabled: Boolean(user) && chargers.length > 0,
  });

  const { data: stats } = useQuery({
    queryKey: ['host-stats', user?.id],
    queryFn: async () => {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      const ids = chargers.map((c) => c.id);
      if (!ids.length) return { sessions: 0, earnings: 0, kwh: 0 };
      const { data } = await supabase
        .from('bookings')
        .select('final_cost, requested_kwh')
        .in('charger_id', ids)
        .eq('status', 'completed')
        .gte('updated_at', startOfMonth.toISOString());
      const sessions = data?.length ?? 0;
      const earnings = data?.reduce((s, b) => s + (b.final_cost ?? 0), 0) ?? 0;
      const kwh = data?.reduce((s, b) => s + (b.requested_kwh ?? 0), 0) ?? 0;
      return { sessions, earnings, kwh };
    },
    enabled: Boolean(user) && chargers.length > 0,
  });

  const connectStripe = async () => {
    try {
      const { createConnectOnboardingLink } = await import('@/lib/payments/stripe');
      const url = await createConnectOnboardingLink();
      const { openBrowserAsync } = await import('expo-web-browser');
      await openBrowserAsync(url);
    } catch (e) {
      Alert.alert('Stripe', e instanceof Error ? e.message : 'Could not start Connect onboarding. Deploy the stripe function and set STRIPE_SECRET_KEY.');
    }
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <WebNavBar />
        <EmptyState title="Host a charger" description="Sign in to list your charger and earn from unused capacity." actionLabel="Sign in" onAction={() => router.push('/(auth)/sign-in')} />
      </View>
    );
  }

  if (isLoading) return <ActivityIndicator style={{ flex: 1 }} color={colors.electricIndigo} />;

  if (!chargers.length) {
    return (
      <View style={styles.container}>
        <WebNavBar />
        <EmptyState
          title="Share your charger"
          description="Turn unused home charging into a trusted local resource."
          actionLabel="Get started"
          onAction={() => router.push('/host/onboarding')}
        />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <WebNavBar />
      <Text style={styles.header}>Your chargers</Text>
      <TestModeBanner />
      <Text style={styles.statsLine}>
        This month · {stats?.sessions ?? 0} sessions · ${(stats?.earnings ?? 0).toFixed(2)} · {(stats?.kwh ?? 0).toFixed(0)} kWh
      </Text>
      {chargers.map((charger) => (
        <View key={charger.id} style={styles.card}>
          <StatusIndicator state={charger.availability_state} />
          <Text style={styles.chargerName}>{charger.name}</Text>
          <Text style={styles.meta}>
            {charger.neighborhood ?? 'Neighborhood hidden'} · {charger.status === 'paused' ? 'Paused' : 'Live'}
          </Text>
          <Button title="Edit listing" variant="secondary" onPress={() => router.push(`/host/onboarding?chargerId=${charger.id}`)} />
          {charger.status === 'paused' ? (
            <Button
              title="Resume listing"
              variant="secondary"
              onPress={async () => {
                await resumeCharger(charger.id);
                qc.invalidateQueries({ queryKey: ['host-chargers'] });
              }}
            />
          ) : (
            <Button
              title="Pause listing"
              variant="ghost"
              onPress={async () => {
                await pauseCharger(charger.id);
                qc.invalidateQueries({ queryKey: ['host-chargers'] });
              }}
            />
          )}
        </View>
      ))}
      <Button title="List another charger" variant="secondary" onPress={() => router.push('/host/onboarding')} />
      <Button title="Connect Stripe (test)" variant="secondary" onPress={connectStripe} />
      <Text style={styles.sectionTitle}>Pending requests</Text>
      {(pendingRequests ?? []).length === 0 ? (
        <Text style={styles.emptyRequests}>No pending requests</Text>
      ) : (
        pendingRequests?.map((b: any) => <HostRequestCard key={b.id} booking={b} />)
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.warmWhite },
  content: { padding: 24, gap: 16 },
  header: { ...typography.display, color: colors.graphite },
  card: { gap: 8, padding: 16, borderWidth: 1, borderColor: colors.border, borderRadius: 16 },
  chargerName: { ...typography.title, color: colors.graphite },
  meta: { ...typography.caption, color: colors.neutralGray },
  statsLine: { ...typography.body, color: colors.graphite },
  sectionTitle: { ...typography.title, color: colors.graphite, marginTop: 8 },
  emptyRequests: { ...typography.body, color: colors.neutralGray },
});
