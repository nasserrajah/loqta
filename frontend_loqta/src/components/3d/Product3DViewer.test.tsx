import { describe, expect, test } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { Product3DViewer } from './Product3DViewer';
import { DEMO_PRODUCTS } from '../../data/demoProducts';

/**
 * Fallback behavior: without a linked 3D model the viewer MUST show a static
 * image and explicitly state that the 3D view is unavailable — it must never
 * present a static image as a rotatable model.
 */
describe('Product3DViewer fallback', () => {
  test('shows the fallback image and honest fallback text when no model URL is provided', async () => {
    const product = DEMO_PRODUCTS[0];
    const { container } = render(
      <Product3DViewer modelUrl={undefined} fallbackImage={product.image} productName={product.name} />,
    );

    const img = container.querySelector('img');
    expect(img).toBeTruthy();
    expect(img?.getAttribute('alt')).toBe(product.name);

    await waitFor(() => {
      expect(screen.getByText(/3D view unavailable|العرض ثلاثي الأبعاد غير متاح/i)).toBeTruthy();
    });
    // The reset-3d-view control must NOT appear (there is no 3D scene).
    expect(screen.queryByLabelText(/Reset 3D View/i)).toBeNull();
  });
});
