// تفاصيل المنتج (الشاشة 5): الصورة، الاسم، الوصف، السعر، عدّاد الكمية.
// زر "إضافة للسلة" يأتي مع السلة في المرحلة 6، وسيأخذ الكمية من هذا العدّاد.
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { Button } from '@/components/Button';
import type { Product } from '@/components/ProductRow';
import { formatMoney } from '@/lib/money';
import { MAX_QUANTITY, stepQuantity } from '@/lib/quantity';
import { supabase } from '@/lib/supabase';
import { colors, fonts } from '@/theme';

export default function ProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  // undefined = ما زال يُحمّل، null = المنتج غير موجود
  const [product, setProduct] = useState<Product | null | undefined>(undefined);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    supabase
      .from('products')
      .select('id, name_ar, description_ar, price, image_url, is_available')
      .eq('id', id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) setError(true);
        else setProduct(data);
      });
  }, [id, attempt]);

  function retry() {
    setError(false);
    setProduct(undefined);
    setAttempt(attempt + 1);
  }

  const back = (
    <Pressable style={styles.back} onPress={() => router.back()} accessibilityLabel={t('browse.back')}>
      <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={colors.text} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <Path d="M9 6l6 6-6 6" />
      </Svg>
    </Pressable>
  );

  if (error || !product) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.padded}>{back}</View>
        <View style={[styles.screen, styles.center]}>
          {error ? (
            <>
              <Text style={styles.error}>{t('errors.noConnection')}</Text>
              <Button title={t('errors.retry')} onPress={retry} />
            </>
          ) : product === null ? (
            <Text style={styles.empty}>{t('browse.notFound')}</Text>
          ) : (
            <ActivityIndicator color={colors.primary} />
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <ScrollView style={styles.screen}>
      <View>
        <Image source={product.image_url} style={styles.image} />
        <SafeAreaView edges={['top']} style={styles.backWrap}>
          {back}
        </SafeAreaView>
      </View>

      <View style={styles.info}>
        <Text style={styles.name}>{product.name_ar}</Text>
        {!!product.description_ar && <Text style={styles.secondary}>{product.description_ar}</Text>}
        <Text style={styles.price}>{formatMoney(product.price)}</Text>

        {/* عدّاد الكمية: الزر يتعطل عند الحد (1 أو 99) */}
        <View style={styles.counter}>
          <Pressable
            style={[styles.step, quantity >= MAX_QUANTITY && styles.disabled]}
            onPress={() => setQuantity(stepQuantity(quantity, 1))}
            disabled={quantity >= MAX_QUANTITY}
            accessibilityLabel={t('browse.increase')}
          >
            <Text style={styles.stepText}>+</Text>
          </Pressable>
          <Text style={styles.quantity}>{quantity}</Text>
          <Pressable
            style={[styles.step, quantity <= 1 && styles.disabled]}
            onPress={() => setQuantity(stepQuantity(quantity, -1))}
            disabled={quantity <= 1}
            accessibilityLabel={t('browse.decrease')}
          >
            <Text style={styles.stepText}>−</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  center: { justifyContent: 'center', padding: 24, gap: 16 },
  padded: { paddingHorizontal: 16 },
  image: { height: 260, backgroundColor: colors.placeholder },
  backWrap: { position: 'absolute', top: 0, right: 16 },
  back: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  info: { padding: 16, gap: 8 },
  name: { fontFamily: fonts.bold, fontSize: 22, color: colors.text },
  secondary: { fontFamily: fonts.regular, fontSize: 15, color: colors.textSecondary },
  price: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.text,
    writingDirection: 'ltr',
    textAlign: 'right',
  },
  counter: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 16, alignSelf: 'center' },
  step: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: { opacity: 0.4 },
  stepText: { fontFamily: fonts.bold, fontSize: 22, color: colors.text },
  quantity: { fontFamily: fonts.bold, fontSize: 20, color: colors.text, minWidth: 32, textAlign: 'center' },
  empty: { fontFamily: fonts.regular, fontSize: 15, color: colors.textSecondary, textAlign: 'center' },
  error: { fontFamily: fonts.regular, fontSize: 15, color: colors.danger, textAlign: 'center' },
});
