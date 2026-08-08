import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { WebNavBar } from '@/components/layout/WebNavBar';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { colors, typography } from '@/constants/theme';
import { useAuth } from '@/lib/auth/AuthProvider';
import { deleteAccount } from '@/lib/auth/account';

export default function ProfileScreen() {
  const { user, profile, signOut } = useAuth();
  const router = useRouter();

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
      {process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY?.includes('test') ? (
        <Text style={styles.testBanner}>Payments in test mode — no real charges</Text>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.warmWhite },
  content: { padding: 24, gap: 16 },
  header: { ...typography.display, color: colors.graphite },
  card: { gap: 12, alignItems: 'flex-start' },
  name: { ...typography.title, color: colors.graphite },
  role: { ...typography.caption, color: colors.neutralGray, textTransform: 'capitalize' },
  links: { gap: 4 },
  testBanner: { ...typography.caption, color: colors.warning, marginTop: 8 },
});
