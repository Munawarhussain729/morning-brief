import { Platform } from 'react-native';

/**
 * Use localhost for iOS simulators and 10.0.2.2 for Android emulators.
 * For a physical phone, replace this with your computer's LAN IP, for example:
 * http://192.168.1.25:3000
 */
export const API_BASE_URL =
  Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';
