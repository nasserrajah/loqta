export const ROLES = ['User', 'Admin'] as const;
export type UserRole = (typeof ROLES)[number];

export const ORDER_STATUSES = [
  'pending',
  'paid',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const SESSION_COOKIE_NAME = 'loqta_session';

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 72;

export const CART_MAX_QUANTITY = 99;

export const DEFAULT_CURRENCY = 'USD';
export const SHIPPING_FLAT_CENTS = 1500;
export const FREE_SHIPPING_THRESHOLD_CENTS = 50_000;
export const TAX_RATE_PERCENT = 0;

export const PAGINATION_DEFAULT_PAGE_SIZE = 20;
export const PAGINATION_MAX_PAGE_SIZE = 100;
