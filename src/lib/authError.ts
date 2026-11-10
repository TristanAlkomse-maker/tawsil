// يحوّل خطأ Supabase Auth إلى مفتاح رسالة عربية في ar.json (القسم 8 من المواصفات)،
// حتى لا تظهر للعميل رسالة تقنية بالإنجليزية.
export function authErrorKey(error: { code?: string; name?: string }): string {
  if (error.code === 'invalid_credentials') return 'auth.wrongCredentials';
  if (error.code === 'user_already_exists') return 'auth.phoneTaken';
  // هذا اسم الخطأ الذي ترميه مكتبة Supabase عندما لا يصل الطلب إلى الخادم
  if (error.name === 'AuthRetryableFetchError') return 'errors.noConnection';
  return 'errors.generic';
}
