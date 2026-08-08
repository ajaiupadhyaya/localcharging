import React from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { colors, typography } from '@/constants/theme';
import { useAuth } from '@/lib/auth/AuthProvider';
import { supabase } from '@/lib/auth/supabase';

export default function AdminScreen() {
  const { profile } = useAuth();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-reports'],
    queryFn: async () => {
      const { data: rows } = await supabase
        .from('charger_reports')
        .select('*, chargers(name)')
        .eq('status', 'open')
        .order('created_at', { ascending: false });
      return rows ?? [];
    },
    enabled: profile?.role === 'admin',
  });

  if (profile?.role !== 'admin') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Admin</Text>
        <Text style={styles.body}>Admin access required.</Text>
      </View>
    );
  }

  const resolve = async (id: string) => {
    await supabase.from('charger_reports').update({ status: 'resolved', resolved_at: new Date().toISOString() }).eq('id', id);
    refetch();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Moderation queue</Text>
      {isLoading ? (
        <ActivityIndicator color={colors.electricIndigo} />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item: any) => item.id}
          renderItem={({ item }: any) => (
            <View style={styles.card}>
              <Text style={styles.reason}>{item.reason}</Text>
              <Text style={styles.body}>{item.description}</Text>
              <Text style={styles.meta}>{item.chargers?.name}</Text>
              <Button title="Resolve" variant="secondary" onPress={() => resolve(item.id)} />
            </View>
          )}
          ListEmptyComponent={<Text style={styles.body}>No open reports</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: colors.warmWhite },
  title: { ...typography.display, color: colors.graphite, marginBottom: 16 },
  body: { ...typography.body, color: colors.neutralGray },
  card: { padding: 16, borderWidth: 1, borderColor: colors.border, borderRadius: 16, marginBottom: 12, gap: 8 },
  reason: { ...typography.body, fontWeight: '600', color: colors.graphite },
  meta: { ...typography.caption, color: colors.neutralGray },
});
