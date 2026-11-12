// نسخة الويب من MapPicker. مكتبة react-native-maps لا تعمل في المتصفح، واستيرادها هناك يوقف الموقع كله
// (ومنه صفحة الإدارة في المرحلة 9). Expo يختار هذا الملف تلقائيًا على الويب، و MapPicker.tsx على الهاتف.
// على الويب لا دبوس، فيُحفظ العنوان دون إحداثيات (الدبوس اختياري في جدول addresses).
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts } from '@/theme';

export type Point = { lat: number; lng: number };

type Props = { onChange: (point: Point) => void };

export function MapPicker(_props: Props) {
  const { t } = useTranslation();
  return (
    <View style={styles.box}>
      <Text style={styles.text}>{t('addresses.mapPhoneOnly')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    height: 80,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.placeholder,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  text: { fontFamily: fonts.regular, fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
});
