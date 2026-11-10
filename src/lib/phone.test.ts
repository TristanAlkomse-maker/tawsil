import { normalizePhone, phoneToEmail } from './phone';

describe('normalizePhone', () => {
  it('يحوّل الصيغة المحلية 0912345678 إلى الصيغة الدولية', () => {
    expect(normalizePhone('0912345678')).toBe('+218912345678');
  });

  it('يقبل الرقم بدون الصفر الأول', () => {
    expect(normalizePhone('912345678')).toBe('+218912345678');
  });

  it('يقبل الصيغة الدولية كما هي', () => {
    expect(normalizePhone('+218912345678')).toBe('+218912345678');
  });

  it('يتجاهل المسافات التي يكتبها العميل بين الأرقام', () => {
    expect(normalizePhone('091 234 5678')).toBe('+218912345678');
  });

  it('يرفض الرقم الناقص', () => {
    expect(normalizePhone('091234567')).toBeNull();
  });

  it('يرفض الرقم الذي فيه حروف', () => {
    expect(normalizePhone('09123a5678')).toBeNull();
  });

  it('يرفض الرقم الذي لا يبدأ بـ 9 بعد مفتاح الدولة', () => {
    expect(normalizePhone('0812345678')).toBeNull();
  });
});

describe('phoneToEmail', () => {
  it('يولّد المعرّف الداخلي من الرقم الدولي', () => {
    expect(phoneToEmail('+218912345678')).toBe('218912345678@phone.tawsil.app');
  });
});
