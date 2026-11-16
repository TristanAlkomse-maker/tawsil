// بطاقة منتج في صفحة المتجر. المنتج النافد باهت ومعطّل وعليه كلمة "نفد".
// زر الإضافة السريعة (+) يظهر فقط إذا مرّرت الشاشة onAdd، أي إذا كان المتجر مفتوحًا.
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Picture } from '@/components/Picture';
import { formatMoney } from '@/lib/money';
import { card, colors, fonts, radius, shadows } from '@/theme';

export type Product = {
  id: string;
  name_ar: string;
  description_ar: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
};

// hint: اسم المتجر ووصفه، تُختار منهما الصورة الافتراضية إن لم يدل اسم المنتج على نوعه
type Props = { product: Product; hint?: string; onPress: () => void; onAdd?: () => void };

export function ProductRow({ product, hint, onPress, onAdd }: Props) {
  const { t } = useTranslation();

  return (
    <Pressable
      style={({ pressed }) => [styles.row, !product.is_available && styles.dim, pressed && styles.pressed]}
      onPress={onPress}
      disabled={!product.is_available}
      accessibilityRole="button"
    >
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>
          {product.name_ar}
        </Text>
        {!!product.description_ar && (
          <Text style={styles.secondary} numberOfLines={2}>
            {product.description_ar}
          </Text>
        )}
        <Text style={styles.price}>{formatMoney(product.price)}</Text>
      </View>
      <View>
        <Picture source={product.image_url} name={product.name_ar} hint={hint} style={styles.image} size={42} />
        {!product.is_available && (
          <View style={styles.soldOutWrap}>
            <Text style={styles.soldOut}>{t('browse.soldOut')}</Text>
          </View>
        )}
        {/* الزر يركب على زاوية الصورة. hitSlop يوسّع مساحة اللمس إلى 44 نقطة */}
        {product.is_available && onAdd && (
          <Pressable
            style={({ pressed }) => [styles.add, pressed && styles.addPressed]}
            onPress={onAdd}
            hitSlop={6}
            accessibilityLabel={t('cart.addItem', { name: product.name_ar })}
          >
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={colors.text} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M12 5v14M5 12h14" />
            </Svg>
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { ...card, flexDirection: 'row', gap: 12, alignItems: 'center', padding: 12, marginTop: 10 },
  pressed: { opacity: 0.9 },
  dim: { opacity: 0.6 },
  info: { flex: 1, gap: 4 },
  name: { fontFamily: fonts.bold, fontSize: 16, color: colors.text },
  secondary: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 20, color: colors.textSecondary },
  // السعر يُقرأ من اليسار إلى اليمين (القسم 7)
  price: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.primaryDark,
    writingDirection: 'ltr',
    textAlign: 'right',
    marginTop: 2,
  },
  image: { width: 92, height: 92, borderRadius: radius.md },
  soldOutWrap: {
    position: 'absolute',
    bottom: 6,
    alignSelf: 'center',
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  soldOut: { fontFamily: fonts.bold, fontSize: 12, color: colors.dangerDark },
  add: {
    position: 'absolute',
    bottom: -6,
    left: -6,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
  addPressed: { transform: [{ scale: 0.9 }] },
});
