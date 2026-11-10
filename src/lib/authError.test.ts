import { authErrorKey } from './authError';

describe('authErrorKey', () => {
  it('كلمة مرور أو رقم خاطئ: رسالة واحدة لا تحدد أيهما', () => {
    expect(authErrorKey({ code: 'invalid_credentials' })).toBe('auth.wrongCredentials');
  });

  it('الرقم مسجّل مسبقًا', () => {
    expect(authErrorKey({ code: 'user_already_exists' })).toBe('auth.phoneTaken');
  });

  it('انقطاع الاتصال', () => {
    expect(authErrorKey({ name: 'AuthRetryableFetchError' })).toBe('errors.noConnection');
  });

  it('أي خطأ آخر يأخذ الرسالة العامة', () => {
    expect(authErrorKey({ code: 'something_else' })).toBe('errors.generic');
  });
});
