import React from 'react';
import { Linking, ScrollView, StyleSheet, Text } from 'react-native';
import { Button } from '@/components/ui/Button';
import { colors, typography } from '@/constants/theme';

export default function SafetyScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Safety</Text>
      <Text style={styles.body}>
        • Never share house interior photos{'\n'}
        • Exact address is revealed only after host approval{'\n'}
        • Report listings or users that feel unsafe{'\n'}
        • Cancel if instructions don't match reality{'\n'}
        • Hosts can pause listings instantly{'\n'}
        • In an emergency, contact local emergency services first
      </Text>
      <Text style={styles.section}>Emergency contact</Text>
      <Text style={styles.body}>
        ChargeLocal does not dispatch emergency responders. If you feel unsafe at a listing, leave and call local emergency services.
      </Text>
      <Button title="Call 911 (US)" variant="danger" onPress={() => Linking.openURL('tel:911')} />
      <Button title="Text 911 (where supported)" variant="secondary" onPress={() => Linking.openURL('sms:911')} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, backgroundColor: colors.warmWhite, gap: 16 },
  title: { ...typography.display, color: colors.graphite },
  section: { ...typography.title, color: colors.graphite, marginTop: 8 },
  body: { ...typography.body, color: colors.graphite, lineHeight: 28 },
});
