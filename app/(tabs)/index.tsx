import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MapShell } from '@/features/map/MapShell';
import { WebNavBar } from '@/components/layout/WebNavBar';

export default function MapScreen() {
  return (
    <View style={styles.container}>
      <WebNavBar />
      <MapShell />
    </View>
  );
}

const styles = StyleSheet.create({ container: { flex: 1 } });
