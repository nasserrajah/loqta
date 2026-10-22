import type { Response } from 'express';
import type { PaginationMeta } from '../utils/pagination.js';

export function sendData<T>(res: Response, data: T, statusCode = 200): void {
  res.status(statusCode).json({ data });
}

export function sendCreated<T>(res: Response, data: T): void {
  res.status(201).json({ data });
}

export function sendNoContent(res: Response): void {
  res.status(204).end();
}

export function sendPaginated<T>(res: Response, data: T[], meta: PaginationMeta): void {
  res.status(200).json({ data, meta });
}
