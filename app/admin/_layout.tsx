// حارس صفحة الإدارة: يُنفَّذ قبل أي شاشة داخل مجلد admin.
// يسمح بالدخول فقط على المتصفح ولمن دوره admin، وغير ذلك يعيده للرئيسية (القسم 3 من المواصفات).
// هذا لراحة الواجهة فقط: الحماية الحقيقية في قاعدة البيانات (RLS و set_order_status).
import { Redirect, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';

import { supabase } from '@/lib/supabase';
import { colors } from '@/theme';

export default function AdminLayout() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null); // null = ما زلنا نتحقق

  useEffect(() => {
    // is_admin() دالة في قاعدة البيانات تقرأ دور المستخدم الحالي. الزائر بلا حساب يأخذ false.
    supabase.rpc('is_admin').then(({ data }) => setIsAdmin(data === true));
  }, []);

  if (Platform.OS !== 'web') return <Redirect href="/" />;
  if (isAdmin === false) return <Redirect href="/" />;
  if (isAdmin === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  return <Stack screenOptions={{ headerShown: false }} />;
}
