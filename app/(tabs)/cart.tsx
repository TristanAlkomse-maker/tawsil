// شاشة السلة (الشاشة 6): اسم المتجر، المنتجات بكمياتها، المجموع، وزر متابعة الطلب.
// البيانات من الهاتف لا من الإنترنت، فلا حالة تحميل أو خطأ هنا؛ فقط حالة السلة الفارغة.
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';

import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { QuantityStepper } from '@/components/QuantityStepper';
import { formatMoney } from '@/lib/money';
import { MAX_QUANTITY } from '@/lib/quantity';
import { supabase } from '@/lib/supabase';
import { cartSubtotal, useCart } from '@/stores/cart';
import { card, colors, fonts, shadows } from '@/theme';

export default function CartScreen() {
  const { t } = useTranslation();
  const { store, items, increase, decrease } = useCart();

  if (!store || items.length === 0) {
    return (
      <SafeAreaView style={styles.screen}>
        <Text style={styles.title}>{t('cart.title')}</Text>
        <View style={styles.center}>
          <EmptyState
            icon={
              <>
                <Circle cx={9} cy={20} r={1.5} />
                <Circle cx={18} cy={20} r={1.5} />
                <Path d="M2 3h3l3 12h11l2-8H7" />
              </>
            }
            message={t('cart.empty')}
            action={<Button title={t('cart.browse')} onPress={() => router.push('/')} />}
          />
        </View>
      </SafeAreaView>
    );
  }

  const subtotal = cartSubtotal(items);
  // كم ينقص للوصول إلى الحد الأدنى للمتجر (صفر إذا وصل إليه)
  const remaining = Math.max(0, Math.round((store.minOrder - subtotal) * 100) / 100);

  async function checkout() {
    // الزائر يملأ السلة دون حساب، ويُطلب منه الدخول هنا (القسم 6)
    const { data } = await supabase.auth.getSession();
    router.push(data.session ? '/checkout' : '/login');
  }

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <Text style={styles.title}>{t('cart.title')}</Text>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.storeRow}>
            <View style={styles.storeIcon}>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={colors.primaryDark} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M4 9l1.5-5h13L20 9M4 9v11h16V9M4 9h16M9 20v-6h6v6" />
              </Svg>
            </View>
            <View style={styles.info}>
              <Text style={styles.secondary}>{t('cart.from')}</Text>
              <Text style={styles.storeName}>{store.name}</Text>
            </View>
          </View>

          {items.map((item) => (
            <View key={item.id} style={styles.row}>
              <View style={styles.info}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={[styles.price, styles.ltr]}>{formatMoney(item.price)}</Text>
              </View>
              {/* الإنقاص عند الكمية 1 يحذف المنتج من السلة */}
              <QuantityStepper
                quantity={item.quantity}
                onIncrease={() => increase(item.id)}
                onDecrease={() => decrease(item.id)}
                canIncrease={item.quantity < MAX_QUANTITY}
              />
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>{t('cart.subtotal')}</Text>
          <Text style={[styles.total, styles.ltr]}>{formatMoney(subtotal)}</Text>
        </View>
        {remaining > 0 && (
          <Text style={styles.remaining}>{t('cart.remaining', { amount: formatMoney(remaining) })}</Text>
        )}
        <Button title={t('cart.checkout')} onPress={checkout} disabled={remaining > 0} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  title: { fontFamily: fonts.bold, fontSize: 26, lineHeight: 40, color: colors.text, padding: 16, paddingBottom: 8 },
  center: { flex: 1, justifyContent: 'center' },
  content: { paddingHorizontal: 16, paddingTop: 4, gap: 12, paddingBottom: 16 },
  card: { ...card, paddingBottom: 6 },
  storeRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 },
  storeIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeName: { fontFamily: fonts.bold, fontSize: 17, color: colors.text },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  info: { flex: 1, gap: 2 },
  name: { fontFamily: fonts.bold, fontSize: 16, color: colors.text },
  secondary: { fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary },
  price: { fontFamily: fonts.medium, fontSize: 14, color: colors.primaryDark },
  // الأسعار تُقرأ من اليسار إلى اليمين (القسم 7)
  ltr: { writingDirection: 'ltr', textAlign: 'right' },
  // المجموع والزر في لوحة بيضاء ثابتة أسفل الشاشة
  footer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    gap: 12,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    ...shadows.raised,
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontFamily: fonts.medium, fontSize: 16, color: colors.textSecondary },
  total: { fontFamily: fonts.bold, fontSize: 20, color: colors.text },
  remaining: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.primaryDark,
    backgroundColor: colors.primaryTint,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    textAlign: 'center',
    overflow: 'hidden',
  },
});
