import { isActive, STAGES, stageState, statusLabel } from './orderStatus';

describe('مراحل الطلب', () => {
  it('المراحل الخمس بترتيب رحلة الطلب', () => {
    expect(STAGES).toEqual(['pending', 'accepted', 'preparing', 'on_the_way', 'delivered']);
  });

  it('الاسم العربي لكل حالة كما في القسم 4 من المواصفات', () => {
    expect(statusLabel('pending')).toBe('بانتظار القبول');
    expect(statusLabel('accepted')).toBe('تم القبول');
    expect(statusLabel('preparing')).toBe('قيد التحضير');
    expect(statusLabel('on_the_way')).toBe('في الطريق');
    expect(statusLabel('delivered')).toBe('تم التسليم');
    expect(statusLabel('rejected')).toBe('مرفوض');
    expect(statusLabel('cancelled')).toBe('ملغي');
  });

  it('عند قيد التحضير: ما قبلها منجز، وهي الحالية، وما بعدها قادم', () => {
    expect(STAGES.map((s) => stageState(s, 'preparing'))).toEqual([
      'done',
      'done',
      'current',
      'upcoming',
      'upcoming',
    ]);
  });

  it('عند بانتظار القبول: الأولى هي الحالية ولا شيء منجز', () => {
    expect(STAGES.map((s) => stageState(s, 'pending'))).toEqual([
      'current',
      'upcoming',
      'upcoming',
      'upcoming',
      'upcoming',
    ]);
  });

  it('عند تم التسليم: كل المراحل منجزة، لأن الطلب انتهى', () => {
    expect(STAGES.map((s) => stageState(s, 'delivered'))).toEqual(['done', 'done', 'done', 'done', 'done']);
  });

  it('الطلب نشط حتى يصل إلى حالة نهائية', () => {
    expect(isActive('pending')).toBe(true);
    expect(isActive('on_the_way')).toBe(true);
    expect(isActive('delivered')).toBe(false);
    expect(isActive('rejected')).toBe(false);
    expect(isActive('cancelled')).toBe(false);
  });
});
