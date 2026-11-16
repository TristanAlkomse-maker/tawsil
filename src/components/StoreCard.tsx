// بطاقة متجر في الرئيسية. المتجر المغلق يظهر باهتًا وعليه وسم "مغلق"، لكنه يُفتح للتصفح.
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { Picture } from '@/components/Picture';
import { card, colors, fonts, radius } from '@/theme';

export type Store = {
  id: string;
  category_id: string;
  name_ar: string;
  description_ar: string | null;
  logo_url: string | null;
  prep_minutes: number;
  is_open: boolean;
};

// category: اسم تصنيف المتجر، تُختار منه الصورة الافتراضية إن لم يدل اسم المتجر على نوعه
type Props = { store: Store; category?: string; onPress: () => void };

export function StoreCard({ store, category, onPress }: Props) {
  const { t } = useTranslation();

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
    >
      <View style={[styles.row, !store.is_open && styles.dim]}>
        <Picture
          source={store.logo_url}
          name={store.name_ar}
          hint={`${store.description_ar ?? ''} ${category ?? ''}`}
          style={styles.logo}
        />
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {store.name_ar}
          </Text>
          {!!store.description_ar && (
            <Text style={styles.secondary} numberOfLines={1}>
              {store.description_ar}
            </Text>
          )}
          <View style={styles.metaRow}>
            <View style={[styles.badge, store.is_open ? styles.open : styles.closed]}>
              <View style={[styles.dot, { backgroundColor: store.is_open ? colors.success : colors.dangerDark }]} />
              <Text style={[styles.badgeText, { color: store.is_open ? colors.success : colors.dangerDark }]}>
                {t(store.is_open ? 'browse.open' : 'browse.closed')}
              </Text>
            </View>
            <View style={styles.time}>
              <Svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={colors.textSecondary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <Circle cx={12} cy={12} r={9} />
                <Path d="M12 7v5l3 2" />
              </Svg>
              <Text style={styles.meta}>{t('browse.minutes', { n: store.prep_minutes })}</Text>
            </View>
          </View>
        </View>
        {/* سهم صغير يوحي بأن البطاقة تُفتح (يشير لليسار في واجهة RTL) */}
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.stepIdle} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M15 6l-6 6 6 6" />
        </Svg>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { ...card, padding: 12 },
  pressed: { transform: [{ scale: 0.985 }], opacity: 0.92 },
  row: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  dim: { opacity: 0.6 },
  logo: { width: 84, height: 84, borderRadius: radius.md },
  info: { flex: 1, gap: 6 },
  name: { fontFamily: fonts.bold, fontSize: 17, color: colors.text },
  secondary: { fontFamily: fonts.regular, fontSize: 14, color: colors.textSecondary },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 2 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontFamily: fonts.bold, fontSize: 12 },
  open: { backgroundColor: colors.successSoft },
  closed: { backgroundColor: colors.dangerSoft },
  time: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  meta: { fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary },
});
