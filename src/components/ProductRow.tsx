// سطر منتج في صفحة المتجر. المنتج النافد باهت ومعطّل وعليه كلمة "نفد".
// زر الإضافة السريعة (+) يظهر فقط إذا مرّرت الشاشة onAdd، أي إذا كان المتجر مفتوحًا.
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { formatMoney } from '@/lib/money';
import { colors, fonts } from '@/theme';

export type Product = {
  id: string;
  name_ar: string;
  description_ar: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
};

type Props = { product: Product; onPress: () => void; onAdd?: () => void };

export function ProductRow({ product, onPress, onAdd }: Props) {
  const { t } = useTranslation();

  return (
    <Pressable
      style={[styles.row, !product.is_available && styles.dim]}
      onPress={onPress}
      disabled={!product.is_available}
      accessibilityRole="button"
    >
      <View style={styles.info}>
        <Text style={styles.name}>{product.name_ar}</Text>
        {!!product.description_ar && (
          <Text style={styles.secondary}>{product.description_ar}</Text>
        )}
        <Text style={styles.price}>{formatMoney(product.price)}</Text>
      </View>
      <Image source={product.image_url} style={styles.image} />
      {!product.is_available && <Text style={styles.soldOut}>{t('browse.soldOut')}</Text>}
      {product.is_available && onAdd && (
        <Pressable
          style={styles.add}
          onPress={onAdd}
          accessibilityLabel={t('cart.addItem', { name: product.name_ar })}
        >
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={colors.text} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M12 5v14M5 12h14" />
          </Svg>
        </Pressable>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dim: { opacity: 0.6 },
  info: { flex: 1, gap: 4 },
  name: { fontFamily: fonts.bold, fontSize: 16, color: colors.text },
  secondary: { fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary },
  // السعر يُقرأ من اليسار إلى اليمين (القسم 7)
  price: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.text,
    writingDirection: 'ltr',
    textAlign: 'right',
  },
  image: { width: 64, height: 64, borderRadius: 12, backgroundColor: colors.placeholder },
  soldOut: { fontFamily: fonts.bold, fontSize: 13, color: colors.dangerDark },
  add: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
