import react from '@vitejs/plugin-react';
import MagicString from 'magic-string';
import { resolve } from 'path';
import { defineConfig } from 'vite';
import { cwd, internalAPIPath } from './common.mjs';

export default defineConfig({
  mode: process.env.MODE,
  root: cwd || resolve(cwd, 'client'),
  base: '',
  build: {
    sourcemap: true,
    outDir: resolve(__dirname, '../dist/renderer'),
    assetsDir: '.',
    rollupOptions: {
      input: resolve(cwd, 'index.html') || resolve(cwd, 'client/index.html')
    },
    emptyOutDir: true,
    reportCompressedSize: false
  },
  plugins: [
    {
      name: 'load-api-functions',
      transform(code, id) {
        if (resolve(id) !== internalAPIPath) {
          return null;
        }
        const ast = this.parse(code);
        const s = new MagicString('');

        for (const node of ast.body) {
          if (node.type !== 'ExportNamedDeclaration') {
            continue;
          }
          const name = node.declaration.id.name;
          s.append(`export const ${name} = window.api.${name};`);
        }

        return {
          code: s.toString(),
          map: s.generateMap().toString()
        };
      }
    },
    react()
  ]
});
