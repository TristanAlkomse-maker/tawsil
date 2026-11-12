// تأكيد الطلب (الشاشة 9): العنوان، الفاتورة، الدفع كاش، الملاحظات، وزر التأكيد.
// الأسعار هنا للعرض فقط. التطبيق يرسل معرّفات المنتجات وكمياتها، و create_order
// في قاعدة البيانات تقرأ الأسعار بنفسها وتحسب الإجمالي الحقيقي (القسم 5).
import type { Session } from '@supabase/supabase-js';
import { Redirect, router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { Button } from '@/components/Button';
import { selectedAddress } from '@/lib/address';
import { formatMoney } from '@/lib/money';
import { orderErrorKey } from '@/lib/orderError';
import { supabase } from '@/lib/supabase';
import { cartSubtotal, useCart } from '@/stores/cart';
import { colors, fonts } from '@/theme';

type Address = {
  id: string;
  label: string;
  description: string;
  is_default: boolean;
  zones: { name_ar: string; delivery_fee: number };
};

export default function Checkout() {
  const { t } = useTranslation();
  const { store, items, clear } = useCart();
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  // undefined = ما زال يُحمّل، null = لا عناوين بعد
  const [address, setAddress] = useState<Address | null | undefined>(undefined);
  const [loadError, setLoadError] = useState(false);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState(''); // رسالة رفض الطلب بالعربية
  const [sending, setSending] = useState(false); // يمنع إرسال الطلب مرتين بضغطتين سريعتين

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
  }, []);

  // نعيد جلب العنوان كلما ظهرت الشاشة، فيتحدّث بعد الرجوع من "تغيير" أو "إضافة عنوان"
  const load = useCallback(() => {
    setLoadError(false);
    supabase
      .from('addresses')
      .select('id, label, description, is_default, zones (name_ar, delivery_fee)')
      .order('created_at')
      .returns<Address[]>()
      .then(({ data, error }) => {
        if (error) setLoadError(true);
        else setAddress(selectedAddress(data));
      });
  }, []);
  useFocusEffect(load);

  if (session === null) return <Redirect href="/login" />;
  // السلة تفرغ لحظة نجاح الطلب والشاشة في طريقها للإغلاق، فلا نعرض شيئًا.
  // (التحويل إلى السلة هنا كان سيسحب العميل بعيدًا عن شاشة التتبع)
  if (!store || items.length === 0) return null;

  const subtotal = cartSubtotal(items);
  const fee = address?.zones.delivery_fee ?? 0;
  const total = Math.round((subtotal + fee) * 100) / 100;

  async function confirm() {
    if (!address || !store) return;
    setError('');
    setSending(true);
    const { data: orderId, error } = await supabase.rpc('create_order', {
      p_store_id: store.id,
      p_address_id: address.id,
      p_items: items.map((i) => ({ product_id: i.id, quantity: i.quantity })),
      p_notes: notes.trim() || null,
    });
    setSending(false);

    if (error) {
      // في رفض "منتج نفد" تضع الدالة اسم المنتج في details
      setError(t(orderErrorKey(error), { name: error.details }));
      return;
    }
    // بعد النجاح: الانتقال إلى التتبع ثم تفريغ السلة (القسم 6).
    // replace بدل push حتى لا يعود زر الرجوع إلى شاشة تأكيد طلب انتهى.
    router.replace({ pathname: '/order/[id]', params: { id: orderId } });
    clear();
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Pressable style={styles.back} onPress={() => router.back()} accessibilityLabel={t('browse.back')}>
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={colors.text} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M9 6l6 6-6 6" />
          </Svg>
        </Pressable>
        <Text style={styles.title}>{t('order.checkoutTitle')}</Text>
      </View>

      {loadError ? (
        <View style={styles.center}>
          <Text style={styles.error}>{t('errors.noConnection')}</Text>
          <Button title={t('errors.retry')} onPress={load} />
        </View>
      ) : address === undefined ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            {/* العنوان */}
            <View style={[styles.card, styles.iconRow]}>
              <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={colors.primaryDark} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M12 22s7-7.5 7-12.5A7 7 0 005 9.5C5 14.5 12 22 12 22z" />
                <Circle cx={12} cy={9.5} r={2.5} />
              </Svg>
              {address ? (
                <>
                  <View style={styles.grow}>
                    <Text style={styles.bold}>{`${address.label}، ${address.zones.name_ar}`}</Text>
                    <Text style={styles.secondary}>{address.description}</Text>
                  </View>
                  <Pressable style={styles.link} onPress={() => router.push('/addresses')} accessibilityRole="button">
                    <Text style={styles.linkText}>{t('order.change')}</Text>
                  </Pressable>
                </>
              ) : (
                <Pressable style={[styles.grow, styles.link]} onPress={() => router.push('/addresses/new')} accessibilityRole="button">
                  <Text style={styles.linkText}>{t('addresses.addFirst')}</Text>
                </Pressable>
              )}
            </View>

            {/* الفاتورة */}
            <View style={[styles.card, styles.bill]}>
              <Text style={styles.bold}>{store.name}</Text>
              {items.map((item) => (
                <View key={item.id} style={styles.line}>
                  <Text style={styles.secondary}>{`${item.quantity} × ${item.name}`}</Text>
                  <Text style={styles.amount}>{formatMoney(item.price * item.quantity)}</Text>
                </View>
              ))}
              <View style={styles.divider} />
              <View style={styles.line}>
                <Text style={styles.secondary}>{t('cart.subtotal')}</Text>
                <Text style={styles.amount}>{formatMoney(subtotal)}</Text>
              </View>
              <View style={styles.line}>
                <Text style={styles.secondary}>{t('order.deliveryFee')}</Text>
                <Text style={styles.amount}>{formatMoney(fee)}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.line}>
                <Text style={styles.totalText}>{t('order.total')}</Text>
                <Text style={[styles.amount, styles.totalText]}>{formatMoney(total)}</Text>
              </View>
            </View>

            {/* الدفع */}
            <View style={[styles.card, styles.iconRow]}>
              <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={colors.text} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <Rect x={3} y={6} width={18} height={12} rx={2} />
                <Circle cx={12} cy={12} r={2.5} />
              </Svg>
              <View style={styles.grow}>
                <Text style={styles.bold}>{t('order.cash')}</Text>
                <Text style={styles.secondary}>{t('order.prepareCash', { amount: formatMoney(total) })}</Text>
              </View>
            </View>

            {/* الملاحظات */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>{t('order.notes')}</Text>
              <TextInput style={styles.input} value={notes} onChangeText={setNotes} accessibilityLabel={t('order.notes')} />
            </View>
          </ScrollView>

          <View style={styles.footer}>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Button title={t('order.confirm')} onPress={confirm} disabled={!address || sending} />
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, paddingBottom: 12 },
  back: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontFamily: fonts.bold, fontSize: 20, color: colors.text, flex: 1 },
  center: { flex: 1, justifyContent: 'center', padding: 24, gap: 16 },
  content: { paddingHorizontal: 16, gap: 12, paddingBottom: 16 },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 16,
  },
  iconRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  grow: { flex: 1, gap: 2 },
  bold: { fontFamily: fonts.bold, fontSize: 16, color: colors.text },
  secondary: { fontFamily: fonts.regular, fontSize: 14, color: colors.textSecondary },
  link: { minHeight: 44, justifyContent: 'center' },
  linkText: { fontFamily: fonts.bold, fontSize: 14, color: colors.primaryDark },
  bill: { gap: 10 },
  line: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  // الأسعار تُقرأ من اليسار إلى اليمين (القسم 7)
  amount: { fontFamily: fonts.regular, fontSize: 15, color: colors.text, writingDirection: 'ltr' },
  totalText: { fontFamily: fonts.bold, fontSize: 17, color: colors.text },
  divider: { height: 1, backgroundColor: colors.border },
  field: { gap: 6 },
  fieldLabel: { fontFamily: fonts.bold, fontSize: 14, color: colors.text },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.text,
    textAlign: 'right',
  },
  error: { fontFamily: fonts.regular, fontSize: 15, color: colors.danger, textAlign: 'center' },
  footer: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16, gap: 8 },
});
