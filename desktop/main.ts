import path from "node:path";
import { fork } from "node:child_process";
import type { ChildProcess } from "node:child_process";
import { app, BrowserWindow, ipcMain, shell } from "electron";
import { logger } from "@/src/logging/logger";
import { configureLaunchAtLogin } from "@/src/startup/loginItem";

const isDev = process.env.NODE_ENV !== "production";
let mainWindow: BrowserWindow | undefined;
let nextServer: ChildProcess | undefined;

async function createWindow(): Promise<void> {
  mainWindow = new BrowserWindow({
    width: 1180,
    height: 820,
    minWidth: 940,
    minHeight: 680,
    title: "Morning Brief",
    backgroundColor: "#eef2f6",
    titleBarStyle: "hiddenInset",
    vibrancy: "sidebar",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  const url = isDev ? "http://localhost:3000" : await startBundledNextServer();
  await mainWindow.loadURL(url);

  mainWindow.show();
}

app.whenReady().then(async () => {
  configureDatabasePath();
  configureLaunchAtLogin(true);
  await createWindow();

  const [{ refreshMorningBrief, scheduleDailyRefresh }, { prisma }, { BriefService }, { notifyForMajorUpdates }] =
    await Promise.all([
      import("@/src/scheduler/refreshJob"),
      import("@/src/db/prisma"),
      import("@/src/briefs/briefService"),
      import("@/src/notifications/notifier")
    ]);

  scheduleDailyRefresh(async () => {
    const brief = await new BriefService(prisma).getLatestBrief();
    if (brief) notifyForMajorUpdates(brief);
    mainWindow?.webContents.send("brief:updated");
  });

  ipcMain.handle("brief:refresh", async () => refreshMorningBrief());
  ipcMain.handle("shell:openExternal", async (_event, url: string) => shell.openExternal(url));
  ipcMain.handle("startup:setLaunchAtLogin", async (_event, enabled: boolean) => configureLaunchAtLogin(enabled));

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) void createWindow();
  });
}).catch((error) => {
  logger.error("Failed to start Morning Brief", error);
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  nextServer?.kill();
});

async function startBundledNextServer(): Promise<string> {
  const appRoot = app.isPackaged ? process.resourcesPath : path.join(__dirname, "..");
  const serverPath = path.join(appRoot, ".next", "standalone", "server.js");
  const port = process.env.PORT ?? "3123";

  nextServer = fork(serverPath, [], {
    cwd: path.dirname(serverPath),
    env: {
      ...process.env,
      PORT: port,
      HOSTNAME: "127.0.0.1",
      ELECTRON_RUN_AS_NODE: "1"
    },
    stdio: "ignore"
  });

  const url = `http://127.0.0.1:${port}`;
  await waitForServer(url);
  return url;
}

async function waitForServer(url: string): Promise<void> {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }
  throw new Error(`Next server did not start at ${url}`);
}

function configureDatabasePath(): void {
  if (process.env.DATABASE_URL) return;
  const databasePath = path.join(app.getPath("userData"), "morning-brief.db");
  process.env.DATABASE_URL = `file:${databasePath}`;
}
