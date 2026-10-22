import { PAGINATION_DEFAULT_PAGE_SIZE, PAGINATION_MAX_PAGE_SIZE } from '../constants/index.js';

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export function normalizePagination(page = 1, pageSize = PAGINATION_DEFAULT_PAGE_SIZE) {
  const safePage = Number.isFinite(page) ? Math.max(1, Math.trunc(page)) : 1;
  const safePageSize = Number.isFinite(pageSize)
    ? Math.min(PAGINATION_MAX_PAGE_SIZE, Math.max(1, Math.trunc(pageSize)))
    : PAGINATION_DEFAULT_PAGE_SIZE;

  return { page: safePage, pageSize: safePageSize, offset: (safePage - 1) * safePageSize };
}

export function buildPaginationMeta(total: number, page: number, pageSize: number): PaginationMeta {
  const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);
  return {
    page,
    pageSize,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}
