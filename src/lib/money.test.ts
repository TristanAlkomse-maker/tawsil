import { formatMoney } from './money';

describe('formatMoney', () => {
  it('يعرض المبلغ بخانتين عشريتين ثم رمز الدينار', () => {
    expect(formatMoney(12.5)).toBe('12.50 د.ل');
  });

  it('يضيف الخانتين العشريتين للعدد الصحيح', () => {
    expect(formatMoney(7)).toBe('7.00 د.ل');
  });
});
