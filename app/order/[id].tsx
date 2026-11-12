// تتبع الطلب (الشاشة 10): رقم الطلب، شريط المراحل، الفاتورة، العنوان، والإلغاء والاتصال.
// الشاشة تشترك في تغييرات هذا الطلب عبر Supabase Realtime، فتتحدّث وحدها
// عندما يغيّر المدير الحالة، دون أن يلمسها العميل.
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';

import { Button } from '@/components/Button';
import { StatusSteps } from '@/components/StatusSteps';
import { formatMoney } from '@/lib/money';
import { orderErrorKey } from '@/lib/orderError';
import { type OrderStatus, statusLabel } from '@/lib/orderStatus';
import { supabase } from '@/lib/supabase';
import { colors, fonts } from '@/theme';

type Order = {
  order_number: number;
  status: OrderStatus;
  subtotal: number;
  delivery_fee: number;
  total: number;
  zone_name: string;
  address_description: string;
  stores: { name_ar: string; phone: string | null } | null; // null إذا أوقفت الإدارة المتجر لاحقًا
  order_status_history: { status: OrderStatus; created_at: string }[];
};

// 12:40 بأرقام 0–9 المعتادة
function clock(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function OrderTracking() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null); // null = ما زال يُحمّل
  const [error, setError] = useState('');

  // قواعد RLS تُرجع الطلب فقط إذا كان يخص هذا العميل
  const load = useCallback(() => {
    supabase
      .from('orders')
      .select(
        'order_number, status, subtotal, delivery_fee, total, zone_name, address_description, ' +
          'stores (name_ar, phone), order_status_history (status, created_at)',
      )
      .eq('id', id)
      .single<Order>()
      .then(({ data, error }) => {
        if (error) setError(t('errors.noConnection'));
        else {
          setError('');
          setOrder(data);
        }
      });
  }, [id, t]);

  // نجلب الطلب، ثم نشترك في تغييراته. عند كل تغيير نعيد الجلب كاملًا،
  // فيتحدّث سجل الحالات وأوقاتها مع الحالة.
  // الدالة المُعادة تُنفَّذ عند مغادرة الشاشة: تلغي الاشتراك حتى لا يبقى مفتوحًا بلا فائدة.
  useEffect(() => {
    load();
    const channel = supabase
      .channel(`order-${id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${id}` }, load)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, load]);

  function cancel() {
    Alert.alert(t('order.cancelTitle'), t('order.cancelMessage'), [
      { text: t('order.keep'), style: 'cancel' },
      {
        text: t('order.cancel'),
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.rpc('cancel_order', { p_order_id: id });
          if (error) Alert.alert(t('order.cancelTitle'), t(orderErrorKey(error)));
          else load();
        },
      },
    ]);
  }

  const header = (
    <View style={styles.header}>
      <Pressable style={styles.back} onPress={() => router.back()} accessibilityLabel={t('browse.back')}>
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={colors.text} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M9 6l6 6-6 6" />
        </Svg>
      </Pressable>
      <Text style={styles.title}>{order ? t('order.number', { n: order.order_number }) : ''}</Text>
    </View>
  );

  if (error && !order) {
    return (
      <SafeAreaView style={styles.screen}>
        {header}
        <View style={styles.center}>
          <Text style={styles.error}>{error}</Text>
          <Button title={t('errors.retry')} onPress={load} />
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.screen}>
        {header}
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  // وقت كل حالة من سجل الحالات
  const times: Partial<Record<OrderStatus, string>> = {};
  for (const h of order.order_status_history) times[h.status] = clock(h.created_at);

  const ended = order.status === 'rejected' || order.status === 'cancelled';
  const phone = order.stores?.phone;

  return (
    <SafeAreaView style={styles.screen}>
      {header}

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.now}>
            <Text style={styles.secondarySmall}>{t('order.statusNow')}</Text>
            <Text style={[styles.status, ended && styles.statusEnded]}>{statusLabel(order.status)}</Text>
            {order.stores && <Text style={styles.secondary}>{order.stores.name_ar}</Text>}
          </View>
          {/* مرفوض أو ملغي: رسالة واحدة بدل شريط المراحل (القسم 6) */}
          {ended ? (
            <Text style={styles.endedMessage}>
              {order.status === 'rejected' ? t('order.rejectedMessage') : t('order.cancelledMessage')}
            </Text>
          ) : (
            <StatusSteps status={order.status} times={times} />
          )}
        </View>

        <View style={[styles.card, styles.bill]}>
          <View style={styles.line}>
            <Text style={styles.secondary}>{t('cart.subtotal')}</Text>
            <Text style={styles.amount}>{formatMoney(order.subtotal)}</Text>
          </View>
          <View style={styles.line}>
            <Text style={styles.secondary}>{t('order.deliveryFee')}</Text>
            <Text style={styles.amount}>{formatMoney(order.delivery_fee)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.line}>
            <Text style={styles.totalText}>{t('order.totalCash')}</Text>
            <Text style={[styles.amount, styles.totalText]}>{formatMoney(order.total)}</Text>
          </View>
        </View>

        <View style={[styles.card, styles.iconRow]}>
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={colors.primaryDark} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M12 22s7-7.5 7-12.5A7 7 0 005 9.5C5 14.5 12 22 12 22z" />
            <Circle cx={12} cy={9.5} r={2.5} />
          </Svg>
          <View style={styles.grow}>
            <Text style={styles.bold}>{order.zone_name}</Text>
            <Text style={styles.secondarySmall}>{order.address_description}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {/* الإلغاء مسموح فقط قبل أن يقبل المتجر الطلب */}
        {order.status === 'pending' && (
          <Pressable style={styles.outline} onPress={cancel} accessibilityRole="button">
            <Text style={[styles.outlineText, styles.danger]}>{t('order.cancel')}</Text>
          </Pressable>
        )}
        {phone && (
          <Pressable style={styles.outline} onPress={() => Linking.openURL(`tel:${phone}`)} accessibilityRole="button">
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={colors.text} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a1 1 0 01-1 1A16 16 0 014 5a1 1 0 011-1z" />
            </Svg>
            <Text style={styles.outlineText}>{t('order.callStore')}</Text>
          </Pressable>
        )}
      </View>
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
  now: { gap: 4, marginBottom: 16 },
  status: { fontFamily: fonts.bold, fontSize: 22, color: colors.text },
  statusEnded: { color: colors.danger },
  endedMessage: { fontFamily: fonts.regular, fontSize: 15, color: colors.textSecondary },
  iconRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  grow: { flex: 1, gap: 2 },
  bold: { fontFamily: fonts.bold, fontSize: 15, color: colors.text },
  secondary: { fontFamily: fonts.regular, fontSize: 14, color: colors.textSecondary },
  secondarySmall: { fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary },
  bill: { gap: 10 },
  line: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  // الأسعار تُقرأ من اليسار إلى اليمين (القسم 7)
  amount: { fontFamily: fonts.regular, fontSize: 15, color: colors.text, writingDirection: 'ltr' },
  totalText: { fontFamily: fonts.bold, fontSize: 17, color: colors.text },
  divider: { height: 1, backgroundColor: colors.border },
  error: { fontFamily: fonts.regular, fontSize: 15, color: colors.danger, textAlign: 'center' },
  footer: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16, gap: 8 },
  outline: {
    height: 54,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  outlineText: { fontFamily: fonts.bold, fontSize: 16, color: colors.text },
  danger: { color: colors.danger },
});
