// تبويب حسابي: الاسم والهاتف وزر تسجيل الخروج. الزائر يُحوَّل إلى شاشة الدخول.
import type { Session } from '@supabase/supabase-js';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { authErrorKey } from '@/lib/authError';
import { supabase } from '@/lib/supabase';
import { colors, fonts } from '@/theme';

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

  return (
    <View style={styles.screen}>
      {error ? (
        <>
          <Text style={styles.error}>{error}</Text>
          <Pressable style={styles.button} onPress={retry}>
            <Text style={styles.buttonText}>{t('errors.retry')}</Text>
          </Pressable>
        </>
      ) : !profile ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        <>
          <Text style={styles.name}>{profile.full_name}</Text>
          <Text style={styles.phone}>{profile.phone}</Text>
          <Pressable style={styles.button} onPress={logout}>
            <Text style={styles.buttonText}>{t('auth.logout')}</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
  name: { fontFamily: fonts.bold, fontSize: 24, color: colors.text, textAlign: 'center' },
  // رقم الهاتف يُقرأ من اليسار إلى اليمين حتى في واجهة عربية
  phone: {
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    writingDirection: 'ltr',
  },
  error: { fontFamily: fonts.regular, fontSize: 15, color: colors.danger, textAlign: 'center' },
  button: {
    height: 54,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  buttonText: { fontFamily: fonts.bold, fontSize: 17, color: colors.text },
});
