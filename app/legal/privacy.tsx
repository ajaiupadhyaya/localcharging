import React from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { colors, typography } from '@/constants/theme';

export default function PrivacyScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Privacy Policy</Text>
      <Text style={styles.body}>
        ChargeLocal collects account email, location when in use, listing photos, and booking activity. Exact home
        addresses are hidden until a booking is approved. We do not sell personal data. Payment processing is handled
        by Stripe. Push tokens are stored to deliver booking notifications.
      </Text>
      <Text style={styles.section}>Data we collect</Text>
      <Text style={styles.body}>• Email and profile information{'\n'}• Approximate and exact location (context-dependent){'\n'}• Photos you upload{'\n'}• Booking and session history</Text>
      <Text style={styles.section}>Your choices</Text>
      <Text style={styles.body}>You may delete your account from Profile. Deletion removes profile data subject to legal retention requirements.</Text>
      <Text style={styles.note}>Obtain counsel review before App Store production privacy labels are finalized.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, backgroundColor: colors.warmWhite },
  title: { ...typography.display, color: colors.graphite, marginBottom: 16 },
  section: { ...typography.title, color: colors.graphite, marginTop: 16, marginBottom: 8 },
  body: { ...typography.body, color: colors.graphite, lineHeight: 24 },
  note: { ...typography.caption, color: colors.warning, marginTop: 24 },
});
