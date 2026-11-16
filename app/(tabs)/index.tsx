// الرئيسية (الشاشة 3): العنوان المختار في الأعلى، ثم شريط التصنيفات، ثم بطاقات المتاجر.
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Svg, { Circle, Path } from 'react-native-svg';

import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { StoreCard, type Store } from '@/components/StoreCard';
import { selectedAddress } from '@/lib/address';
import { supabase } from '@/lib/supabase';
import { colors, fonts, radius, shadows } from '@/theme';

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
        <EmptyState
          icon={<Path d="M2 8.5a15 15 0 0120 0M5.5 12a10 10 0 0113 0M9 15.5a5 5 0 016 0M12 19h.01M3 3l18 18" />}
          message={t('errors.noConnection')}
          action={<Button title={t('errors.retry')} onPress={retry} />}
        />
      </SafeAreaView>
    );
  }

  if (!stores) {
    return (
      <SafeAreaView style={[styles.screen, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  const chips = [{ id: null, name_ar: t('browse.all') }, ...categories];

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      {/* الزائر يُحوَّل إلى الدخول من شاشة عناويني نفسها */}
      <Pressable
        style={({ pressed }) => [styles.address, pressed && styles.pressed]}
        onPress={() => router.push('/addresses')}
        accessibilityRole="button"
      >
        <View style={styles.pin}>
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={colors.primaryDark} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M12 22s7-7.5 7-12.5A7 7 0 005 9.5C5 14.5 12 22 12 22z" />
            <Circle cx={12} cy={9.5} r={2.5} />
          </Svg>
        </View>
        <View style={styles.addressInfo}>
          <Text style={styles.addressHint}>{t('addresses.deliverTo')}</Text>
          <Text style={styles.addressText} numberOfLines={1}>
            {address ? `${address.label}، ${address.zones.name_ar}` : t('addresses.addFirst')}
          </Text>
        </View>
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={colors.textSecondary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M6 9l6 6 6-6" />
        </Svg>
      </Pressable>

      <Text style={styles.heading}>{t('browse.heading')}</Text>

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
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{c.name_ar}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <FlatList
        data={shown}
        keyExtractor={(s) => s.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <StoreCard
            store={item}
            category={categories.find((c) => c.id === item.category_id)?.name_ar}
            onPress={() => router.push({ pathname: '/store/[id]', params: { id: item.id } })}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon={<Path d="M4 9l1.5-5h13L20 9M4 9v11h16V9M4 9h16M9 20v-6h6v6" />}
            message={t('browse.noStores')}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  center: { justifyContent: 'center', padding: 24, gap: 16 },
  address: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 16,
    marginTop: 12,
    padding: 10,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    ...shadows.card,
  },
  pressed: { opacity: 0.85 },
  pin: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressInfo: { flex: 1 },
  addressHint: { fontFamily: fonts.regular, fontSize: 12, color: colors.textSecondary },
  addressText: { fontFamily: fonts.bold, fontSize: 16, color: colors.text },
  heading: {
    fontFamily: fonts.bold,
    fontSize: 24,
    lineHeight: 36,
    color: colors.text,
    paddingHorizontal: 16,
    marginTop: 20,
  },
  chips: { gap: 8, paddingHorizontal: 16, paddingVertical: 14 },
  chip: {
    height: 44,
    paddingHorizontal: 20,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    ...shadows.card,
  },
  // التصنيف المختار برتقالي، ونصه يبقى داكنًا (قاعدة التباين في القسم 7: الأبيض على البرتقالي لا يُقرأ)
  chipActive: { backgroundColor: colors.primary, ...shadows.primary },
  chipText: { fontFamily: fonts.medium, fontSize: 14, color: colors.textSecondary },
  chipTextActive: { fontFamily: fonts.bold, color: colors.text },
  list: { paddingHorizontal: 16, paddingTop: 2, paddingBottom: 24, gap: 12 },
});
