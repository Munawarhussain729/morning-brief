import { app } from "electron";

export function configureLaunchAtLogin(enabled = true): void {
  if (process.platform !== "darwin") return;

  app.setLoginItemSettings({
    openAtLogin: enabled,
    openAsHidden: false,
    name: "Morning Brief"
  });
}

export function isLaunchAtLoginEnabled(): boolean {
  if (process.platform !== "darwin") return false;
  return app.getLoginItemSettings().openAtLogin;
}
