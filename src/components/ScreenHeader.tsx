// زر الرجوع وترويسة الشاشات الداخلية (رجوع + عنوان).
// السهم يشير لليمين لأن الواجهة من اليمين إلى اليسار.
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { colors, fonts, shadows } from '@/theme';

export function BackButton() {
  const { t } = useTranslation();
  return (
    <Pressable
      style={({ pressed }) => [styles.back, pressed && styles.pressed]}
      onPress={() => router.back()}
      accessibilityRole="button"
      accessibilityLabel={t('browse.back')}
    >
      <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={colors.text} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
        <Path d="M9 6l6 6-6 6" />
      </Svg>
    </Pressable>
  );
}

export function ScreenHeader({ title }: { title: string }) {
  return (
    <View style={styles.header}>
      <BackButton />
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, paddingBottom: 12 },
  back: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
  pressed: { opacity: 0.7 },
  title: { fontFamily: fonts.bold, fontSize: 20, color: colors.text, flex: 1 },
});
