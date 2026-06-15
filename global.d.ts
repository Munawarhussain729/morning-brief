export {};

declare global {
  interface Window {
    morningBrief?: {
      refresh: () => Promise<string>;
      openExternal: (url: string) => Promise<void>;
      setLaunchAtLogin: (enabled: boolean) => Promise<void>;
    };
  }
}
