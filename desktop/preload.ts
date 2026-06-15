import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("morningBrief", {
  refresh: () => ipcRenderer.invoke("brief:refresh"),
  openExternal: (url: string) => ipcRenderer.invoke("shell:openExternal", url),
  setLaunchAtLogin: (enabled: boolean) => ipcRenderer.invoke("startup:setLaunchAtLogin", enabled)
});
