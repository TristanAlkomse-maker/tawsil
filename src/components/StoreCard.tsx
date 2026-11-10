// بطاقة متجر في الرئيسية. المتجر المغلق يظهر باهتًا وعليه وسم "مغلق"، لكنه يُفتح للتصفح.
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts } from '@/theme';

export type Store = {
  id: string;
  category_id: string;
  name_ar: string;
  description_ar: string | null;
  logo_url: string | null;
  prep_minutes: number;
  is_open: boolean;
};

type Props = { store: Store; onPress: () => void };

export function StoreCard({ store, onPress }: Props) {
  const { t } = useTranslation();

  return (
    <Pressable style={styles.card} onPress={onPress} accessibilityRole="button">
      <View style={[styles.row, !store.is_open && styles.dim]}>
        {/* إن لم يكن للمتجر شعار يبقى مربعًا رصاصيًا */}
        <Image source={store.logo_url} style={styles.logo} />
        <View style={styles.info}>
          <View style={styles.titleRow}>
            <Text style={styles.name}>{store.name_ar}</Text>
            <Text style={[styles.badge, store.is_open ? styles.open : styles.closed]}>
              {t(store.is_open ? 'browse.open' : 'browse.closed')}
            </Text>
          </View>
          {!!store.description_ar && <Text style={styles.secondary}>{store.description_ar}</Text>}
          <Text style={styles.meta}>{t('browse.minutes', { n: store.prep_minutes })}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 12,
  },
  row: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  dim: { opacity: 0.6 },
  logo: { width: 76, height: 76, borderRadius: 14, backgroundColor: colors.placeholder },
  info: { flex: 1, gap: 6 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontFamily: fonts.bold, fontSize: 17, color: colors.text },
  badge: {
    fontFamily: fonts.bold,
    fontSize: 12,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    overflow: 'hidden',
  },
  open: { color: colors.success, backgroundColor: colors.successSoft },
  closed: { color: colors.dangerDark, backgroundColor: colors.dangerSoft },
  secondary: { fontFamily: fonts.regular, fontSize: 14, color: colors.textSecondary },
  meta: { fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary },
});
