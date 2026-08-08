import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { colors, typography } from '@/constants/theme';

export function WebNavBar() {
  if (Platform.OS !== 'web') return null;
  const router = useRouter();
  return (
    <View style={styles.bar}>
      <Text style={styles.logo}>ChargeLocal</Text>
      <View style={styles.links}>
        <Link href="/" asChild>
          <Pressable><Text style={styles.link}>Map</Text></Pressable>
        </Link>
        <Link href="/activity" asChild>
          <Pressable><Text style={styles.link}>Activity</Text></Pressable>
        </Link>
        <Link href="/host" asChild>
          <Pressable><Text style={styles.link}>Host</Text></Pressable>
        </Link>
        <Pressable onPress={() => router.push('/profile')}>
          <Text style={styles.link}>Profile</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: colors.graphite,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  logo: { ...typography.title, color: colors.warmWhite, fontWeight: '700' },
  links: { flexDirection: 'row', gap: 24 },
  link: { ...typography.body, color: colors.warmWhite },
});
