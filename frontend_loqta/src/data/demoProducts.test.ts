import { expect, test } from 'vitest';
import { DEMO_PRODUCTS } from './demoProducts';
import { useAppStore } from '../store/useAppStore';

/**
 * Lock the demo catalog contract: the reference products that ship with a
 * real 3D model, no auto-generated extras, and correct demo fields.
 */
test('demo catalog contains only the products with 3D models', () => {
  expect(DEMO_PRODUCTS).toHaveLength(8);

  const names = DEMO_PRODUCTS.map((p) => p.name);
  expect(names).toEqual(
    expect.arrayContaining([
      'ASUS ROG Gaming Laptop',
      'iPhone',
      'Samsung Galaxy',
      'Sony WH-1000XM5',
      'Samsung Odyssey Monitor',
      'LG UltraWide Monitor',
      'Sony Alpha Camera',
      'PlayStation 5',
    ]),
  );

  DEMO_PRODUCTS.forEach((product) => {
    expect(product.id.startsWith('demo-')).toBe(true);
    expect(product.name.length).toBeGreaterThan(0);
    expect(product.modelUrl).toBeTruthy();
    expect(typeof product.inStock).toBe('boolean');
    expect(product.isDemo).toBe(true);
  });
});

test('language switch flips the dictionary (RTL/LTR labels)', () => {
  const store = useAppStore.getState();
  expect(store.t('home')).toBe('Home');
  store.setLanguage('ar');
  expect(useAppStore.getState().t('home')).toBe('الرئيسية');
  useAppStore.setState({ language: 'en' }); // restore default for other tests
});
