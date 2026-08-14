import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { WebNavBar } from '@/components/layout/WebNavBar';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { TestModeBanner } from '@/components/ui/TestModeBanner';
import { colors, typography } from '@/constants/theme';
import { useAuth } from '@/lib/auth/AuthProvider';
import { deleteAccount } from '@/lib/auth/account';
import { supabase } from '@/lib/auth/supabase';
import type { ConnectorType } from '@/types';

export default function ProfileScreen() {
  const { user, profile, signOut } = useAuth();
  const router = useRouter();
  const [make, setMake] = useState('Tesla');
  const [model, setModel] = useState('Model 3');
  const [kwh, setKwh] = useState('75');
  const [connector, setConnector] = useState<ConnectorType>('nacs');
  const [vehicleId, setVehicleId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('vehicles')
      .select('*')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        setVehicleId(data.id);
        setMake(data.make);
        setModel(data.model);
        setKwh(String(data.battery_capacity_kwh ?? 75));
        setConnector((data.connector_types?.[0] as ConnectorType) ?? 'nacs');
      });
  }, [user]);

  const saveVehicle = async () => {
    if (!user) return;
    setSaving(true);
    const row = {
      user_id: user.id,
      make,
      model,
      connector_types: [connector],
      battery_capacity_kwh: Number(kwh) || 75,
      nickname: 'Daily',
    };
    const { error } = vehicleId
      ? await supabase.from('vehicles').update(row).eq('id', vehicleId)
      : await supabase.from('vehicles').insert(row);
    setSaving(false);
    if (error) Alert.alert('Vehicle', error.message);
    else Alert.alert('Saved', 'Your vehicle is used for energy estimates.');
  };

  const onDeleteAccount = () => {
    Alert.alert(
      'Delete account',
      'This permanently deletes your account and data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAccount();
              await signOut();
            } catch (e) {
              Alert.alert('Error', e instanceof Error ? e.message : 'Could not delete account');
            }
          },
        },
      ],
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <WebNavBar />
      <Text style={styles.header}>Profile</Text>
      <TestModeBanner />
      {user ? (
        <View style={styles.card}>
          <Avatar uri={profile?.avatar_url} name={profile?.display_name} size={56} />
          <Text style={styles.name}>{profile?.display_name ?? user.email}</Text>
          <Text style={styles.role}>{profile?.role ?? 'driver'}</Text>
          <Button title="Sign out" variant="secondary" onPress={signOut} fullWidth />
        </View>
      ) : (
        <Button title="Sign in" onPress={() => router.push('/(auth)/sign-in')} fullWidth />
      )}
      {user ? (
        <View style={styles.card}>
          <Text style={styles.section}>Your vehicle</Text>
          <TextField label="Make" value={make} onChangeText={setMake} />
          <TextField label="Model" value={model} onChangeText={setModel} />
          <TextField label="Usable battery (kWh)" value={kwh} onChangeText={setKwh} keyboardType="decimal-pad" />
          <TextField label="Connector (j1772, nacs, ccs)" value={connector} onChangeText={(v) => setConnector(v as ConnectorType)} />
          <Button title="Save vehicle" onPress={saveVehicle} loading={saving} fullWidth />
        </View>
      ) : null}
      <View style={styles.links}>
        <Button title="Terms" variant="ghost" onPress={() => router.push('/legal/terms')} />
        <Button title="Privacy" variant="ghost" onPress={() => router.push('/legal/privacy')} />
        <Button title="Safety" variant="ghost" onPress={() => router.push('/legal/safety')} />
      </View>
      {profile?.role === 'admin' ? (
        <Button title="Admin queue" variant="secondary" onPress={() => router.push('/admin')} />
      ) : null}
      {user ? (
        <Button title="Delete account" variant="danger" onPress={onDeleteAccount} fullWidth />
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.warmWhite },
  content: { padding: 24, gap: 16 },
  header: { ...typography.display, color: colors.graphite },
  card: { gap: 12, alignItems: 'stretch' },
  name: { ...typography.title, color: colors.graphite },
  role: { ...typography.caption, color: colors.neutralGray, textTransform: 'capitalize' },
  section: { ...typography.title, color: colors.graphite },
  links: { gap: 4 },
});
