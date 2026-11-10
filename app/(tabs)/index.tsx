// الرئيسية (الشاشة 3): شريط التصنيفات ثم بطاقات المتاجر.
// العنوان الحالي في الأعلى يُضاف مع العناوين في المرحلة 7.
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { StoreCard, type Store } from '@/components/StoreCard';
import { supabase } from '@/lib/supabase';
import { colors, fonts } from '@/theme';

type Category = { id: string; name_ar: string };

export default function Home() {
  const { t } = useTranslation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [stores, setStores] = useState<Store[] | null>(null); // null = ما زال يُحمّل
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0); // يزيد مع كل "إعادة المحاولة"
  const [categoryId, setCategoryId] = useState<string | null>(null); // null = الكل

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
