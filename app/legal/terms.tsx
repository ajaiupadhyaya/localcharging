import React from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { colors, typography } from '@/constants/theme';

export default function TermsScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Terms of Service</Text>
      <Text style={styles.body}>
        ChargeLocal connects EV drivers with residential hosts offering charging. By using ChargeLocal you agree to
        follow parking instructions, respect host property, and comply with local laws. Hosts are responsible for
        ensuring their listing complies with HOA, zoning, and electrical safety requirements. ChargeLocal is a
        marketplace platform and does not guarantee charger availability or electrical outcomes.
      </Text>
      <Text style={styles.note}>Professional legal review required before production launch.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, backgroundColor: colors.warmWhite },
  title: { ...typography.display, color: colors.graphite, marginBottom: 16 },
  body: { ...typography.body, color: colors.graphite, lineHeight: 24 },
  note: { ...typography.caption, color: colors.warning, marginTop: 24 },
});
