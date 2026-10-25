import { expect, test, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Products } from './Products';
import * as api from '../services/api';
import { DEMO_PRODUCTS } from '../data/demoProducts';

vi.mock('../services/api', async () => {
  const actual = await vi.importActual<typeof import('../services/api')>('../services/api');
  return {
    ...actual,
    productService: {
      getProducts: vi.fn(),
      getProduct: vi.fn(),
    },
    categoryService: {
      list: vi.fn(),
    },
  };
});

const mockedGetProducts = vi.mocked(api.productService.getProducts);
const mockedCategories = vi.mocked(api.categoryService.list);

function renderProducts(initialUrl = '/products') {
  return render(
    <MemoryRouter initialEntries={[initialUrl]}>
      <Products />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockedCategories.mockResolvedValue([]); // stay with fallback categories
});

test('shows skeletons while loading, then the 3D demo products when the API has none', async () => {
  mockedGetProducts.mockResolvedValue({
    data: [],
    meta: { page: 1, pageSize: 12, total: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false },
  });

  renderProducts();
  expect(document.querySelector('.animate-pulse')).toBeTruthy(); // loading state

  await waitFor(() => {
    expect(screen.getAllByText(/Demo Data|بيانات تجريبية/i).length).toBeGreaterThan(0);
  });

  // Exactly the demo products that have a 3D model, no auto-generated extras.
  DEMO_PRODUCTS.forEach((p) => {
    expect(screen.getByText(p.name)).toBeTruthy();
  });
  const cards = screen.getAllByText(/Laptops|Smartphones|Headphones|Monitors|Cameras|Gaming/i);
  expect(cards.length).toBeGreaterThanOrEqual(DEMO_PRODUCTS.length);
});

test('filters demo products by category chip', async () => {
  const user = userEvent.setup();
  mockedGetProducts.mockResolvedValue({
    data: [],
    meta: { page: 1, pageSize: 12, total: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false },
  });

  renderProducts();
  await waitFor(() => screen.getByText('ASUS ROG Gaming Laptop'));

  // Click the "Smartphones" fallback category chip.
  await user.click(screen.getByRole('button', { name: 'Smartphones' }));

  await waitFor(() => {
    expect(screen.getByText('iPhone')).toBeTruthy();
  });
  expect(screen.queryByText('ASUS ROG Gaming Laptop')).toBeNull();
});

test('renders the empty state after a search with no matches', async () => {
  const user = userEvent.setup();
  mockedGetProducts.mockResolvedValue({
    data: [],
    meta: { page: 1, pageSize: 12, total: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false },
  });

  renderProducts();
  await waitFor(() => screen.getByText('ASUS ROG Gaming Laptop'));

  const searchBox = screen.getByPlaceholderText(/Search by product name/i);
  await user.type(searchBox, 'zzzz-no-match');

  await waitFor(() => {
    expect(screen.getByText(/No products found|لا توجد منتجات/i)).toBeTruthy();
  });
});

test('lists real API products first, then the 4 demo deal items', async () => {
  mockedGetProducts.mockResolvedValue({
    data: [
      {
        id: 'real-1',
        name: 'iPhone 15 Pro',
        slug: 'iphone-15-pro',
        description: 'desc',
        specifications: {},
        priceCents: 9900,
        price: '99.00',
        currency: 'USD',
        stockQuantity: 5,
        inStock: true,
        sku: null,
        isActive: true,
        isFeatured: false,
        category: { id: 'c1', name: 'Laptops', slug: 'laptops' },
        brand: null,
        images: [],
        primaryImageUrl: null,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
    ],
    meta: { page: 1, pageSize: 12, total: 1, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
  });

  renderProducts();
  await waitFor(() => expect(screen.getByText('iPhone 15 Pro')).toBeTruthy());

  // The live API items carry no demo badge…
  const apiCards = screen.getAllByText('iPhone 15 Pro').length;
  expect(apiCards).toBeGreaterThan(0);

  // …while the appended 3D deal items honestly show one, plus their discount.
  expect(screen.getAllByText(/Demo Data|بيانات تجريبية/i)).toHaveLength(4);
  expect(screen.getByText('Galaxy S21 Ultra')).toBeTruthy();
  expect(screen.getByText('Rotom Game Boy')).toBeTruthy();
  expect(screen.getByText('DJI FPV Drone')).toBeTruthy();
});
