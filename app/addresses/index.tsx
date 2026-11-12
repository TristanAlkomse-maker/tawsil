// عناويني (الشاشة 7): قائمة العناوين مع المنطقة والرسوم.
// الضغط على عنوان يختاره (يصبح الافتراضي) ويعود للشاشة السابقة. وفي كل عنوان زر حذف.
import type { Session } from '@supabase/supabase-js';
import { Redirect, router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { Button } from '@/components/Button';
import { selectedAddress } from '@/lib/address';
import { formatMoney } from '@/lib/money';
import { supabase } from '@/lib/supabase';
import { colors, fonts } from '@/theme';

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
      <View style={styles.header}>
        <Pressable style={styles.back} onPress={() => router.back()} accessibilityLabel={t('browse.back')}>
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={colors.text} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M9 6l6 6-6 6" />
          </Svg>
        </Pressable>
        <Text style={styles.title}>{t('addresses.title')}</Text>
      </View>

      {error ? (
        <View style={styles.center}>
          <Text style={styles.error}>{t('errors.noConnection')}</Text>
          <Button title={t('errors.retry')} onPress={load} />
        </View>
      ) : !addresses ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={addresses}
          keyExtractor={(a) => a.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>{t('addresses.empty')}</Text>}
          renderItem={({ item }) => {
            const active = item.id === selected?.id;
            return (
              <View style={[styles.card, active && styles.cardActive]}>
                <Pressable
                  style={styles.info}
                  onPress={() => choose(item.id)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                >
                  <Text style={styles.name}>
                    {item.label}
                    {active && <Text style={styles.selected}>{`  ${t('addresses.selected')}`}</Text>}
                  </Text>
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
  list: { paddingHorizontal: 16, gap: 12, paddingBottom: 16 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 14,
    gap: 8,
  },
  // العنوان المختار بإطار برتقالي
  cardActive: { borderColor: colors.primary, borderWidth: 2 },
  info: { flex: 1, gap: 4 },
  name: { fontFamily: fonts.bold, fontSize: 16, color: colors.text },
  selected: { fontFamily: fonts.bold, fontSize: 13, color: colors.primaryDark },
  secondary: { fontFamily: fonts.regular, fontSize: 14, color: colors.textSecondary },
  ltr: { writingDirection: 'ltr' },
  delete: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  empty: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 32,
  },
  error: { fontFamily: fonts.regular, fontSize: 15, color: colors.danger, textAlign: 'center' },
  footer: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16 },
});
