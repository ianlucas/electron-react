import MagicString from 'magic-string';
import { resolve } from 'path';
import { defineConfig } from 'vite';
import { internalAPIPath } from './common.mjs';

export default defineConfig({
  mode: process.env.MODE,
  build: {
    ssr: true,
    sourcemap: true,
    outDir: resolve(__dirname, '../dist/preload'),
    assetsDir: '.',
    lib: {
      entry: internalAPIPath,
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
  plugins: [
    {
      name: 'load-api-functions',
      renderChunk(code, chunk) {
        const ast = this.parse(code);

        const s = new MagicString('');
        const fns = [];

        s.append(`const { contextBridge, ipcRenderer } = require('electron');`);

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
          fns.push(
            `${name}: (...args) => ipcRenderer.invoke('api_${name}', ...args)`
          );
        }

        s.append(`contextBridge.exposeInMainWorld('api', {${fns.join(',')}})`);

        return {
          code: s.toString(),
          map: s.generateMap().toString()
        };
      }
    }
  ]
});
