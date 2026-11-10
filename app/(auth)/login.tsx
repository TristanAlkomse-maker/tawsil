// شاشة تسجيل الدخول (الشاشة 1 في المواصفات، والشكل من ملف التصميم).
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { authErrorKey } from '@/lib/authError';
import { normalizePhone, phoneToEmail } from '@/lib/phone';
import { supabase } from '@/lib/supabase';
import { colors, fonts } from '@/theme';

export default function Login() {
  const { t } = useTranslation();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError('');
    // نفحص الرقم على الهاتف أولًا، فلا نرسل شيئًا إذا كان خاطئًا
    const normalized = normalizePhone(phone);
    setPhoneError(normalized ? '' : t('auth.invalidPhone'));
    if (!normalized) return;

    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: phoneToEmail(normalized),
      password,
    });
    setBusy(false);

    if (error) setError(t(authErrorKey(error)));
    else router.replace('/');
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <Svg width={84} height={84} viewBox="0 0 112 112">
          <Rect width={112} height={112} rx={28} fill={colors.primary} />
          <Path
            d="M62 22c-13.3 0-24 10.4-24 23.3C38 62.6 62 90 62 90s24-27.4 24-44.7C86 32.4 75.3 22 62 22z"
            fill={colors.surface}
          />
          <Circle cx={62} cy={45} r={9} fill={colors.primary} />
          <Path
            d="M18 40h12M14 54h16M20 68h12"
            stroke={colors.surface}
            strokeWidth={6}
            strokeLinecap="round"
          />
        </Svg>
        <Text style={styles.title}>{t('appName')}</Text>
        <Text style={styles.secondary}>{t('auth.tagline')}</Text>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>{t('auth.phone')}</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          placeholder="091 234 5678"
          placeholderTextColor={colors.textSecondary}
          accessibilityLabel={t('auth.phone')}
        />
        {!!phoneError && <Text style={styles.error}>{phoneError}</Text>}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>{t('auth.password')}</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          accessibilityLabel={t('auth.password')}
        />
      </View>

      {!!error && <Text style={styles.error}>{error}</Text>}

      <Pressable style={[styles.button, busy && styles.busy]} onPress={submit} disabled={busy}>
        <Text style={styles.buttonText}>{t('auth.login')}</Text>
      </Pressable>

      <Text style={styles.secondary}>
        {t('auth.noAccount')}{' '}
        <Link href="/register" replace style={styles.link}>
          {t('auth.createAccount')}
        </Link>
      </Text>

      <View style={{ flex: 1 }} />

      <Link href="/" replace style={[styles.secondary, styles.guest]}>
        {t('auth.browseAsGuest')}
      </Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 72, paddingBottom: 32, gap: 20 },
  header: { alignItems: 'center', gap: 12, marginBottom: 8 },
  title: { fontFamily: fonts.bold, fontSize: 34, color: colors.text },
  secondary: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  field: { gap: 6 },
  label: { fontFamily: fonts.bold, fontSize: 14, color: colors.text },
  // الأرقام وكلمة المرور تُكتب من اليسار إلى اليمين لكنها تُحاذى يمينًا كما في التصميم
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
    writingDirection: 'ltr',
    textAlign: 'right',
  },
  error: { fontFamily: fonts.regular, fontSize: 14, color: colors.danger },
  button: {
    height: 54,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  busy: { opacity: 0.6 },
  buttonText: { fontFamily: fonts.bold, fontSize: 17, color: colors.text },
  link: { fontFamily: fonts.bold, color: colors.primaryDark },
  guest: { padding: 12 },
});
