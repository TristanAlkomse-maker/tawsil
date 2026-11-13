// صفحة الإدارة 2: تفاصيل الطلب (القسم 6 من المواصفات).
// المنتجات، الفاتورة، العميل وهاتفه، العنوان مع رابط الخرائط، سجل الحالات،
// وزر لكل انتقال مسموح فقط. الضغط على زر يستدعي set_order_status في قاعدة البيانات،
// فيتغيّر الطلب على هاتف العميل فورًا عبر Realtime.
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { formatMoney } from '@/lib/money';
import { orderErrorKey } from '@/lib/orderError';
import { adminTransitions, type OrderStatus, statusLabel } from '@/lib/orderStatus';
import { supabase } from '@/lib/supabase';
import { colors, fonts } from '@/theme';

type Order = {
  order_number: number;
  status: OrderStatus;
  subtotal: number;
  delivery_fee: number;
  total: number;
  customer_name: string;
  customer_phone: string;
  zone_name: string;
  address_description: string;
  lat: number | null;
  lng: number | null;
  notes: string | null;
  stores: { name_ar: string } | null;
  order_items: { id: string; product_name: string; quantity: number; line_total: number }[];
  order_status_history: { id: string; status: OrderStatus; created_at: string }[];
};

// 14:05 بأرقام 0–9 المعتادة
function clock(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function AdminOrder() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null); // null = ما زال يُحمّل
  const [error, setError] = useState(''); // خطأ التحميل
  const [actionError, setActionError] = useState(''); // خطأ زر تغيير الحالة
  const [busy, setBusy] = useState(false); // يمنع الضغط مرتين أثناء الإرسال

  const load = useCallback(() => {
    supabase
      .from('orders')
      .select(
        'order_number, status, subtotal, delivery_fee, total, customer_name, customer_phone, ' +
          'zone_name, address_description, lat, lng, notes, stores (name_ar), ' +
          'order_items (id, product_name, quantity, line_total), ' +
          'order_status_history (id, status, created_at)',
      )
      .eq('id', id)
      .order('created_at', { referencedTable: 'order_status_history' })
      .single<Order>()
      .then(({ data, error }) => {
        if (error) setError(t('errors.noConnection'));
        else {
          setError('');
          setOrder(data);
        }
      });
  }, [id, t]);

  // نشترك في تغييرات هذا الطلب: إذا ألغاه العميل والصفحة مفتوحة تتغير الأزرار وحدها
  useEffect(() => {
    load();
    const channel = supabase
      .channel(`admin-order-${id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${id}` }, load)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, load]);

  async function move(status: OrderStatus) {
    setBusy(true);
    setActionError('');
    const { error } = await supabase.rpc('set_order_status', { p_order_id: id, p_new_status: status });
    setBusy(false);
    if (error) setActionError(t(orderErrorKey(error)));
    load(); // في الحالتين: نعرض الحالة الحقيقية الآن
  }

  const back = (
    <Pressable style={styles.back} onPress={() => router.replace('/admin')} accessibilityRole="button">
      <Text style={styles.backText}>{t('browse.back')}</Text>
    </Pressable>
  );

  if (error && !order) {
    return (
      <View style={styles.screen}>
        {back}
        <View style={styles.center}>
          <Text style={styles.error}>{error}</Text>
          <Button title={t('errors.retry')} onPress={load} />
        </View>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.screen}>
        {back}
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </View>
    );
  }

  const next = adminTransitions(order.status);
  const hasPin = order.lat !== null && order.lng !== null;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {back}
      <Text style={styles.title}>
        {t('order.number', { n: order.order_number })} · {statusLabel(order.status)}
      </Text>
      {order.stores && <Text style={styles.secondary}>{order.stores.name_ar}</Text>}

      {/* أزرار الانتقالات المسموحة فقط */}
      <View style={styles.card}>
        {next.length === 0 ? (
          <Text style={styles.secondary}>{t('admin.noActions')}</Text>
        ) : (
          <View style={styles.actions}>
            {next.map((s) =>
              s === 'rejected' || s === 'cancelled' ? (
                <Pressable
                  key={s}
                  style={[styles.dangerButton, busy && styles.disabled]}
                  onPress={() => move(s)}
                  disabled={busy}
                  accessibilityRole="button"
                >
                  <Text style={styles.dangerText}>{t('admin.moveTo', { status: statusLabel(s) })}</Text>
                </Pressable>
              ) : (
                <Button key={s} title={t('admin.moveTo', { status: statusLabel(s) })} onPress={() => move(s)} disabled={busy} />
              ),
            )}
          </View>
        )}
        {actionError !== '' && <Text style={styles.error}>{actionError}</Text>}
      </View>

      <View style={styles.card}>
        <Text style={styles.section}>{t('admin.customer')}</Text>
        <Text style={styles.bold}>{order.customer_name}</Text>
        <Text style={[styles.text, styles.ltr]}>{order.customer_phone}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.section}>{t('admin.address')}</Text>
        <Text style={styles.bold}>{order.zone_name}</Text>
        <Text style={styles.text}>{order.address_description}</Text>
        {hasPin && (
          <Pressable
            onPress={() => Linking.openURL(`https://www.google.com/maps?q=${order.lat},${order.lng}`)}
            accessibilityRole="link"
          >
            <Text style={styles.link}>{t('admin.openMap')}</Text>
          </Pressable>
        )}
        {order.notes ? (
          <>
            <Text style={styles.section}>{t('admin.notes')}</Text>
            <Text style={styles.text}>{order.notes}</Text>
          </>
        ) : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.section}>{t('admin.items')}</Text>
        {order.order_items.map((item) => (
          <View key={item.id} style={styles.line}>
            <Text style={styles.text}>
              {item.quantity} × {item.product_name}
            </Text>
            <Text style={[styles.text, styles.ltr]}>{formatMoney(item.line_total)}</Text>
          </View>
        ))}
        <View style={styles.divider} />
        <View style={styles.line}>
          <Text style={styles.secondary}>{t('cart.subtotal')}</Text>
          <Text style={[styles.text, styles.ltr]}>{formatMoney(order.subtotal)}</Text>
        </View>
        <View style={styles.line}>
          <Text style={styles.secondary}>{t('order.deliveryFee')}</Text>
          <Text style={[styles.text, styles.ltr]}>{formatMoney(order.delivery_fee)}</Text>
        </View>
        <View style={styles.line}>
          <Text style={styles.bold}>{t('order.totalCash')}</Text>
          <Text style={[styles.bold, styles.ltr]}>{formatMoney(order.total)}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.section}>{t('admin.history')}</Text>
        {order.order_status_history.map((h) => (
          <View key={h.id} style={styles.line}>
            <Text style={styles.text}>{statusLabel(h.status)}</Text>
            <Text style={[styles.secondary, styles.ltr]}>{clock(h.created_at)}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 24, gap: 12, maxWidth: 720, width: '100%', alignSelf: 'center' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16, padding: 24 },
  back: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' },
  backText: { fontFamily: fonts.bold, fontSize: 15, color: colors.primaryDark },
  title: { fontFamily: fonts.bold, fontSize: 22, color: colors.text },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dangerButton: {
    height: 54,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.danger,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  dangerText: { fontFamily: fonts.bold, fontSize: 17, color: colors.danger },
  disabled: { opacity: 0.5 },
  section: { fontFamily: fonts.bold, fontSize: 13, color: colors.textSecondary },
  text: { fontFamily: fonts.regular, fontSize: 15, color: colors.text },
  bold: { fontFamily: fonts.bold, fontSize: 15, color: colors.text },
  secondary: { fontFamily: fonts.regular, fontSize: 14, color: colors.textSecondary },
  link: { fontFamily: fonts.bold, fontSize: 15, color: colors.primaryDark, textDecorationLine: 'underline' },
  line: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  // الأرقام والأسعار تُقرأ من اليسار إلى اليمين (القسم 7)
  ltr: { writingDirection: 'ltr' },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 4 },
  error: { fontFamily: fonts.regular, fontSize: 15, color: colors.danger },
});
