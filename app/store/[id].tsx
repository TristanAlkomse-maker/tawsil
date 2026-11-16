// صفحة المتجر (الشاشة 4): الغلاف، الاسم، وقت التحضير، الحد الأدنى، ثم المنتجات تحت أقسامها.
// زر الإضافة السريعة يظهر إذا كان المتجر مفتوحًا، وشريط "عرض السلة" يظهر إذا كانت السلة غير فارغة.
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, SectionList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';

import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { Picture } from '@/components/Picture';
import { ProductRow, type Product } from '@/components/ProductRow';
import { BackButton } from '@/components/ScreenHeader';
import { formatMoney } from '@/lib/money';
import { supabase } from '@/lib/supabase';
import { addToCart, cartCount, cartSubtotal, useCart } from '@/stores/cart';
import { colors, fonts, radius, shadows } from '@/theme';

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

  const back = <BackButton />;

  if (error || store === null || store === undefined) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.topBar}>{back}</View>
        <View style={[styles.screen, styles.center]}>
          {error ? (
            <EmptyState
              icon={<Path d="M2 8.5a15 15 0 0120 0M5.5 12a10 10 0 0113 0M9 15.5a5 5 0 016 0M12 19h.01M3 3l18 18" />}
              message={t('errors.noConnection')}
              action={<Button title={t('errors.retry')} onPress={retry} />}
            />
          ) : store === null ? (
            <EmptyState icon={<><Circle cx={11} cy={11} r={7} /><Path d="M20 20l-4-4" /></>} message={t('browse.notFound')} />
          ) : (
            <ActivityIndicator size="large" color={colors.primary} />
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
              {/* contentPosition="top": لافتة المتجر غالبًا في أعلى الصورة، فلا تُقص */}
              <Picture
                source={store.cover_url}
                name={store.name_ar}
                hint={store.description_ar ?? ''}
                style={styles.cover}
                contentPosition="top"
                size={72}
              />
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
                <View style={styles.metaPill}>
                  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.primaryDark} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <Circle cx={12} cy={12} r={9} />
                    <Path d="M12 7v5l3 2" />
                  </Svg>
                  <Text style={styles.metaText}>{t('browse.prep', { n: store.prep_minutes })}</Text>
                </View>
                <View style={styles.metaPill}>
                  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.primaryDark} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <Path d="M6 7h12l1 13H5L6 7zM9 7a3 3 0 016 0" />
                  </Svg>
                  <Text style={styles.metaText}>
                    {t('browse.minOrder')} <Text style={styles.ltr}>{formatMoney(store.min_order)}</Text>
                  </Text>
                </View>
              </View>
            </View>
          </>
        }
        renderSectionHeader={({ section }) => <Text style={styles.section}>{section.title}</Text>}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <ProductRow
              product={item}
              hint={`${store.name_ar} ${store.description_ar ?? ''}`}
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
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState icon={<Path d="M6 7h12l1 13H5L6 7zM9 7a3 3 0 016 0" />} message={t('browse.noProducts')} />
        }
        contentContainerStyle={styles.list}
      />
      {cartItems.length > 0 && (
        <SafeAreaView edges={['bottom']} style={styles.cartBar}>
          <Pressable
            style={({ pressed }) => [styles.cartButton, pressed && styles.cartPressed]}
            onPress={() => router.push('/cart')}
            accessibilityRole="button"
          >
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
  topBar: { paddingHorizontal: 16, paddingTop: 16 },
  list: { paddingBottom: 32 },
  // نسبة 16:9 من عرض الشاشة (نحو 220 نقطة على الهاتف)، وحد أقصى حتى لا تملأ الشاشة العريضة
  cover: { width: '100%', aspectRatio: 16 / 9, maxHeight: 320 },
  backWrap: { position: 'absolute', top: 0, right: 16, paddingTop: 16 },
  // بطاقة المعلومات تصعد فوق أسفل الغلاف
  info: {
    marginHorizontal: 16,
    marginTop: -28,
    padding: 16,
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    ...shadows.card,
  },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  name: { fontFamily: fonts.bold, fontSize: 22, lineHeight: 34, color: colors.text, flexShrink: 1 },
  closed: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.dangerDark,
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 3,
    overflow: 'hidden',
  },
  secondary: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 22, color: colors.textSecondary },
  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primaryTint,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  metaText: { fontFamily: fonts.medium, fontSize: 13, color: colors.text },
  ltr: { writingDirection: 'ltr' },
  // اسم القسم برتقالي ليتميز عن أسماء المنتجات. الدرجة الأغمق لأنها نص على خلفية فاتحة (القسم 7)
  section: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.primaryDark,
    marginTop: 24,
    marginBottom: 2,
    paddingHorizontal: 16,
  },
  item: { paddingHorizontal: 16 },
  // شريط السلة يطفو فوق القائمة
  cartBar: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12, backgroundColor: colors.background },
  cartButton: {
    height: 58,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    ...shadows.primary,
  },
  cartPressed: { transform: [{ scale: 0.98 }], opacity: 0.92 },
  cartText: { fontFamily: fonts.bold, fontSize: 17, color: colors.text },
});
