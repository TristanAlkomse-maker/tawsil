// شاشة إنشاء حساب (الشاشة 2 في المواصفات). بعد النجاح يدخل العميل تلقائيًا.
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { authErrorKey } from '@/lib/authError';
import { normalizePhone, phoneToEmail } from '@/lib/phone';
import { supabase } from '@/lib/supabase';
import { card, colors, fonts, radius } from '@/theme';

export default function Register() {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  // رسالة تحت كل حقل خاطئ، ورسالة عامة لما يرفضه الخادم
  const [fieldErrors, setFieldErrors] = useState({ name: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError('');
    const fullName = name.trim();
    const normalized = normalizePhone(phone);
    const errors = {
      name: fullName ? '' : t('auth.nameRequired'),
      phone: normalized ? '' : t('auth.invalidPhone'),
      password: password.length >= 8 ? '' : t('auth.passwordTooShort'),
    };
    setFieldErrors(errors);
    if (!normalized || errors.name || errors.password) return;

    setBusy(true);
    // الاسم والهاتف يذهبان مع الحساب، ودالة handle_new_user في قاعدة البيانات
    // تنسخهما إلى جدول profiles.
    const { data, error } = await supabase.auth.signUp({
      email: phoneToEmail(normalized),
      password,
      options: { data: { full_name: fullName, phone: normalized } },
    });
    setBusy(false);

    if (error) setError(t(authErrorKey(error)));
    // لا جلسة = "تأكيد البريد" ما زال مفعّلًا في لوحة Supabase، فالعميل لم يدخل فعلًا
    else if (!data.session) setError(t('errors.generic'));
    else router.replace('/');
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <Text style={styles.title}>{t('auth.register')}</Text>
        <Text style={styles.secondary}>{t('auth.createTagline')}</Text>
      </View>

      <View style={styles.form}>
        <Input label={t('auth.fullName')} value={name} onChangeText={setName} error={fieldErrors.name} />
        <Input
          label={t('auth.phone')}
          ltr
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          placeholder="091 234 5678"
          error={fieldErrors.phone}
        />
        <Input
          label={t('auth.password')}
          ltr
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          error={fieldErrors.password}
        />

        {!!error && <Text style={styles.error}>{error}</Text>}

        <Button title={t('auth.register')} onPress={submit} loading={busy} />
      </View>

      <Text style={styles.secondary}>
        {t('auth.haveAccount')}{' '}
        <Link href="/login" replace style={styles.link}>
          {t('auth.signIn')}
        </Link>
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 72, paddingBottom: 32, gap: 20 },
  header: { alignItems: 'center', gap: 4, marginBottom: 8 },
  title: { fontFamily: fonts.bold, fontSize: 30, lineHeight: 46, color: colors.text, textAlign: 'center' },
  secondary: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  // الحقول والزر في بطاقة واحدة
  form: { ...card, padding: 20, gap: 16 },
  error: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.dangerDark,
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.sm,
    paddingVertical: 10,
    paddingHorizontal: 12,
    textAlign: 'center',
    overflow: 'hidden',
  },
  link: { fontFamily: fonts.bold, color: colors.primaryDark },
});
