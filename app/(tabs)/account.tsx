// تبويب حسابي: الاسم والهاتف، روابط عناويني وطلباتي، وزر تسجيل الخروج. الزائر يُحوَّل إلى شاشة الدخول.
import type { Session } from '@supabase/supabase-js';
import { type Href, Redirect, router } from 'expo-router';
import { type ReactNode, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';

import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { authErrorKey } from '@/lib/authError';
import { supabase } from '@/lib/supabase';
import { card, colors, fonts, shadows } from '@/theme';

type Profile = { full_name: string; phone: string };

export default function Account() {
  const { t } = useTranslation();
  // undefined = لم نعرف بعد، null = زائر، غير ذلك = مسجّل الدخول
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0); // يزيد مع كل "إعادة المحاولة"

  // Supabase يخبرنا بالجلسة المحفوظة فور الاشتراك، ثم عند كل دخول أو خروج.
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  const userId = session?.user.id;

  // يجلب صف العميل من جدول profiles. يُعاد عند تغيّر المستخدم أو الضغط على إعادة المحاولة.
  useEffect(() => {
    if (!userId) return;
    supabase
      .from('profiles')
      .select('full_name, phone')
      .eq('id', userId)
      .single()
      .then(({ data, error }) => {
        if (error) setError(t('errors.noConnection'));
        else setProfile(data);
      });
  }, [userId, attempt, t]);

  function retry() {
    setError('');
    setAttempt(attempt + 1);
  }

  async function logout() {
    const { error } = await supabase.auth.signOut();
    if (error) setError(t(authErrorKey(error)));
  }

  if (session === null) return <Redirect href="/login" />;

  if (error) {
    return (
      <SafeAreaView edges={['top']} style={[styles.screen, styles.center]}>
        <EmptyState
          icon={<Path d="M2 8.5a15 15 0 0120 0M5.5 12a10 10 0 0113 0M9 15.5a5 5 0 016 0M12 19h.01M3 3l18 18" />}
          message={error}
          action={<Button title={t('errors.retry')} onPress={retry} />}
        />
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView edges={['top']} style={[styles.screen, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <Text style={styles.title}>{t('tabs.account')}</Text>

      <View style={styles.content}>
        <View style={styles.profile}>
          {/* الحرف الأول من الاسم بدل الصورة الشخصية */}
          <View style={styles.avatar}>
            <Text style={styles.initial}>{profile.full_name.trim().charAt(0)}</Text>
          </View>
          <View style={styles.grow}>
            <Text style={styles.name} numberOfLines={1}>
              {profile.full_name}
            </Text>
            <Text style={styles.phone}>{profile.phone}</Text>
          </View>
        </View>

        <View style={styles.menu}>
          <MenuRow
            title={t('addresses.title')}
            href="/addresses"
            icon={
              <>
                <Path d="M12 22s7-7.5 7-12.5A7 7 0 005 9.5C5 14.5 12 22 12 22z" />
                <Circle cx={12} cy={9.5} r={2.5} />
              </>
            }
          />
          <View style={styles.divider} />
          <MenuRow
            title={t('tabs.orders')}
            href="/orders"
            icon={<Path d="M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6" />}
          />
        </View>

        <Button
          variant="danger"
          title={t('auth.logout')}
          onPress={logout}
          icon={
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={colors.danger} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M9 4H5v16h4M15 8l4 4-4 4M19 12H9" />
            </Svg>
          }
        />
      </View>
    </SafeAreaView>
  );
}

// سطر في قائمة الحساب: أيقونة في دائرة، ثم العنوان، ثم سهم
function MenuRow({ title, href, icon }: { title: string; href: Href; icon: ReactNode }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      onPress={() => router.push(href)}
      accessibilityRole="button"
    >
      <View style={styles.rowIcon}>
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={colors.primaryDark} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          {icon}
        </Svg>
      </View>
      <Text style={styles.rowText}>{title}</Text>
      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.stepIdle} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
        <Path d="M15 6l-6 6 6 6" />
      </Svg>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  center: { justifyContent: 'center', padding: 24 },
  title: { fontFamily: fonts.bold, fontSize: 26, lineHeight: 40, color: colors.text, padding: 16, paddingBottom: 8 },
  content: { paddingHorizontal: 16, paddingTop: 4, gap: 16 },
  profile: { ...card, flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.primary,
  },
  // الحرف داكن على البرتقالي (قاعدة التباين في القسم 7)
  initial: { fontFamily: fonts.bold, fontSize: 28, color: colors.text },
  grow: { flex: 1, gap: 2 },
  name: { fontFamily: fonts.bold, fontSize: 20, lineHeight: 32, color: colors.text },
  // رقم الهاتف يُقرأ من اليسار إلى اليمين حتى في واجهة عربية
  phone: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.textSecondary,
    writingDirection: 'ltr',
    textAlign: 'right',
  },
  menu: { ...card, paddingVertical: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 60 },
  pressed: { opacity: 0.6 },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1, fontFamily: fonts.medium, fontSize: 16, color: colors.text },
  divider: { height: 1, backgroundColor: colors.border },
});
