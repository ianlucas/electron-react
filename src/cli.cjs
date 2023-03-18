const electron = require('electron');
const electronPath = String(electron);
const { spawn } = require('node:child_process');
const { build, createServer } = require('vite');
const { resolve } = require('node:path');

const mode = (process.env.MODE = process.env.MODE || 'development');
const logLevel = 'warn';

function runMain({ resolvedUrls }) {
  process.env.VITE_DEV_SERVER_URL = resolvedUrls.local[0];

  let electronApp = null;

  return build({
    mode,
    logLevel,
    configFile: resolve(__dirname, 'vite-main.config.mjs'),
    build: {
      watch: {}
    },
    plugins: [
      {
        name: 'main',
        writeBundle() {
          if (electronApp !== null) {
            electronApp.removeListener('exit', process.exit);
            electronApp.kill('SIGINT');
            electronApp = null;
          }

          electronApp = spawn(
            electronPath,
            ['--inspect', resolve(__dirname, '../dist/main/index.cjs')],
            {
              stdio: 'inherit'
            }
          );

          electronApp.addListener('exit', process.exit);
        }
      }
    ]
  });
}

function runPreload({ ws }) {
  return build({
    mode,
    logLevel,
    configFile: resolve(__dirname, 'vite-preload.config.mjs'),
    build: {
      watch: {}
    },
    plugins: [
      {
        name: 'preload',
        writeBundle() {
          ws.send({
            type: 'full-reload'
          });
        }
      }
    ]
  });
}

async function runRenderer() {
  const server = await createServer({
    mode,
    logLevel,
    configFile: resolve(__dirname, 'vite-renderer.config.mjs')
  });
  return await server.listen();
}

async function runDevelopment() {
  const rendererServer = await runRenderer();
  await runPreload(rendererServer);
  await runMain(rendererServer);
}

function main() {
  const command = process.argv[2];

  switch (command) {
    case 'dev':
      return runDevelopment();
    default:
      console.log(`Unknown command: "${command}"`);
  }
}

main();
