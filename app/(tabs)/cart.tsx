// شاشة السلة (الشاشة 6): اسم المتجر، المنتجات بكمياتها، المجموع، وزر متابعة الطلب.
// البيانات من الهاتف لا من الإنترنت، فلا حالة تحميل أو خطأ هنا؛ فقط حالة السلة الفارغة.
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { Button } from '@/components/Button';
import { formatMoney } from '@/lib/money';
import { MAX_QUANTITY } from '@/lib/quantity';
import { supabase } from '@/lib/supabase';
import { cartSubtotal, useCart } from '@/stores/cart';
import { colors, fonts } from '@/theme';

export default function CartScreen() {
  const { t } = useTranslation();
  const { store, items, increase, decrease } = useCart();

  if (!store || items.length === 0) {
    return (
      <SafeAreaView style={styles.screen}>
        <Text style={styles.title}>{t('cart.title')}</Text>
        <Text style={styles.empty}>{t('cart.empty')}</Text>
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

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.secondary}>{t('cart.from')}</Text>
          <Text style={styles.storeName}>{store.name}</Text>

          {items.map((item) => (
            <View key={item.id} style={styles.row}>
              <View style={styles.info}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={[styles.secondary, styles.ltr]}>{formatMoney(item.price)}</Text>
              </View>
              <Pressable
                style={[styles.step, item.quantity >= MAX_QUANTITY && styles.disabled]}
                onPress={() => increase(item.id)}
                disabled={item.quantity >= MAX_QUANTITY}
                accessibilityLabel={t('browse.increase')}
              >
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.text} strokeWidth={2} strokeLinecap="round">
                  <Path d="M12 5v14M5 12h14" />
                </Svg>
              </Pressable>
              <Text style={styles.quantity}>{item.quantity}</Text>
              {/* الإنقاص عند الكمية 1 يحذف المنتج من السلة */}
              <Pressable style={styles.step} onPress={() => decrease(item.id)} accessibilityLabel={t('browse.decrease')}>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.text} strokeWidth={2} strokeLinecap="round">
                  <Path d="M5 12h14" />
                </Svg>
              </Pressable>
            </View>
          ))}
        </View>

        <View style={[styles.card, styles.totalRow]}>
          <Text style={styles.totalLabel}>{t('cart.subtotal')}</Text>
          <Text style={[styles.total, styles.ltr]}>{formatMoney(subtotal)}</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button title={t('cart.checkout')} onPress={checkout} disabled={remaining > 0} />
        {remaining > 0 && (
          <Text style={styles.remaining}>{t('cart.remaining', { amount: formatMoney(remaining) })}</Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  title: { fontFamily: fonts.bold, fontSize: 20, color: colors.text, padding: 16, paddingBottom: 12 },
  content: { paddingHorizontal: 16, gap: 12, paddingBottom: 16 },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 16,
  },
  storeName: { fontFamily: fonts.bold, fontSize: 17, color: colors.text, marginBottom: 4 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  info: { flex: 1, gap: 4 },
  name: { fontFamily: fonts.bold, fontSize: 16, color: colors.text },
  secondary: { fontFamily: fonts.regular, fontSize: 14, color: colors.textSecondary },
  // الأسعار تُقرأ من اليسار إلى اليمين (القسم 7)
  ltr: { writingDirection: 'ltr', textAlign: 'right' },
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
  quantity: { fontFamily: fonts.bold, fontSize: 16, color: colors.text, minWidth: 20, textAlign: 'center' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontFamily: fonts.bold, fontSize: 17, color: colors.text },
  total: { fontFamily: fonts.bold, fontSize: 17, color: colors.text },
  footer: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16, gap: 8 },
  remaining: { fontFamily: fonts.regular, fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
  empty: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 32,
    paddingHorizontal: 24,
  },
});
