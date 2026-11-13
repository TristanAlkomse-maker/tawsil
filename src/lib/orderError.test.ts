import i18n from '@/i18n';

import { ORDER_ERROR_CODES, orderErrorKey } from './orderError';

describe('orderErrorKey', () => {
  it('رمز رفض من create_order يتحول إلى مفتاح رسالته العربية', () => {
    expect(orderErrorKey({ code: 'P0001', message: 'store_closed' })).toBe('order.errors.store_closed');
  });

  it('رفض set_order_status في صفحة الإدارة يتحول أيضًا إلى جملة عربية', () => {
    expect(orderErrorKey({ code: 'P0001', message: 'invalid_transition' })).toBe('order.errors.invalid_transition');
    expect(orderErrorKey({ code: 'P0001', message: 'not_admin' })).toBe('order.errors.not_admin');
  });

  it('كل رمز ترميه دوال الطلب له جملة عربية في ar.json', () => {
    for (const code of ORDER_ERROR_CODES) {
      expect(i18n.exists(`order.errors.${code}`)).toBe(true);
    }
  });

  it('خطأ بلا رمز يعني أن الطلب لم يصل إلى الخادم: رسالة انقطاع الاتصال', () => {
    expect(orderErrorKey({ code: '', message: 'TypeError: Network request failed' })).toBe('errors.noConnection');
  });

  it('أي خطأ آخر يأخذ الرسالة العامة، لا رسالة تقنية بالإنجليزية', () => {
    expect(orderErrorKey({ code: '42501', message: 'permission denied' })).toBe('errors.generic');
    expect(orderErrorKey({ code: 'P0001', message: 'something_new' })).toBe('errors.generic');
  });
});
