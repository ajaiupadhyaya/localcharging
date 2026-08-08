import React from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useChargerDetail } from '@/hooks/useNearbyChargers';
import { StatusIndicator } from '@/components/ui/StatusIndicator';
import { PriceDisplay } from '@/components/ui/PriceDisplay';
import { colors, typography } from '@/constants/theme';

export default function ChargerDetailScreen() {
  const { id, source } = useLocalSearchParams<{ id: string; source?: string }>();
  const { data: charger } = useChargerDetail(id);

  if (!charger) return null;

  const isPublic = source === 'public';

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{charger.name}</Text>
      {isPublic ? (
        <Text style={styles.attribution}>Data © Open Charge Map contributors</Text>
      ) : null}
      <StatusIndicator state={charger.availability_state} />
      {!isPublic ? (
        <PriceDisplay
          pricingType={charger.pricing_type}
          pricePerKwh={charger.price_per_kwh}
          pricePerSession={charger.price_per_session}
          pricePerHour={charger.price_per_hour}
        />
      ) : null}
      {charger.parking_instructions ? (
        <Text style={styles.body}>{charger.parking_instructions}</Text>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, gap: 12, backgroundColor: colors.warmWhite },
  title: { ...typography.display, color: colors.graphite },
  attribution: { ...typography.caption, color: colors.neutralGray },
  body: { ...typography.body, color: colors.graphite },
});
