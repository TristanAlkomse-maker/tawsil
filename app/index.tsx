// شاشة مؤقتة للمرحلة 1: تثبت أن الألوان والخط والترجمة و RTL تعمل.
// تُستبدل بالرئيسية الحقيقية في المرحلة 5.
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { useTranslation } from 'react-i18next';

import { colors, fonts } from '@/theme';

export default function Index() {
  const { t } = useTranslation();

  return (
    <View style={styles.screen}>
      <Svg width={84} height={84} viewBox="0 0 112 112">
        <Rect width={112} height={112} rx={28} fill={colors.primary} />
        <Path
          d="M62 22c-13.3 0-24 10.4-24 23.3C38 62.6 62 90 62 90s24-27.4 24-44.7C86 32.4 75.3 22 62 22z"
          fill={colors.surface}
        />
        <Circle cx={62} cy={45} r={9} fill={colors.primary} />
        <Path
          d="M18 40h12M14 54h16M20 68h12"
          stroke={colors.surface}
          strokeWidth={6}
          strokeLinecap="round"
        />
      </Svg>
      <Text style={styles.title}>{t('appName')}</Text>
      <Pressable style={styles.button}>
        <Text style={styles.buttonText}>{t('start')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 34,
    color: colors.text,
  },
  button: {
    alignSelf: 'stretch',
    height: 54,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  buttonText: {
    fontFamily: fonts.bold,
    fontSize: 17,
    color: colors.text,
  },
});
