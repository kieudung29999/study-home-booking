import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getAuth } from 'firebase/auth';
// @ts-ignore getReactNativePersistence is only exposed in the React Native bundle
import { getReactNativePersistence } from 'firebase/auth';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const cfg = {
  apiKey: process.env.EXPO_PUBLIC_FB_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FB_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FB_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FB_STORAGE_BUCKET,
  appId: process.env.EXPO_PUBLIC_FB_APP_ID,
};
export const app = getApps().length ? getApp() : initializeApp(cfg);
export const auth = (() => {
  try { return initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) }); }
  catch (e) { console.warn('Auth persistence init failed, falling back to memory:', e); return getAuth(app); }
})();
// Auto-detect long polling: avoids slow/hanging WebChannel connections on React Native networks.
export const db = (() => {
  try { return initializeFirestore(app, { experimentalAutoDetectLongPolling: true }); }
  catch { return getFirestore(app); }   // already initialised (fast refresh)
})();
export const storage = getStorage(app);
// Secondary app so an admin can create accounts without being signed out
const app2 = getApps().find(a => a.name === 'creator') ?? initializeApp(cfg, 'creator');
export const authCreator = getAuth(app2);
