/// <reference types="@cloudflare/workers-types" />

declare module 'cloudflare:node' {
  import type { ExportedHandler } from '@cloudflare/workers-types';

  interface NodeStyleServer {
    listen(...args: unknown[]): this;
    address(): { port?: number | null | undefined } | null;
  }

  export function httpServerHandler(port: number): ExportedHandler;
  export function httpServerHandler(options: { port: number }): ExportedHandler;
  export function httpServerHandler(server: NodeStyleServer): ExportedHandler;
}