import MagicString from 'magic-string';
import { resolve } from 'path';
import { defineConfig } from 'vite';
import { cwd, internalAPIPath } from './common.mjs';

export default defineConfig({
  mode: process.env.MODE,
  build: {
    ssr: true,
    sourcemap: 'inline',
    outDir: resolve(__dirname, '../dist/main'),
    target: 'node18',
    minify: process.env.MODE !== 'development',
    lib: {
      entry: resolve(__dirname, './main/index.ts'),
      formats: ['cjs']
    },
    rollupOptions: {
      external: ['electron'],
      output: {
        entryFileNames: '[name].cjs'
      }
    },
    emptyOutDir: true,
    reportCompressedSize: false
  },
  resolve: {
    alias: {
      '@app': cwd
    }
  },
  plugins: [
    {
      name: 'load-api-functions',
      renderChunk(code, chunk) {
        if (resolve(chunk.facadeModuleId) !== internalAPIPath) {
          return null;
        }

        const s = new MagicString(code);
        const ast = this.parse(code);

        s.append(`const { ipcMain } = require('electron');`);

        for (const node of ast.body) {
          if (node.type !== 'ExpressionStatement') {
            continue;
          }
          if (node.expression.type !== 'AssignmentExpression') {
            continue;
          }
          if (node.expression.left.object.name !== 'exports') {
            continue;
          }
          const name = node.expression.right.name;
          s.append(
            `ipcMain.handle('api_${name}', async (event, ...args) => { return await ${name}(...args); });`
          );
        }

        return {
          code: s.toString(),
          map: s.generateMap().toString()
        };
      }
    }
  ]
});
