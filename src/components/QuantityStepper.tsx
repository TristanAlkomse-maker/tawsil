// عدّاد الكمية (+ العدد −) في كبسولة واحدة. يُستعمل في السلة وفي تفاصيل المنتج.
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { colors, fonts, radius } from '@/theme';

type Props = {
  quantity: number;
  onIncrease: () => void;
  onDecrease: () => void;
  canIncrease?: boolean;
  canDecrease?: boolean;
  large?: boolean; // الحجم الأكبر في شاشة المنتج
};

export function QuantityStepper({ quantity, onIncrease, onDecrease, canIncrease = true, canDecrease = true, large }: Props) {
  const { t } = useTranslation();
  const icon = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: colors.text, strokeWidth: 2.4, strokeLinecap: 'round' } as const;

  return (
    <View style={styles.pill}>
      <Pressable
        style={({ pressed }) => [styles.step, styles.plus, pressed && styles.pressed, !canIncrease && styles.disabled]}
        onPress={onIncrease}
        disabled={!canIncrease}
        accessibilityRole="button"
        accessibilityLabel={t('browse.increase')}
      >
        <Svg {...icon}>
          <Path d="M12 5v14M5 12h14" />
        </Svg>
      </Pressable>
      <Text style={[styles.quantity, large && styles.quantityLarge]}>{quantity}</Text>
      <Pressable
        style={({ pressed }) => [styles.step, pressed && styles.pressed, !canDecrease && styles.disabled]}
        onPress={onDecrease}
        disabled={!canDecrease}
        accessibilityRole="button"
        accessibilityLabel={t('browse.decrease')}
      >
        <Svg {...icon}>
          <Path d="M5 12h14" />
        </Svg>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutralSoft,
    borderRadius: radius.pill,
    padding: 4,
  },
  // 44 نقطة: أصغر مساحة لمس مريحة
  step: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plus: { backgroundColor: colors.primary },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.4 },
  quantity: { fontFamily: fonts.bold, fontSize: 16, color: colors.text, minWidth: 36, textAlign: 'center' },
  quantityLarge: { fontSize: 20, minWidth: 56 },
});
