// حقل إدخال مع تسميته ورسالة خطئه. إطاره يصير برتقاليًا عند الكتابة وأحمر عند الخطأ.
import { useState } from 'react';
import { StyleSheet, Text, TextInput, type TextInputProps, View } from 'react-native';

import { colors, fonts, radius } from '@/theme';

type Props = TextInputProps & {
  label: string;
  error?: string;
  ltr?: boolean; // الأرقام وكلمة المرور تُكتب من اليسار إلى اليمين لكنها تُحاذى يمينًا
};

export function Input({ label, error, ltr, style, ...rest }: Props) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, ltr && styles.ltr, focused && styles.focused, !!error && styles.invalid, style]}
        placeholderTextColor={colors.textSecondary}
        accessibilityLabel={label}
        {...rest}
        onFocus={(e) => {
          setFocused(true);
          rest.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          rest.onBlur?.(e);
        }}
      />
      {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 6 },
  label: { fontFamily: fonts.bold, fontSize: 14, color: colors.text },
  input: {
    height: 54,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.text,
    textAlign: 'right',
  },
  ltr: { writingDirection: 'ltr' },
  focused: { borderColor: colors.primary },
  invalid: { borderColor: colors.danger },
  error: { fontFamily: fonts.regular, fontSize: 14, color: colors.danger },
});
