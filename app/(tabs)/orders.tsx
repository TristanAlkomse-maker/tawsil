// تبويب طلباتي (الشاشة 11): الطلبات النشطة أولًا ثم السابقة. الضغط على طلب يفتح تتبعه.
// الزائر يُحوَّل إلى شاشة الدخول (القسم 6).
import type { Session } from '@supabase/supabase-js';
import { Redirect, router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, SectionList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Path } from 'react-native-svg';

import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { formatMoney } from '@/lib/money';
import { isActive, type OrderStatus, statusLabel } from '@/lib/orderStatus';
import { supabase } from '@/lib/supabase';
import { card, colors, fonts, radius } from '@/theme';

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

  // طلبات هذا المستخدم فقط، الأحدث أولًا. الفلتر بـ customer_id ضروري:
  // قواعد RLS تسمح للمدير بقراءة كل الطلبات، فبدونه يرى المدير طلبات الجميع هنا.
  // نعيد الجلب كلما ظهر التبويب، فتظهر الحالات الجديدة.
  const load = useCallback(() => {
    if (!session) return;
    setError(false);
    supabase
      .from('orders')
      .select('id, order_number, status, total, stores (name_ar)')
      .eq('customer_id', session.user.id)
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
          <EmptyState
            icon={<Path d="M2 8.5a15 15 0 0120 0M5.5 12a10 10 0 0113 0M9 15.5a5 5 0 016 0M12 19h.01M3 3l18 18" />}
            message={t('errors.noConnection')}
            action={<Button title={t('errors.retry')} onPress={load} />}
          />
        </View>
      ) : !orders ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(o) => o.id}
          contentContainerStyle={styles.list}
          stickySectionHeadersEnabled={false}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              icon={<Path d="M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6" />}
              message={t('order.empty')}
              action={<Button title={t('cart.browse')} onPress={() => router.push('/')} />}
            />
          }
          renderSectionHeader={({ section }) => <Text style={styles.section}>{section.title}</Text>}
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [styles.card, pressed && styles.pressed]}
              onPress={() => router.push({ pathname: '/order/[id]', params: { id: item.id } })}
              accessibilityRole="button"
            >
              <View style={styles.grow}>
                <Text style={styles.name} numberOfLines={1}>
                  {item.stores?.name_ar ?? ''}
                </Text>
                <Text style={styles.secondary}>{t('order.number', { n: item.order_number })}</Text>
              </View>
              <View style={styles.end}>
                <View
                  style={[
                    styles.badge,
                    isActive(item.status) && styles.badgeActive,
                    item.status === 'delivered' && styles.badgeDone,
                    (item.status === 'rejected' || item.status === 'cancelled') && styles.badgeEnded,
                  ]}
                >
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
                </View>
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
  title: { fontFamily: fonts.bold, fontSize: 26, lineHeight: 40, color: colors.text, padding: 16, paddingBottom: 4 },
  center: { flex: 1, justifyContent: 'center', padding: 24, gap: 16 },
  list: { paddingHorizontal: 16, paddingBottom: 24, gap: 12 },
  section: { fontFamily: fonts.bold, fontSize: 15, color: colors.textSecondary, marginTop: 12 },
  card: { ...card, flexDirection: 'row', alignItems: 'center', gap: 12 },
  pressed: { transform: [{ scale: 0.985 }], opacity: 0.92 },
  grow: { flex: 1, gap: 4 },
  end: { alignItems: 'flex-end', gap: 6 },
  name: { fontFamily: fonts.bold, fontSize: 16, color: colors.text },
  secondary: { fontFamily: fonts.regular, fontSize: 14, color: colors.textSecondary },
  // وسم الحالة: كبسولة بدرجة فاتحة من لون النص نفسه
  badge: { borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 3, backgroundColor: colors.neutralSoft },
  badgeActive: { backgroundColor: colors.primaryTint },
  badgeDone: { backgroundColor: colors.successSoft },
  badgeEnded: { backgroundColor: colors.dangerSoft },
  status: { fontFamily: fonts.bold, fontSize: 13, color: colors.textSecondary },
  statusActive: { color: colors.primaryDark },
  statusDone: { color: colors.success },
  statusEnded: { color: colors.dangerDark },
  // الأسعار تُقرأ من اليسار إلى اليمين (القسم 7)
  amount: { fontFamily: fonts.bold, fontSize: 15, color: colors.text, writingDirection: 'ltr' },
});
