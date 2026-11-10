// الاتصال بـ Supabase: كل الشاشات تستورد `supabase` من هنا.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

// القيمتان تأتيان من ملف .env (غير مرفوع إلى Git). المفتاح هنا هو العام فقط.
export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_KEY!,
  {
    auth: {
      // على الهاتف تُحفظ الجلسة في AsyncStorage فيبقى العميل داخلًا بعد إغلاق التطبيق.
      // على الويب نترك المكتبة تستخدم تخزين المتصفح (localStorage) كعادتها.
      storage: Platform.OS === 'web' ? undefined : AsyncStorage,
      persistSession: true,
      autoRefreshToken: true, // تجديد الجلسة قبل انتهائها
      detectSessionInUrl: false, // خاص بالدخول عبر روابط، ولا نستخدمه
    },
  },
);

// التجديد التلقائي يعمل والتطبيق ظاهر فقط، ويتوقف في الخلفية (توصية مكتبة Supabase).
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}
