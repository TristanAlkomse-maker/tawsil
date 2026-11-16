// زر التطبيق بثلاثة أشكال:
// primary = البرتقالي الرئيسي (نصه داكن لا أبيض بسبب قاعدة التباين في القسم 7)،
// outline = أبيض بإطار للأفعال الثانوية، danger = مثل outline بنص أحمر.
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { colors, fonts, radius, shadows } from '@/theme';

type Props = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean; // يعرض دائرة تحميل ويمنع الضغط
  variant?: 'primary' | 'outline' | 'danger';
  icon?: ReactNode;
};

export function Button({ title, onPress, disabled, loading, variant = 'primary', icon }: Props) {
  const primary = variant === 'primary';
  const off = disabled || loading;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        primary ? styles.primary : styles.outline,
        primary && !off && shadows.primary,
        pressed && styles.pressed,
        off && styles.disabled,
      ]}
      onPress={onPress}
      disabled={off}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!off, busy: !!loading }}
    >
      {loading ? (
        <ActivityIndicator color={colors.text} />
      ) : (
        <>
          {icon}
          <Text style={[styles.text, variant === 'danger' && styles.dangerText]}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 54,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 18,
  },
  primary: { backgroundColor: colors.primary },
  outline: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  // الزر ينكمش قليلًا تحت الإصبع
  pressed: { transform: [{ scale: 0.98 }], opacity: 0.9 },
  disabled: { opacity: 0.5 },
  text: { fontFamily: fonts.bold, fontSize: 17, color: colors.text },
  dangerText: { color: colors.danger },
});
