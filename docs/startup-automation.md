# macOS Startup Automation

Morning Brief uses Electron's macOS login item API:

```ts
app.setLoginItemSettings({
  openAtLogin: true,
  openAsHidden: false,
  name: "Morning Brief"
});
```

This is called during `app.whenReady()` in `electron/main.ts`, so the packaged app launches after login and opens the briefing window automatically.

Daily refresh uses `node-cron` with:

```env
MORNING_BRIEF_REFRESH_CRON="0 7 * * *"
MORNING_BRIEF_TIMEZONE="Asia/Karachi"
```

For stricter production scheduling, a future release can install a user LaunchAgent that wakes the app for refresh even if the Electron process is not already running.
