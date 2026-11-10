// الزر البرتقالي الرئيسي (من ملف التصميم). نصه داكن لا أبيض بسبب قاعدة التباين في القسم 7.
import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, fonts } from '@/theme';

type Props = { title: string; onPress: () => void; disabled?: boolean };

export function Button({ title, onPress, disabled }: Props) {
  return (
    <Pressable
      style={[styles.button, disabled && styles.disabled]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
    >
      <Text style={styles.text}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 54,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  disabled: { opacity: 0.5 },
  text: { fontFamily: fonts.bold, fontSize: 17, color: colors.text },
});
