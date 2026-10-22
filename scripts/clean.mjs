import { rmSync } from 'node:fs';
import { URL, fileURLToPath } from 'node:url';
import console from 'node:console';

const distDirectory = fileURLToPath(new URL('../apps/api/dist', import.meta.url));

rmSync(distDirectory, { recursive: true, force: true });
console.log(`Removed ${distDirectory}`);
