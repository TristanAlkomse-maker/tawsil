// الرئيسية (الشاشة 3): العنوان المختار في الأعلى، ثم شريط التصنيفات، ثم بطاقات المتاجر.
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Svg, { Circle, Path } from 'react-native-svg';

import { Button } from '@/components/Button';
import { StoreCard, type Store } from '@/components/StoreCard';
import { selectedAddress } from '@/lib/address';
import { supabase } from '@/lib/supabase';
import { colors, fonts } from '@/theme';

type Category = { id: string; name_ar: string };
type Address = { label: string; is_default: boolean; zones: { name_ar: string } };

export default function Home() {
  const { t } = useTranslation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [stores, setStores] = useState<Store[] | null>(null); // null = ما زال يُحمّل
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0); // يزيد مع كل "إعادة المحاولة"
  const [categoryId, setCategoryId] = useState<string | null>(null); // null = الكل
  const [address, setAddress] = useState<Address | null>(null); // null = زائر أو بلا عناوين

  // العنوان المختار يُجلب كلما ظهرت الشاشة، فيتحدّث بعد الرجوع من عناويني.
  // الزائر لا عناوين له (قاعدة البيانات ترفض طلبه أصلًا)، فلا نرسل الطلب.
  useFocusEffect(
    useCallback(() => {
      supabase.auth.getSession().then(async ({ data: { session } }) => {
        if (!session) return setAddress(null);
        const { data } = await supabase
          .from('addresses')
          .select('label, is_default, zones (name_ar)')
          .order('created_at')
          .returns<Address[]>();
        setAddress(selectedAddress(data ?? []));
      });
    }, []),
  );

  // نجلب التصنيفات والمتاجر معًا. قواعد RLS تُرجع المتاجر المعتمدة فقط.
  useEffect(() => {
    Promise.all([
      supabase.from('store_categories').select('id, name_ar').order('sort_order'),
      supabase
        .from('stores')
        .select('id, category_id, name_ar, description_ar, logo_url, prep_minutes, is_open')
        .order('name_ar'),
    ]).then(([cats, sts]) => {
      if (cats.error || sts.error) return setError(true);
      setCategories(cats.data);
      setStores(sts.data);
    });
  }, [attempt]);

  function retry() {
    setError(false);
    setStores(null);
    setAttempt(attempt + 1);
  }

  // الفلترة على الهاتف: المتاجر كلها محمّلة أصلًا، فلا داعي لطلب جديد مع كل ضغطة
  const shown = stores?.filter((s) => !categoryId || s.category_id === categoryId) ?? [];

  if (error) {
    return (
      <SafeAreaView style={[styles.screen, styles.center]}>
        <Text style={styles.error}>{t('errors.noConnection')}</Text>
        <Button title={t('errors.retry')} onPress={retry} />
      </SafeAreaView>
    );
  }

  if (!stores) {
    return (
      <SafeAreaView style={[styles.screen, styles.center]}>
        <ActivityIndicator color={colors.primary} />
      </SafeAreaView>
    );
  }

  const chips = [{ id: null, name_ar: t('browse.all') }, ...categories];

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      {/* الزائر يُحوَّل إلى الدخول من شاشة عناويني نفسها */}
      <Pressable style={styles.address} onPress={() => router.push('/addresses')} accessibilityRole="button">
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={colors.primaryDark} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M12 22s7-7.5 7-12.5A7 7 0 005 9.5C5 14.5 12 22 12 22z" />
          <Circle cx={12} cy={9.5} r={2.5} />
        </Svg>
        <View>
          <Text style={styles.addressHint}>{t('addresses.deliverTo')}</Text>
          <Text style={styles.addressText}>
            {address ? `${address.label}، ${address.zones.name_ar}` : t('addresses.addFirst')}
          </Text>
        </View>
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.textSecondary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M6 9l6 6 6-6" />
        </Svg>
      </Pressable>

      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {chips.map((c) => {
            const active = c.id === categoryId;
            return (
              <Pressable
                key={c.id ?? 'all'}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setCategoryId(c.id)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <Text style={styles.chipText}>{c.name_ar}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <FlatList
        data={shown}
        keyExtractor={(s) => s.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <StoreCard store={item} onPress={() => router.push({ pathname: '/store/[id]', params: { id: item.id } })} />
        )}
        ListEmptyComponent={<Text style={styles.empty}>{t('browse.noStores')}</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  center: { justifyContent: 'center', padding: 24, gap: 16 },
  address: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44, paddingHorizontal: 16, paddingTop: 16 },
  addressHint: { fontFamily: fonts.regular, fontSize: 12, color: colors.textSecondary },
  addressText: { fontFamily: fonts.bold, fontSize: 16, color: colors.text },
  chips: { gap: 8, paddingHorizontal: 16, paddingVertical: 12 },
  chip: {
    height: 44,
    paddingHorizontal: 18,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    justifyContent: 'center',
  },
  // التصنيف المختار برتقالي، ونصه يبقى داكنًا (قاعدة التباين في القسم 7: الأبيض على البرتقالي لا يُقرأ)
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontFamily: fonts.bold, fontSize: 14, color: colors.text },
  list: { paddingHorizontal: 16, paddingBottom: 16, gap: 12 },
  empty: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 32,
  },
  error: { fontFamily: fonts.regular, fontSize: 15, color: colors.danger, textAlign: 'center' },
});
