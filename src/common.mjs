import { resolve } from 'path';

export const cwd = process.cwd();
export const internalAPIPath = resolve(cwd, 'internal/api.ts');
