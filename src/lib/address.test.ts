import { selectedAddress } from './address';

const home = { id: 'a', is_default: false };
const work = { id: 'b', is_default: true };

describe('selectedAddress', () => {
  it('يختار العنوان الافتراضي', () => {
    expect(selectedAddress([home, work])).toBe(work);
  });

  it('يختار أول عنوان إذا لم يوجد افتراضي (مثلًا بعد حذف الافتراضي)', () => {
    expect(selectedAddress([home, { id: 'c', is_default: false }])).toBe(home);
  });

  it('يعيد null إذا لم تكن هناك عناوين', () => {
    expect(selectedAddress([])).toBeNull();
  });
});
