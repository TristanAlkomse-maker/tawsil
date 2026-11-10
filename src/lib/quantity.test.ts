import { stepQuantity } from './quantity';

describe('stepQuantity', () => {
  it('يزيد الكمية واحدًا', () => {
    expect(stepQuantity(1, 1)).toBe(2);
  });

  it('ينقص الكمية واحدًا', () => {
    expect(stepQuantity(3, -1)).toBe(2);
  });

  it('لا ينزل تحت 1', () => {
    expect(stepQuantity(1, -1)).toBe(1);
  });

  it('لا يتجاوز 99', () => {
    expect(stepQuantity(99, 1)).toBe(99);
  });
});
