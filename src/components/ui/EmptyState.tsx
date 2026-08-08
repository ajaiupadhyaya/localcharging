import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii, typography } from '@/constants/theme';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} style={styles.action} accessibilityRole="button">
          <Text style={styles.actionText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, alignItems: 'flex-start', gap: 8 },
  title: { ...typography.title, color: colors.graphite },
  description: { ...typography.body, color: colors.neutralGray },
  action: {
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: radii.control,
    backgroundColor: colors.electricIndigo,
  },
  actionText: { ...typography.body, color: colors.white, fontWeight: '600' },
});
