// إضافة عنوان (الشاشة 8): التسمية، قائمة المناطق مع رسومها، الخريطة بالدبوس، الوصف.
// العنوان الجديد يصبح هو المختار، لأن العميل أضافه ليوصَل إليه.
import type { Session } from '@supabase/supabase-js';
import { Redirect, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { Button } from '@/components/Button';
import { MapPicker, type Point } from '@/components/MapPicker';
import { formatMoney } from '@/lib/money';
import { supabase } from '@/lib/supabase';
import { colors, fonts } from '@/theme';

type Zone = { id: string; name_ar: string; delivery_fee: number };

export default function NewAddress() {
  const { t } = useTranslation();
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [zones, setZones] = useState<Zone[] | null>(null); // null = ما زالت تُحمّل
  const [attempt, setAttempt] = useState(0);
  const [label, setLabel] = useState('');
  const [zone, setZone] = useState<Zone | null>(null);
  const [zonesOpen, setZonesOpen] = useState(false); // قائمة المناطق مفتوحة أم مطوية
  const [point, setPoint] = useState<Point | null>(null);
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
  }, []);

  // قواعد RLS تُرجع المناطق النشطة فقط
  useEffect(() => {
    supabase
      .from('zones')
      .select('id, name_ar, delivery_fee')
      .order('sort_order')
      .then(({ data, error }) => {
        if (error) setError(true);
        else setZones(data);
      });
  }, [attempt]);

  function retry() {
    setError(false);
    setAttempt(attempt + 1);
  }

  async function save() {
    if (!session || !zone) return;
    setSaving(true);
    setError(false);
    // عنوان مختار واحد فقط: نلغي الاختيار عن البقية ثم نضيف الجديد مختارًا
    const unset = await supabase.from('addresses').update({ is_default: false }).eq('is_default', true);
    const insert = unset.error
      ? unset
      : await supabase.from('addresses').insert({
          user_id: session.user.id,
          label: label.trim(),
          zone_id: zone.id,
          description: description.trim(),
          lat: point?.lat,
          lng: point?.lng,
          is_default: true,
        });
    setSaving(false);
    if (insert.error) setError(true);
    else router.back();
  }

  if (session === null) return <Redirect href="/login" />;

  // الحقول الإلزامية: التسمية والمنطقة والوصف (الدبوس اختياري في قاعدة البيانات)
  const canSave = !!label.trim() && !!zone && !!description.trim() && !saving;

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Pressable style={styles.back} onPress={() => router.back()} accessibilityLabel={t('browse.back')}>
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={colors.text} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M9 6l6 6-6 6" />
          </Svg>
        </Pressable>
        <Text style={styles.title}>{t('addresses.new')}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.field}>
          <Text style={styles.label}>{t('addresses.label')}</Text>
          <TextInput
            style={styles.input}
            value={label}
            onChangeText={setLabel}
            placeholder={t('addresses.labelHint')}
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{t('addresses.zone')}</Text>
          {!zones ? (
            error ? null : <ActivityIndicator color={colors.primary} />
          ) : (
            <>
              <Pressable style={[styles.input, styles.zoneButton]} onPress={() => setZonesOpen(!zonesOpen)} accessibilityRole="button">
                <Text style={styles.inputText}>{zone ? zone.name_ar : t('addresses.chooseZone')}</Text>
                {zone && <Fee amount={zone.delivery_fee} />}
              </Pressable>
              {zonesOpen && (
                <View style={styles.zoneList}>
                  {zones.map((z) => (
                    <Pressable
                      key={z.id}
                      style={[styles.zoneRow, z.id === zone?.id && styles.zoneRowActive]}
                      onPress={() => {
                        setZone(z);
                        setZonesOpen(false);
                      }}
                      accessibilityRole="button"
                      accessibilityState={{ selected: z.id === zone?.id }}
                    >
                      <Text style={styles.inputText}>{z.name_ar}</Text>
                      <Fee amount={z.delivery_fee} />
                    </Pressable>
                  ))}
                </View>
              )}
            </>
          )}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{t('addresses.map')}</Text>
          <MapPicker onChange={setPoint} />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{t('addresses.description')}</Text>
          <TextInput
            style={styles.input}
            value={description}
            onChangeText={setDescription}
            placeholder={t('addresses.descriptionHint')}
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        {error && <Text style={styles.error}>{t('errors.noConnection')}</Text>}
        {error && !zones && <Button title={t('errors.retry')} onPress={retry} />}
      </ScrollView>

      <View style={styles.footer}>
        <Button title={t('addresses.save')} onPress={save} disabled={!canSave} />
      </View>
    </SafeAreaView>
  );
}

// "توصيل 10.00 د.ل" والمبلغ من اليسار إلى اليمين (القسم 7)
function Fee({ amount }: { amount: number }) {
  const { t } = useTranslation();
  return (
    <Text style={styles.fee}>
      {t('addresses.fee')} <Text style={styles.ltr}>{formatMoney(amount)}</Text>
    </Text>
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
  content: { paddingHorizontal: 16, gap: 14, paddingBottom: 16 },
  field: { gap: 6 },
  label: { fontFamily: fonts.bold, fontSize: 14, color: colors.text },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.text,
    textAlign: 'right',
  },
  inputText: { fontFamily: fonts.regular, fontSize: 16, color: colors.text },
  zoneButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  zoneList: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  zoneRow: {
    minHeight: 48,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  zoneRowActive: { backgroundColor: colors.background },
  fee: { fontFamily: fonts.regular, fontSize: 14, color: colors.textSecondary },
  ltr: { writingDirection: 'ltr' },
  error: { fontFamily: fonts.regular, fontSize: 15, color: colors.danger, textAlign: 'center' },
  footer: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16 },
});
