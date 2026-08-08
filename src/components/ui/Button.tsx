import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  PressableProps,
  StyleSheet,
  Text,
  TextStyle,
  ViewStyle,
} from 'react-native';
import { colors, radii, typography } from '@/constants/theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps extends PressableProps {
  title: string;
  variant?: Variant;
  loading?: boolean;
  fullWidth?: boolean;
}

const variantStyles: Record<Variant, { container: ViewStyle; text: TextStyle }> = {
  primary: {
    container: { backgroundColor: colors.electricIndigo },
    text: { color: colors.white },
  },
  secondary: {
    container: { backgroundColor: colors.warmWhite, borderWidth: 1, borderColor: colors.border },
    text: { color: colors.graphite },
  },
  ghost: {
    container: { backgroundColor: 'transparent' },
    text: { color: colors.electricIndigo },
  },
  danger: {
    container: { backgroundColor: colors.danger },
    text: { color: colors.white },
  },
};

export function Button({
  title,
  variant = 'primary',
  loading,
  fullWidth,
  disabled,
  style,
  ...props
}: ButtonProps) {
  const v = variantStyles[variant];
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        v.container,
        fullWidth && styles.fullWidth,
        (disabled || loading) && styles.disabled,
        pressed && styles.pressed,
        style as ViewStyle,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={v.text.color as string} />
      ) : (
        <Text style={[styles.label, v.text]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.control,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  fullWidth: { width: '100%' },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.85 },
  label: { ...typography.body, fontWeight: '600' },
});
