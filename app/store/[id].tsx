// صفحة المتجر (الشاشة 4): الغلاف، الاسم، وقت التحضير، الحد الأدنى، ثم المنتجات تحت أقسامها.
// زر الإضافة السريعة يظهر إذا كان المتجر مفتوحًا، وشريط "عرض السلة" يظهر إذا كانت السلة غير فارغة.
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, SectionList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { Button } from '@/components/Button';
import { ProductRow, type Product } from '@/components/ProductRow';
import { formatMoney } from '@/lib/money';
import { supabase } from '@/lib/supabase';
import { addToCart, cartCount, cartSubtotal, useCart } from '@/stores/cart';
import { colors, fonts } from '@/theme';

type StoreDetails = {
  name_ar: string;
  description_ar: string | null;
  cover_url: string | null;
  prep_minutes: number;
  min_order: number;
  is_open: boolean;
  menu_sections: { id: string; name_ar: string; products: Product[] }[];
};

export default function StoreScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  // undefined = ما زال يُحمّل، null = المتجر غير موجود أو غير معتمد
  const [store, setStore] = useState<StoreDetails | null | undefined>(undefined);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const cartItems = useCart((s) => s.items); // الشاشة تُحدَّث تلقائيًا عند تغيّر السلة

  // طلب واحد يجلب المتجر وأقسامه ومنتجات كل قسم، مرتبة حسب sort_order
  useEffect(() => {
    supabase
      .from('stores')
      .select(
        `name_ar, description_ar, cover_url, prep_minutes, min_order, is_open,
         menu_sections (id, name_ar, products (id, name_ar, description_ar, price, image_url, is_available))`,
      )
      .eq('id', id)
      .order('sort_order', { referencedTable: 'menu_sections' })
      .order('sort_order', { referencedTable: 'menu_sections.products' })
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) setError(true);
        else setStore(data);
      });
  }, [id, attempt]);

  function retry() {
    setError(false);
    setStore(undefined);
    setAttempt(attempt + 1);
  }

  const back = (
    <Pressable style={styles.back} onPress={() => router.back()} accessibilityLabel={t('browse.back')}>
      <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={colors.text} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <Path d="M9 6l6 6-6 6" />
      </Svg>
    </Pressable>
  );

  if (error || store === null || store === undefined) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.item}>{back}</View>
        <View style={[styles.screen, styles.center]}>
          {error ? (
            <>
              <Text style={styles.error}>{t('errors.noConnection')}</Text>
              <Button title={t('errors.retry')} onPress={retry} />
            </>
          ) : store === null ? (
            <Text style={styles.empty}>{t('browse.notFound')}</Text>
          ) : (
            <ActivityIndicator color={colors.primary} />
          )}
        </View>
      </SafeAreaView>
    );
  }

  // SectionList يحتاج كل قسم على شكل { title, data }. الأقسام الفارغة لا تُعرض.
  const sections = store.menu_sections
    .filter((s) => s.products.length > 0)
    .map((s) => ({ title: s.name_ar, data: s.products }));

  const cartStore = { id, name: store.name_ar, minOrder: store.min_order };

  return (
    <View style={styles.screen}>
      <SectionList
        sections={sections}
        keyExtractor={(p) => p.id}
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={
          <>
            <View>
              <Image source={store.cover_url} style={styles.cover} />
              <SafeAreaView edges={['top']} style={styles.backWrap}>
                {back}
              </SafeAreaView>
            </View>
            <View style={styles.info}>
              <View style={styles.titleRow}>
                <Text style={styles.name}>{store.name_ar}</Text>
                {!store.is_open && <Text style={styles.closed}>{t('browse.closed')}</Text>}
              </View>
              {!!store.description_ar && <Text style={styles.secondary}>{store.description_ar}</Text>}
              <View style={styles.meta}>
                <Text style={styles.metaText}>{t('browse.prep', { n: store.prep_minutes })}</Text>
                <Text style={styles.metaText}>
                  {t('browse.minOrder')} <Text style={styles.ltr}>{formatMoney(store.min_order)}</Text>
                </Text>
              </View>
            </View>
          </>
        }
        renderSectionHeader={({ section }) => <Text style={styles.section}>{section.title}</Text>}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <ProductRow
              product={item}
              onPress={() => router.push({ pathname: '/product/[id]', params: { id: item.id } })}
              // المتجر المغلق يُتصفح دون إضافة للسلة (القسم 6)
              onAdd={
                store.is_open
                  ? () => addToCart(cartStore, { id: item.id, name: item.name_ar, price: item.price }, 1)
                  : undefined
              }
            />
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>{t('browse.noProducts')}</Text>}
        contentContainerStyle={styles.list}
      />
      {cartItems.length > 0 && (
        <SafeAreaView edges={['bottom']} style={styles.cartBar}>
          <Pressable style={styles.cartButton} onPress={() => router.push('/cart')} accessibilityRole="button">
            <Text style={styles.cartText}>{t('cart.view', { count: cartCount(cartItems) })}</Text>
            <Text style={[styles.cartText, styles.ltr]}>{formatMoney(cartSubtotal(cartItems))}</Text>
          </Pressable>
        </SafeAreaView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  center: { justifyContent: 'center', padding: 24, gap: 16 },
  list: { paddingBottom: 24 },
  cover: { height: 150, backgroundColor: colors.placeholder },
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
  info: {
    padding: 16,
    gap: 6,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontFamily: fonts.bold, fontSize: 22, color: colors.text },
  closed: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.dangerDark,
    backgroundColor: colors.dangerSoft,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    overflow: 'hidden',
  },
  secondary: { fontFamily: fonts.regular, fontSize: 14, color: colors.textSecondary },
  meta: { flexDirection: 'row', gap: 14 },
  metaText: { fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary },
  ltr: { writingDirection: 'ltr' },
  // اسم القسم برتقالي ليتميز عن أسماء المنتجات. الدرجة الأغمق لأنها نص على خلفية فاتحة (القسم 7)
  section: {
    fontFamily: fonts.bold,
    fontSize: 17,
    color: colors.primaryDark,
    marginTop: 16,
    paddingHorizontal: 16,
  },
  item: { paddingHorizontal: 16 },
  empty: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 32,
  },
  error: { fontFamily: fonts.regular, fontSize: 15, color: colors.danger, textAlign: 'center' },
  cartBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  cartButton: {
    height: 54,
    borderRadius: 14,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
  },
  cartText: { fontFamily: fonts.bold, fontSize: 17, color: colors.text },
});
