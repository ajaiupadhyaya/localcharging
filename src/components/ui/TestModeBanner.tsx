import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, typography } from '@/constants/theme';
import { isStripeTestMode } from '@/lib/payments/platformFee';

export function TestModeBanner() {
  if (!isStripeTestMode()) return null;
  return (
    <View style={styles.banner} accessibilityRole="text">
      <Text style={styles.text}>Test mode — no real charges</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: 'rgba(217, 119, 6, 0.12)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  text: { ...typography.caption, color: colors.warning, fontWeight: '600' },
});
