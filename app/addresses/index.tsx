// عناويني (الشاشة 7): قائمة العناوين مع المنطقة والرسوم.
// الضغط على عنوان يختاره (يصبح الافتراضي) ويعود للشاشة السابقة. وفي كل عنوان زر حذف.
import type { Session } from '@supabase/supabase-js';
import { Redirect, router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';

import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { ScreenHeader } from '@/components/ScreenHeader';
import { selectedAddress } from '@/lib/address';
import { formatMoney } from '@/lib/money';
import { supabase } from '@/lib/supabase';
import { card, colors, fonts, radius } from '@/theme';

type Address = {
  id: string;
  label: string;
  description: string;
  is_default: boolean;
  zones: { name_ar: string; delivery_fee: number };
};

export default function Addresses() {
  const { t } = useTranslation();
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [addresses, setAddresses] = useState<Address[] | null>(null); // null = ما زالت تُحمّل
  const [error, setError] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
  }, []);

  // قواعد RLS تُرجع عناوين هذا العميل فقط
  const load = useCallback(() => {
    setError(false);
    supabase
      .from('addresses')
      .select('id, label, description, is_default, zones (name_ar, delivery_fee)')
      .order('created_at')
      .returns<Address[]>()
      .then(({ data, error }) => {
        if (error) setError(true);
        else setAddresses(data);
      });
  }, []);

  // نعيد الجلب كلما ظهرت الشاشة، مثلًا بعد الرجوع من إضافة عنوان
  useFocusEffect(load);

  async function choose(id: string) {
    // عنوان مختار واحد فقط: نلغي الاختيار عن البقية ثم نختار هذا
    const unset = await supabase.from('addresses').update({ is_default: false }).eq('is_default', true);
    const set = unset.error ? unset : await supabase.from('addresses').update({ is_default: true }).eq('id', id);
    if (set.error) setError(true);
    else router.back();
  }

  // الحذف لا رجعة فيه، فنسأل أولًا
  function remove(id: string) {
    Alert.alert(t('addresses.deleteTitle'), t('addresses.deleteMessage'), [
      { text: t('cart.cancel'), style: 'cancel' },
      {
        text: t('addresses.delete'),
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('addresses').delete().eq('id', id);
          if (error) setError(true);
          else load();
        },
      },
    ]);
  }

  if (session === null) return <Redirect href="/login" />;

  const selected = addresses ? selectedAddress(addresses) : null;

  return (
    <SafeAreaView style={styles.screen}>
      <ScreenHeader title={t('addresses.title')} />

      {error ? (
        <View style={styles.center}>
          <EmptyState
            icon={<Path d="M2 8.5a15 15 0 0120 0M5.5 12a10 10 0 0113 0M9 15.5a5 5 0 016 0M12 19h.01M3 3l18 18" />}
            message={t('errors.noConnection')}
            action={<Button title={t('errors.retry')} onPress={load} />}
          />
        </View>
      ) : !addresses ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={addresses}
          keyExtractor={(a) => a.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              icon={
                <>
                  <Path d="M12 22s7-7.5 7-12.5A7 7 0 005 9.5C5 14.5 12 22 12 22z" />
                  <Circle cx={12} cy={9.5} r={2.5} />
                </>
              }
              message={t('addresses.empty')}
            />
          }
          renderItem={({ item }) => {
            const active = item.id === selected?.id;
            return (
              <View style={[styles.card, active && styles.cardActive]}>
                {/* دائرة الاختيار: ممتلئة للعنوان المختار */}
                <View style={[styles.radio, active && styles.radioActive]}>{active && <View style={styles.radioDot} />}</View>
                <Pressable
                  style={styles.info}
                  onPress={() => choose(item.id)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                >
                  <View style={styles.nameRow}>
                    <Text style={styles.name}>{item.label}</Text>
                    {active && <Text style={styles.selected}>{t('addresses.selected')}</Text>}
                  </View>
                  <Text style={styles.secondary}>
                    {item.zones.name_ar} · {t('addresses.fee')}{' '}
                    <Text style={styles.ltr}>{formatMoney(item.zones.delivery_fee)}</Text>
                  </Text>
                  <Text style={styles.secondary}>{item.description}</Text>
                </Pressable>
                <Pressable style={styles.delete} onPress={() => remove(item.id)} accessibilityLabel={t('addresses.delete')}>
                  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={colors.danger} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <Path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
                  </Svg>
                </Pressable>
              </View>
            );
          }}
        />
      )}

      <View style={styles.footer}>
        <Button title={t('addresses.new')} onPress={() => router.push('/addresses/new')} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', padding: 24, gap: 16 },
  list: { paddingHorizontal: 16, paddingTop: 4, gap: 12, paddingBottom: 16 },
  // الإطار الشفاف يحجز مكان الإطار البرتقالي، فلا تتحرك البطاقة عند الاختيار
  card: { ...card, flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12, borderWidth: 2, borderColor: 'transparent' },
  // العنوان المختار بإطار برتقالي وخلفية برتقالية خفيفة
  cardActive: { borderColor: colors.primary, backgroundColor: colors.primaryTint },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.stepIdle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: { borderColor: colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  info: { flex: 1, gap: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { fontFamily: fonts.bold, fontSize: 16, color: colors.text },
  selected: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.primaryDark,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 2,
    overflow: 'hidden',
  },
  secondary: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 22, color: colors.textSecondary },
  ltr: { writingDirection: 'ltr' },
  delete: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.dangerSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16 },
});
