// دوال الطلب في قاعدة البيانات ترفض برمز ثابت بالإنجليزية (مثل store_closed).
// هذا الملف يحوّل الرمز إلى مفتاح جملة عربية في ar.json (القسم 8 من المواصفات).

// كل الرموز التي ترميها create_order و cancel_order و set_order_status
export const ORDER_ERROR_CODES = [
  'not_admin',
  'invalid_transition',
  'store_unavailable',
  'store_closed',
  'address_not_found',
  'zone_inactive',
  'empty_cart',
  'invalid_quantity',
  'product_not_in_store',
  'product_unavailable',
  'below_min_order',
  'order_not_found',
  'order_not_pending',
];

export function orderErrorKey(error: { code?: string; message?: string }): string {
  // P0001 هو رمز Postgres لخطأ رمته الدالة بنفسها عبر raise exception
  if (error.code === 'P0001' && ORDER_ERROR_CODES.includes(error.message ?? '')) {
    return `order.errors.${error.message}`;
  }
  // مكتبة Supabase تعيد خطأ بلا رمز عندما لا يصل الطلب إلى الخادم أصلًا
  if (!error.code) return 'errors.noConnection';
  return 'errors.generic';
}
