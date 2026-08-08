import React from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { format, isToday, isYesterday } from 'date-fns';
import { WebNavBar } from '@/components/layout/WebNavBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { colors, typography } from '@/constants/theme';
import { useAuth } from '@/lib/auth/AuthProvider';
import { supabase } from '@/lib/auth/supabase';
import type { ActivityEvent } from '@/types';

function formatDay(dateStr: string) {
  const d = new Date(dateStr);
  if (isToday(d)) return 'TODAY';
  if (isYesterday(d)) return 'YESTERDAY';
  return format(d, 'MMM d').toUpperCase();
}

function eventTitle(event: ActivityEvent) {
  const map: Record<string, string> = {
    booking_requested: 'Request sent',
    booking_approved: 'Booking approved',
    booking_declined: 'Request declined',
    session_started: 'Charging started',
    session_completed: 'Session completed',
    booking_cancelled: 'Booking cancelled',
  };
  return map[event.event_type] ?? event.event_type.replace(/_/g, ' ');
}

export default function ActivityScreen() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ['activity', user?.id],
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from('activity_events')
        .select('*')
        .eq('actor_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return rows as ActivityEvent[];
    },
    enabled: Boolean(user),
  });

  if (!user) {
    return (
      <View style={styles.container}>
        <WebNavBar />
        <EmptyState title="Your charging history" description="Sign in to see requests, sessions, and approvals." />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebNavBar />
      <Text style={styles.header}>Activity</Text>
      {isLoading ? (
        <ActivityIndicator color={colors.electricIndigo} style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <EmptyState
              title="Nothing yet"
              description="When you request a charge or host a session, it will show up here."
            />
          }
          renderItem={({ item, index }) => {
            const prev = data?.[index - 1];
            const showDay = !prev || formatDay(prev.created_at) !== formatDay(item.created_at);
            return (
              <View>
                {showDay ? <Text style={styles.day}>{formatDay(item.created_at)}</Text> : null}
                <View style={styles.row}>
                  <Text style={styles.time}>{format(new Date(item.created_at), 'h:mm a')}</Text>
                  <View>
                    <Text style={styles.eventTitle}>{eventTitle(item)}</Text>
                    {item.metadata?.charger_name ? (
                      <Text style={styles.eventMeta}>{String(item.metadata.charger_name)}</Text>
                    ) : null}
                  </View>
                </View>
              </View>
            );
          }}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.warmWhite },
  header: { ...typography.display, color: colors.graphite, padding: 24, paddingBottom: 8 },
  list: { paddingHorizontal: 24, paddingBottom: 32 },
  day: { ...typography.label, color: colors.neutralGray, marginTop: 16, marginBottom: 8 },
  row: { flexDirection: 'row', gap: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  time: { ...typography.caption, color: colors.neutralGray, width: 72 },
  eventTitle: { ...typography.body, color: colors.graphite, fontWeight: '500' },
  eventMeta: { ...typography.caption, color: colors.neutralGray },
});
