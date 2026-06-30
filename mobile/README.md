# Morning Brief Mobile

React Native CLI mobile client for the Morning Brief dashboard.

The mobile app mirrors the desktop dashboard experience:

- Latest daily brief with overview and metrics.
- Section filters for AI, development, cybersecurity, trending tools, and learning.
- Local search across titles, summaries, tags, and sources.
- Priority cards with detail modal, source metadata, tags, and external links.
- LinkedIn article/post ideas.
- Manual refresh through the existing `/api/refresh` backend route.
- Dark mode toggle.

## Architecture

The original desktop app runs ingestion, RSS/GitHub fetching, Prisma SQLite, scheduling, and OpenAI summarization inside a local Node/Electron process. React Native should not ship the OpenAI key or run that server-side stack on-device, so this app is an API client.

Prerequisites:

- Node.js 20.19.4 or newer for React Native 0.86.
- Android Studio for Android builds, or Xcode plus CocoaPods for iOS builds.

Run the existing Next.js backend and point the mobile app at it:

```bash
cd ..
npm install
npm run db:migrate
npm run dev:next
```

Then run the mobile app:

```bash
cd mobile
npm install
npm run android
# or
npm run ios
```

## API Base URL

The default API base URL lives in `src/config.ts`.

- Android emulator: `http://10.0.2.2:3000`
- iOS simulator: `http://localhost:3000`
- Physical phone: replace the value with your computer's LAN IP, for example `http://192.168.1.25:3000`

Make sure the phone and development machine are on the same network, and that the Next.js dev server is reachable from the phone.

## Installing On A Device

### Android

Enable USB debugging, connect the phone, then run:

```bash
npm run android
```

For a release APK/AAB, use the generated native Android project:

```bash
cd android
./gradlew assembleRelease
```

### iOS

Install pods once, then run:

```bash
cd ios
bundle install
bundle exec pod install
cd ..
npm run ios
```

For physical iPhones, open `ios/MorningBriefMobile.xcworkspace` in Xcode, select your team/signing profile, and run or archive from Xcode.

## Backend Contract

The app expects the existing endpoints:

- `GET /api/brief` returns `{ brief, history }`
- `POST /api/refresh` triggers the ingestion and brief generation job

No OpenAI secret is stored in the mobile app.
This is a new [**React Native**](https://reactnative.dev) project, bootstrapped using [`@react-native-community/cli`](https://github.com/react-native-community/cli).

# Getting Started

> **Note**: Make sure you have completed the [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) guide before proceeding.

## Step 1: Start Metro

First, you will need to run **Metro**, the JavaScript build tool for React Native.

To start the Metro dev server, run the following command from the root of your React Native project:

```sh
# Using npm
npm start

# OR using Yarn
yarn start
```

## Step 2: Build and run your app

With Metro running, open a new terminal window/pane from the root of your React Native project, and use one of the following commands to build and run your Android or iOS app:

### Android

```sh
# Using npm
npm run android

# OR using Yarn
yarn android
```

### iOS

For iOS, remember to install CocoaPods dependencies (this only needs to be run on first clone or after updating native deps).

The first time you create a new project, run the Ruby bundler to install CocoaPods itself:

```sh
bundle install
```

Then, and every time you update your native dependencies, run:

```sh
bundle exec pod install
```

For more information, please visit [CocoaPods Getting Started guide](https://guides.cocoapods.org/using/getting-started.html).

```sh
# Using npm
npm run ios

# OR using Yarn
yarn ios
```

If everything is set up correctly, you should see your new app running in the Android Emulator, iOS Simulator, or your connected device.

This is one way to run your app — you can also build it directly from Android Studio or Xcode.

## Step 3: Modify your app

Now that you have successfully run the app, let's make changes!

Open `App.tsx` in your text editor of choice and make some changes. When you save, your app will automatically update and reflect these changes — this is powered by [Fast Refresh](https://reactnative.dev/docs/fast-refresh).

When you want to forcefully reload, for example to reset the state of your app, you can perform a full reload:

- **Android**: Press the <kbd>R</kbd> key twice or select **"Reload"** from the **Dev Menu**, accessed via <kbd>Ctrl</kbd> + <kbd>M</kbd> (Windows/Linux) or <kbd>Cmd ⌘</kbd> + <kbd>M</kbd> (macOS).
- **iOS**: Press <kbd>R</kbd> in iOS Simulator.

## Congratulations! :tada:

You've successfully run and modified your React Native App. :partying_face:

### Now what?

- If you want to add this new React Native code to an existing application, check out the [Integration guide](https://reactnative.dev/docs/integration-with-existing-apps).
- If you're curious to learn more about React Native, check out the [docs](https://reactnative.dev/docs/getting-started).

# Troubleshooting

If you're having issues getting the above steps to work, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

# Learn More

To learn more about React Native, take a look at the following resources:

- [React Native Website](https://reactnative.dev) - learn more about React Native.
- [Getting Started](https://reactnative.dev/docs/environment-setup) - an **overview** of React Native and how setup your environment.
- [Learn the Basics](https://reactnative.dev/docs/getting-started) - a **guided tour** of the React Native **basics**.
- [Blog](https://reactnative.dev/blog) - read the latest official React Native **Blog** posts.
- [`@facebook/react-native`](https://github.com/facebook/react-native) - the Open Source; GitHub **repository** for React Native.
