// الحالة الفارغة: أيقونة في دائرة برتقالية خفيفة، ثم الرسالة، ثم زر اختياري.
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg from 'react-native-svg';

import { colors, fonts } from '@/theme';

type Props = {
  icon: ReactNode; // مسارات SVG فقط (Path, Circle...) على لوحة 24×24
  message: string;
  action?: ReactNode;
};

export function EmptyState({ icon, message, action }: Props) {
  return (
    <View style={styles.box}>
      <View style={styles.circle}>
        <Svg width={40} height={40} viewBox="0 0 24 24" fill="none" stroke={colors.primaryDark} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
          {icon}
        </Svg>
      </View>
      <Text style={styles.message}>{message}</Text>
      {action && <View style={styles.action}>{action}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', gap: 16, paddingHorizontal: 32, paddingVertical: 48 },
  circle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: { fontFamily: fonts.medium, fontSize: 16, lineHeight: 26, color: colors.textSecondary, textAlign: 'center' },
  action: { alignSelf: 'stretch', marginTop: 8 },
});
