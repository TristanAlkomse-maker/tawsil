// تفاصيل المنتج (الشاشة 5): الصورة، الاسم، الوصف، السعر، عدّاد الكمية.
// زر "إضافة للسلة" يأخذ الكمية من العدّاد، ويتعطل إذا نفد المنتج أو أُغلق المتجر.
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Circle, Path } from 'react-native-svg';

import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { Picture } from '@/components/Picture';
import type { Product } from '@/components/ProductRow';
import { QuantityStepper } from '@/components/QuantityStepper';
import { BackButton } from '@/components/ScreenHeader';
import { formatMoney } from '@/lib/money';
import { MAX_QUANTITY, stepQuantity } from '@/lib/quantity';
import { supabase } from '@/lib/supabase';
import { addToCart } from '@/stores/cart';
import { colors, fonts, radius, shadows } from '@/theme';

// المنتج ومعه متجره: السلة تحتاج اسم المتجر وحدّه الأدنى، والزر يحتاج معرفة هل هو مفتوح
type ProductWithStore = Product & {
  stores: { id: string; name_ar: string; min_order: number; is_open: boolean };
};

export default function ProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  // undefined = ما زال يُحمّل، null = المنتج غير موجود
  const [product, setProduct] = useState<ProductWithStore | null | undefined>(undefined);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    supabase
      .from('products')
      .select('id, name_ar, description_ar, price, image_url, is_available, stores (id, name_ar, min_order, is_open)')
      .eq('id', id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) setError(true);
        else setProduct(data as ProductWithStore | null);
      });
  }, [id, attempt]);

  function retry() {
    setError(false);
    setProduct(undefined);
    setAttempt(attempt + 1);
  }

  const back = <BackButton />;

  if (error || !product) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.padded}>{back}</View>
        <View style={[styles.screen, styles.center]}>
          {error ? (
            <EmptyState
              icon={<Path d="M2 8.5a15 15 0 0120 0M5.5 12a10 10 0 0113 0M9 15.5a5 5 0 016 0M12 19h.01M3 3l18 18" />}
              message={t('errors.noConnection')}
              action={<Button title={t('errors.retry')} onPress={retry} />}
            />
          ) : product === null ? (
            <EmptyState icon={<><Circle cx={11} cy={11} r={7} /><Path d="M20 20l-4-4" /></>} message={t('browse.notFound')} />
          ) : (
            <ActivityIndicator size="large" color={colors.primary} />
          )}
        </View>
      </SafeAreaView>
    );
  }

  const canAdd = product.is_available && product.stores.is_open;

  return (
    <View style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View>
          <Picture source={product.image_url} name={product.name_ar} hint={product.stores.name_ar} style={styles.image} size={96} />
          <SafeAreaView edges={['top']} style={styles.backWrap}>
            {back}
          </SafeAreaView>
        </View>

        {/* ورقة بيضاء بزوايا مستديرة تصعد فوق أسفل الصورة */}
        <View style={styles.info}>
          <Text style={styles.name}>{product.name_ar}</Text>
          <Text style={styles.price}>{formatMoney(product.price)}</Text>
          {!!product.description_ar && <Text style={styles.secondary}>{product.description_ar}</Text>}
          {!product.is_available && <Text style={styles.soldOut}>{t('browse.soldOut')}</Text>}
        </View>
      </ScrollView>

      {/* العدّاد والزر ثابتان في الأسفل، فيبقيان في متناول الإبهام */}
      <SafeAreaView edges={['bottom']} style={styles.footer}>
        {/* عدّاد الكمية: الزر يتعطل عند الحد (1 أو 99) */}
        <QuantityStepper
          large
          quantity={quantity}
          onIncrease={() => setQuantity(stepQuantity(quantity, 1))}
          onDecrease={() => setQuantity(stepQuantity(quantity, -1))}
          canIncrease={quantity < MAX_QUANTITY}
          canDecrease={quantity > 1}
        />
        <View style={styles.addWrap}>
          <Button
            title={t('cart.add')}
            disabled={!canAdd}
            onPress={() => {
              const store = product.stores;
              addToCart(
                { id: store.id, name: store.name_ar, minOrder: store.min_order },
                { id: product.id, name: product.name_ar, price: product.price },
                quantity,
              );
              router.back();
            }}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  center: { justifyContent: 'center', padding: 24, gap: 16 },
  padded: { paddingHorizontal: 16, paddingTop: 16 },
  image: { width: '100%', aspectRatio: 4 / 3, maxHeight: 380 },
  backWrap: { position: 'absolute', top: 0, right: 16, paddingTop: 16 },
  info: {
    marginTop: -24,
    padding: 20,
    paddingTop: 24,
    gap: 10,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  name: { fontFamily: fonts.bold, fontSize: 24, lineHeight: 36, color: colors.text },
  secondary: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 25, color: colors.textSecondary },
  // السعر يُقرأ من اليسار إلى اليمين (القسم 7)
  price: {
    fontFamily: fonts.bold,
    fontSize: 20,
    color: colors.primaryDark,
    writingDirection: 'ltr',
    textAlign: 'right',
  },
  soldOut: {
    alignSelf: 'flex-start',
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.dangerDark,
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 4,
    overflow: 'hidden',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: colors.surface,
    ...shadows.raised,
  },
  addWrap: { flex: 1 },
});
