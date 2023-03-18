import { app } from 'electron';

export async function getInitialState() {
  const config = app.getLoginItemSettings();
  return {
    openAtLogin: config.openAtLogin
  };
}
