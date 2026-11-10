// شاشة إنشاء حساب (الشاشة 2 في المواصفات). بعد النجاح يدخل العميل تلقائيًا.
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { authErrorKey } from '@/lib/authError';
import { normalizePhone, phoneToEmail } from '@/lib/phone';
import { supabase } from '@/lib/supabase';
import { colors, fonts } from '@/theme';

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
      <Text style={styles.title}>{t('auth.register')}</Text>

      <View style={styles.field}>
        <Text style={styles.label}>{t('auth.fullName')}</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          accessibilityLabel={t('auth.fullName')}
        />
        {!!fieldErrors.name && <Text style={styles.error}>{fieldErrors.name}</Text>}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>{t('auth.phone')}</Text>
        <TextInput
          style={[styles.input, styles.ltr]}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          placeholder="091 234 5678"
          placeholderTextColor={colors.textSecondary}
          accessibilityLabel={t('auth.phone')}
        />
        {!!fieldErrors.phone && <Text style={styles.error}>{fieldErrors.phone}</Text>}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>{t('auth.password')}</Text>
        <TextInput
          style={[styles.input, styles.ltr]}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          accessibilityLabel={t('auth.password')}
        />
        {!!fieldErrors.password && <Text style={styles.error}>{fieldErrors.password}</Text>}
      </View>

      {!!error && <Text style={styles.error}>{error}</Text>}

      <Pressable style={[styles.button, busy && styles.busy]} onPress={submit} disabled={busy}>
        <Text style={styles.buttonText}>{t('auth.register')}</Text>
      </Pressable>

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
  content: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 72, paddingBottom: 32, gap: 20 },
  title: { fontFamily: fonts.bold, fontSize: 28, color: colors.text, textAlign: 'center' },
  secondary: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
  },
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
  // الأرقام وكلمة المرور تُكتب من اليسار إلى اليمين
  ltr: { writingDirection: 'ltr' },
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
});
