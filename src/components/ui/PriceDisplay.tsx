import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, typography } from '@/constants/theme';
import type { PricingType } from '@/types';
import { formatPrice } from '@/lib/pricing/estimate';

interface PriceDisplayProps {
  pricingType: PricingType;
  pricePerKwh?: number | null;
  pricePerSession?: number | null;
  pricePerHour?: number | null;
  estimatedTotal?: number | null;
}

export function PriceDisplay({
  pricingType,
  pricePerKwh,
  pricePerSession,
  pricePerHour,
  estimatedTotal,
}: PriceDisplayProps) {
  return (
    <View>
      <Text style={styles.primary}>
        {formatPrice(pricingType, { pricePerKwh, pricePerSession, pricePerHour })}
      </Text>
      {estimatedTotal != null && estimatedTotal > 0 ? (
        <Text style={styles.secondary}>Est. ${estimatedTotal.toFixed(2)}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  primary: { ...typography.title, color: colors.graphite },
  secondary: { ...typography.caption, color: colors.neutralGray, marginTop: 2 },
});
