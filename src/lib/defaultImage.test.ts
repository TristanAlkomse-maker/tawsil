import { defaultImage } from './defaultImage';

describe('defaultImage', () => {
  it('يختار الرمز من اسم المنتج', () => {
    expect(defaultImage('برجر لحم').emoji).toBe('🍔');
    expect(defaultImage('حليب 1 لتر').emoji).toBe('🥛');
    expect(defaultImage('كمامات (علبة)').emoji).toBe('😷');
  });

  it('الأخصّ يسبق الأعمّ', () => {
    expect(defaultImage('بيتزا تونة').emoji).toBe('🍕');
    expect(defaultImage('معجون أسنان').emoji).toBe('🦷');
    expect(defaultImage('طماطم معجون').emoji).toBe('🍅');
    expect(defaultImage('خبز بالثوم').emoji).toBe('🥖');
  });

  it('يختار الرمز من اسم المتجر', () => {
    expect(defaultImage('صيدلية الشفاء').emoji).toBe('💊');
    expect(defaultImage('سوق مرمرة').emoji).toBe('🛒');
  });

  it('اسم غير معروف يأخذ رمز التلميح (المتجر أو التصنيف)', () => {
    expect(defaultImage('باراسيتامول', 'صيدلية الشفاء أدوية ومستلزمات عناية').emoji).toBe('💊');
  });

  it('الاسم يسبق التلميح', () => {
    expect(defaultImage('ماء', 'برجر المشتل').emoji).toBe('💧');
  });

  it('بلا اسم ولا تلميح معروفين يأخذ الرمز العام', () => {
    expect(defaultImage('منتج').emoji).toBe('🛍️');
  });
});
