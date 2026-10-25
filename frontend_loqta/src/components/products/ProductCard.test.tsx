import { render, screen } from '@testing-library/react';
import { ProductCard } from './ProductCard';
import { DEMO_PRODUCTS } from '../../data/demoProducts';
import { MemoryRouter } from 'react-router-dom';
import { expect, test } from 'vitest';

test('renders product card with correct data', () => {
  const product = DEMO_PRODUCTS[0];
  render(
    <MemoryRouter>
      <ProductCard product={product} />
    </MemoryRouter>
  );
  expect(screen.getByText(product.name)).toBeInTheDocument();
  expect(screen.getByText(product.category)).toBeInTheDocument();
});