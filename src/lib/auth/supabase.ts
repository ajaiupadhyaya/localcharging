import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

const storage =
  Platform.OS === 'web'
    ? {
        getItem: (key: string) =>
          typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null,
        setItem: (key: string, value: string) => {
          if (typeof localStorage !== 'undefined') localStorage.setItem(key, value);
        },
        removeItem: (key: string) => {
          if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
        },
      }
    : ExpoSecureStoreAdapter;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
});

export const isSupabaseConfigured =
  Boolean(
    supabaseUrl &&
      supabaseAnonKey &&
      !supabaseUrl.includes('your-project') &&
      supabaseAnonKey.length > 20,
  );
