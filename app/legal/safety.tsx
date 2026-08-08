import React from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { colors, typography } from '@/constants/theme';

export default function SafetyScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Safety</Text>
      <Text style={styles.body}>
        • Never share house interior photos{'\n'}• Exact address is revealed only after host approval{'\n'}• Report listings or users that feel unsafe{'\n'}• Cancel if instructions don't match reality{'\n'}• Hosts can pause listings instantly{'\n'}• In an emergency, contact local emergency services
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, backgroundColor: colors.warmWhite },
  title: { ...typography.display, color: colors.graphite, marginBottom: 16 },
  body: { ...typography.body, color: colors.graphite, lineHeight: 28 },
});
