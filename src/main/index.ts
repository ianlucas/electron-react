import { app, BrowserWindow } from 'electron';
import { resolve } from 'node:path';

declare global {
  interface ImportMeta {
    readonly env: {
      readonly VITE_DEV_SERVER_URL: undefined | string;
      readonly VITE_APP_VERSION: string;
      readonly DEV: boolean;
    };
  }
}

async function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      webviewTag: false,
      preload: resolve(app.getAppPath(), '../preload/api.cjs')
    }
  });

  const pageUrl =
    import.meta.env.DEV && import.meta.env.VITE_DEV_SERVER_URL !== undefined
      ? import.meta.env.VITE_DEV_SERVER_URL
      : new URL('../renderer/index.html', 'file://' + __dirname).toString();

  await win.loadURL(pageUrl);
}

function loadAPIFunctions() {
  // @ts-ignore
  import('@app/internal/api.js').then(() => {
    console.log('Internal API functions loaded.');
  });
}

app.whenReady().then(async () => {
  await createWindow();
  loadAPIFunctions();
});
