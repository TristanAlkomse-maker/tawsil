// صفحة الإدارة 1: قائمة الطلبات (القسم 6 من المواصفات).
// جدول: الرقم، الوقت، المتجر، العميل، الإجمالي، الحالة. فلترة بالحالة، والضغط على صف يفتح الطلب.
// الصفحة تشترك في تغييرات جدول orders، فيظهر الطلب الجديد فورًا دون تحديث المتصفح.
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { formatMoney } from '@/lib/money';
import { type OrderStatus, statusLabel } from '@/lib/orderStatus';
import { supabase } from '@/lib/supabase';
import { colors, fonts } from '@/theme';

type Order = {
  id: string;
  order_number: number;
  created_at: string;
  status: OrderStatus;
  total: number;
  customer_name: string;
  stores: { name_ar: string } | null;
};

const FILTERS: (OrderStatus | 'all')[] = [
  'all',
  'pending',
  'accepted',
  'preparing',
  'on_the_way',
  'delivered',
  'rejected',
  'cancelled',
];

// 2026-11-12 14:05 بأرقام 0–9 المعتادة
function dateTime(iso: string): string {
  const d = new Date(iso);
  const two = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())} ${two(d.getHours())}:${two(d.getMinutes())}`;
}

export default function AdminOrders() {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all');
  const [orders, setOrders] = useState<Order[] | null>(null); // null = ما زالت تُحمّل
  const [error, setError] = useState(false);

  // المدير يقرأ كل الطلبات (قاعدة RLS). الأحدث أولًا.
  const load = useCallback(() => {
    setError(false);
    let query = supabase
      .from('orders')
      .select('id, order_number, created_at, status, total, customer_name, stores (name_ar)')
      .order('created_at', { ascending: false });
    if (filter !== 'all') query = query.eq('status', filter);
    query.returns<Order[]>().then(({ data, error }) => {
      if (error) setError(true);
      else setOrders(data);
    });
  }, [filter]);

  // نعيد الجلب عند العودة من صفحة التفاصيل، فتظهر الحالة التي غيّرناها هناك
  useFocusEffect(load);

  // أي طلب جديد أو تغيّر حالة: نعيد جلب القائمة. نلغي الاشتراك عند مغادرة الصفحة.
  useEffect(() => {
    const channel = supabase
      .channel('admin-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, load)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>{t('admin.title')}</Text>

      <View style={styles.filters}>
        {FILTERS.map((f) => (
          <Pressable
            key={f}
            style={[styles.chip, f === filter && styles.chipActive]}
            onPress={() => setFilter(f)}
            accessibilityRole="button"
          >
            <Text style={styles.chipText}>{f === 'all' ? t('admin.all') : statusLabel(f)}</Text>
          </Pressable>
        ))}
      </View>

      {error ? (
        <View style={styles.center}>
          <Text style={styles.error}>{t('errors.noConnection')}</Text>
          <Button title={t('errors.retry')} onPress={load} />
        </View>
      ) : !orders ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.table}>
          <View style={[styles.row, styles.headRow]}>
            <Text style={[styles.head, styles.colSmall]}>{t('admin.number')}</Text>
            <Text style={[styles.head, styles.colTime]}>{t('admin.time')}</Text>
            <Text style={[styles.head, styles.col]}>{t('admin.store')}</Text>
            <Text style={[styles.head, styles.col]}>{t('admin.customer')}</Text>
            <Text style={[styles.head, styles.colSmall]}>{t('admin.total')}</Text>
            <Text style={[styles.head, styles.colSmall]}>{t('admin.status')}</Text>
          </View>
          {orders.length === 0 && <Text style={styles.empty}>{t('admin.empty')}</Text>}
          {orders.map((o) => (
            <Pressable
              key={o.id}
              style={styles.row}
              onPress={() => router.push({ pathname: '/admin/order/[id]', params: { id: o.id } })}
              accessibilityRole="button"
            >
              <Text style={[styles.cell, styles.colSmall, styles.bold]}>{o.order_number}</Text>
              <Text style={[styles.cell, styles.colTime, styles.ltr]}>{dateTime(o.created_at)}</Text>
              <Text style={[styles.cell, styles.col]}>{o.stores?.name_ar ?? ''}</Text>
              <Text style={[styles.cell, styles.col]}>{o.customer_name}</Text>
              <Text style={[styles.cell, styles.colSmall, styles.ltr]}>{formatMoney(o.total)}</Text>
              <Text
                style={[
                  styles.cell,
                  styles.colSmall,
                  styles.bold,
                  o.status === 'pending' && styles.statusNew,
                  o.status === 'delivered' && styles.statusDone,
                  (o.status === 'rejected' || o.status === 'cancelled') && styles.statusEnded,
                ]}
              >
                {statusLabel(o.status)}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, padding: 24, gap: 16 },
  title: { fontFamily: fonts.bold, fontSize: 24, color: colors.text },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontFamily: fonts.bold, fontSize: 14, color: colors.text },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  table: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 52,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headRow: { backgroundColor: colors.background },
  head: { fontFamily: fonts.bold, fontSize: 13, color: colors.textSecondary },
  cell: { fontFamily: fonts.regular, fontSize: 14, color: colors.text },
  col: { flex: 2 },
  colSmall: { flex: 1 },
  colTime: { flex: 1.5 },
  bold: { fontFamily: fonts.bold },
  // الأرقام والأسعار والأوقات تُقرأ من اليسار إلى اليمين (القسم 7)
  ltr: { writingDirection: 'ltr', textAlign: 'right' },
  statusNew: { color: colors.primaryDark },
  statusDone: { color: colors.success },
  statusEnded: { color: colors.danger },
  empty: { fontFamily: fonts.regular, fontSize: 15, color: colors.textSecondary, textAlign: 'center', padding: 32 },
  error: { fontFamily: fonts.regular, fontSize: 15, color: colors.danger },
});
