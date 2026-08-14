import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth/AuthProvider';
import { reportCharger } from '@/lib/trust/reports';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { PriceDisplay } from '@/components/ui/PriceDisplay';
import { StatusIndicator } from '@/components/ui/StatusIndicator';
import { colors, radii, typography } from '@/constants/theme';
import type { MapCharger } from '@/types';

interface ChargerDetailSheetProps {
  charger: MapCharger | null;
  onClose: () => void;
}

export function ChargerDetailSheet({ charger, onClose }: ChargerDetailSheetProps) {
  const router = useRouter();
  const { user } = useAuth();
  if (!charger) return null;

  const isPublic = charger.source === 'public';
  const distanceMi = (charger.distance_m / 1609.34).toFixed(1);

  return (
    <View style={styles.sheet}>
      <View style={styles.handle} />
      <Pressable onPress={onClose} style={styles.closeHit} accessibilityLabel="Close" />
      {charger.photos?.[0] ? <Image source={{ uri: charger.photos[0] }} style={styles.hero} accessibilityLabel="Parking photo" /> : null}
      <Text style={styles.title}>{charger.name}</Text>
      <Text style={styles.meta}>
        {charger.rating ? `${charger.rating.toFixed(1)} ★ · ` : ''}
        {charger.completed_sessions > 0 ? `${charger.completed_sessions} sessions · ` : ''}
        ~{distanceMi} mi away
      </Text>
      <View style={styles.specRow}>
        <Text style={styles.spec}>{charger.max_kw} kW</Text>
        <Text style={styles.specDot}>·</Text>
        <Text style={styles.spec}>{charger.level.replace('_', ' ')}</Text>
        <Text style={styles.specDot}>·</Text>
        <Text style={styles.spec}>{charger.connector_type.toUpperCase()}</Text>
      </View>
      <StatusIndicator state={charger.availability_state} />
      {!isPublic ? (
        <PriceDisplay
          pricingType={charger.pricing_type}
          pricePerKwh={charger.price_per_kwh}
          pricePerSession={charger.price_per_session}
          pricePerHour={charger.price_per_hour}
        />
      ) : (
        <Text style={styles.publicNote}>Public infrastructure · Open Charge Map</Text>
      )}
      {charger.parking_instructions ? (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>PARKING</Text>
          <Text style={styles.sectionBody}>{charger.parking_instructions}</Text>
        </View>
      ) : null}
      {charger.host_display_name && !isPublic ? (
        <View style={styles.hostRow}>
          <Avatar uri={charger.host_avatar_url} name={charger.host_display_name} />
          <View>
            <Text style={styles.hostName}>{charger.host_display_name}</Text>
            <Text style={styles.hostMeta}>
              {charger.approval_mode === 'manual' ? 'Approval required' : 'Instant approval'}
            </Text>
          </View>
        </View>
      ) : null}
      {!isPublic ? (
        <>
          <Button
            title="Request a charge"
            fullWidth
            onPress={() => router.push(`/request/${charger.id}`)}
          />
          {user ? (
            <Button
              title="Report listing"
              variant="ghost"
              fullWidth
              onPress={() =>
                reportCharger(charger.id, user.id, 'misleading_listing', 'Reported from app')
              }
            />
          ) : null}
        </>
      ) : (
        <Button title="View details" variant="secondary" fullWidth onPress={() => router.push(`/charger/${charger.id}?source=public`)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    backgroundColor: colors.warmWhite,
    borderTopLeftRadius: radii.sheetLg,
    borderTopRightRadius: radii.sheetLg,
    padding: 20,
    paddingBottom: 32,
    gap: 12,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  hero: { width: '100%', height: 140, borderRadius: 12, backgroundColor: colors.border },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: 4,
  },
  closeHit: { position: 'absolute', top: 0, right: 0, width: 48, height: 48 },
  title: { ...typography.title, color: colors.graphite },
  meta: { ...typography.caption, color: colors.neutralGray },
  specRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  spec: { ...typography.body, color: colors.graphite, fontWeight: '500' },
  specDot: { color: colors.neutralGray },
  publicNote: { ...typography.caption, color: colors.neutralGray },
  section: { gap: 4 },
  sectionLabel: { ...typography.label, color: colors.neutralGray },
  sectionBody: { ...typography.body, color: colors.graphite },
  hostRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4 },
  hostName: { ...typography.body, fontWeight: '600', color: colors.graphite },
  hostMeta: { ...typography.caption, color: colors.neutralGray },
});
