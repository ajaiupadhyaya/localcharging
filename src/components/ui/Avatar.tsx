import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { colors, typography } from '@/constants/theme';

interface AvatarProps {
  uri?: string | null;
  name?: string | null;
  size?: number;
}

export function Avatar({ uri, name, size = 40 }: AvatarProps) {
  const initials = (name ?? '?').slice(0, 1).toUpperCase();
  if (uri) {
    return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} />;
  }
  return (
    <View style={[styles.fallback, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.initials, { fontSize: size * 0.4 }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: { ...typography.label, color: colors.graphite, fontWeight: '600' },
});
