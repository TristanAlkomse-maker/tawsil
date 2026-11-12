// تبويب طلباتي (الشاشة 11): الطلبات النشطة أولًا ثم السابقة. الضغط على طلب يفتح تتبعه.
// الزائر يُحوَّل إلى شاشة الدخول (القسم 6).
import type { Session } from '@supabase/supabase-js';
import { Redirect, router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, SectionList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { formatMoney } from '@/lib/money';
import { isActive, type OrderStatus, statusLabel } from '@/lib/orderStatus';
import { supabase } from '@/lib/supabase';
import { colors, fonts } from '@/theme';

type Order = {
  id: string;
  order_number: number;
  status: OrderStatus;
  total: number;
  stores: { name_ar: string } | null;
};

export default function Orders() {
  const { t } = useTranslation();
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [orders, setOrders] = useState<Order[] | null>(null); // null = ما زالت تُحمّل
  const [error, setError] = useState(false);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  // قواعد RLS تُرجع طلبات هذا العميل فقط. الأحدث أولًا.
  // نعيد الجلب كلما ظهر التبويب، فتظهر الحالات الجديدة.
  const load = useCallback(() => {
    if (!session) return;
    setError(false);
    supabase
      .from('orders')
      .select('id, order_number, status, total, stores (name_ar)')
      .order('created_at', { ascending: false })
      .returns<Order[]>()
      .then(({ data, error }) => {
        if (error) setError(true);
        else setOrders(data);
      });
  }, [session]);
  useFocusEffect(load);

  if (session === null) return <Redirect href="/login" />;

  const active = orders?.filter((o) => isActive(o.status)) ?? [];
  const past = orders?.filter((o) => !isActive(o.status)) ?? [];
  // قسم بلا طلبات لا يظهر عنوانه
  const sections = [
    { title: t('order.active'), data: active },
    { title: t('order.past'), data: past },
  ].filter((s) => s.data.length > 0);

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <Text style={styles.title}>{t('tabs.orders')}</Text>

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
        <SectionList
          sections={sections}
          keyExtractor={(o) => o.id}
          contentContainerStyle={styles.list}
          stickySectionHeadersEnabled={false}
          ListEmptyComponent={<Text style={styles.empty}>{t('order.empty')}</Text>}
          renderSectionHeader={({ section }) => <Text style={styles.section}>{section.title}</Text>}
          renderItem={({ item }) => (
            <Pressable
              style={styles.card}
              onPress={() => router.push({ pathname: '/order/[id]', params: { id: item.id } })}
              accessibilityRole="button"
            >
              <View style={styles.grow}>
                <Text style={styles.name}>{item.stores?.name_ar ?? ''}</Text>
                <Text style={styles.secondary}>{t('order.number', { n: item.order_number })}</Text>
              </View>
              <View style={styles.end}>
                <Text
                  style={[
                    styles.status,
                    isActive(item.status) && styles.statusActive,
                    item.status === 'delivered' && styles.statusDone,
                    (item.status === 'rejected' || item.status === 'cancelled') && styles.statusEnded,
                  ]}
                >
                  {statusLabel(item.status)}
                </Text>
                <Text style={styles.amount}>{formatMoney(item.total)}</Text>
              </View>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  title: { fontFamily: fonts.bold, fontSize: 20, color: colors.text, padding: 16, paddingBottom: 4 },
  center: { flex: 1, justifyContent: 'center', padding: 24, gap: 16 },
  list: { paddingHorizontal: 16, paddingBottom: 16, gap: 12 },
  section: { fontFamily: fonts.bold, fontSize: 15, color: colors.textSecondary, marginTop: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 16,
  },
  grow: { flex: 1, gap: 4 },
  end: { alignItems: 'flex-end', gap: 4 },
  name: { fontFamily: fonts.bold, fontSize: 16, color: colors.text },
  secondary: { fontFamily: fonts.regular, fontSize: 14, color: colors.textSecondary },
  status: { fontFamily: fonts.bold, fontSize: 14, color: colors.textSecondary },
  statusActive: { color: colors.primaryDark },
  statusDone: { color: colors.success },
  statusEnded: { color: colors.danger },
  // الأسعار تُقرأ من اليسار إلى اليمين (القسم 7)
  amount: { fontFamily: fonts.regular, fontSize: 14, color: colors.text, writingDirection: 'ltr' },
  empty: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 32,
  },
  error: { fontFamily: fonts.regular, fontSize: 15, color: colors.danger, textAlign: 'center' },
});
