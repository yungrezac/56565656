import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Implement a web-compatible storage adapter with better error handling
const webStorageAdapter = {
  getItem: (key: string) => {
    try {
      return Promise.resolve(localStorage.getItem(key));
    } catch (e) {
      console.error('Error getting item from localStorage:', e);
      return Promise.resolve(null); // Return null instead of rejecting
    }
  },
  setItem: (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
      return Promise.resolve(undefined);
    } catch (e) {
      console.error('Error setting item in localStorage:', e);
      return Promise.resolve(undefined); // Don't reject on error
    }
  },
  removeItem: (key: string) => {
    try {
      localStorage.removeItem(key);
      return Promise.resolve(undefined);
    } catch (e) {
      console.error('Error removing item from localStorage:', e);
      return Promise.resolve(undefined); // Don't reject on error
    }
  },
};

// Use platform-specific storage adapter with better error handling
const storageAdapter = Platform.OS === 'web' ? webStorageAdapter : {
  getItem: (key: string) => {
    return SecureStore.getItemAsync(key).catch(e => {
      console.error('Error getting item from SecureStore:', e);
      return null; // Return null instead of throwing
    });
  },
  setItem: (key: string, value: string) => {
    return SecureStore.setItemAsync(key, value).catch(e => {
      console.error('Error setting item in SecureStore:', e);
      return undefined; // Don't throw on error
    });
  },
  removeItem: (key: string) => {
    return SecureStore.deleteItemAsync(key).catch(e => {
      console.error('Error removing item from SecureStore:', e);
      return undefined; // Don't throw on error
    });
  },
};

// Validate environment variables with fallbacks for build process
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Create Supabase client with enhanced error handling
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: storageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: {
    headers: {
      'X-Client-Info': 'expo-router',
    },
  },
});

// Enhanced fetch error handling
const originalFetch = global.fetch;
global.fetch = async function(...args) {
  try {
    const response = await originalFetch(...args);
    
    if (!response.ok) {
      console.error('Fetch error:', {
        status: response.status,
        statusText: response.statusText,
        url: response.url,
      });
    }
    
    return response;
  } catch (error) {
    console.error('Network error:', {
      message: error?.message || 'Unknown error',
      type: error?.name || 'Error',
      url: typeof args[0] === 'string' ? args[0] : args[0]?.toString(),
    });
    // Return a default response instead of throwing
    return new Response(null, { status: 500 });
  }
};

// Add global unhandled rejection handler for web
if (Platform.OS === 'web' && typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    event.preventDefault(); // Prevent the error from being logged to console
  });
}

// Initialize Supabase with proper error handling
const initializeSupabase = async () => {
  try {
    // Only perform connection test if we have valid credentials
    if (supabaseUrl && supabaseAnonKey) {
      const { error } = await supabase
        .from('profiles')
        .select('id')
        .limit(1)
        .single();

      if (error) {
        console.warn('Supabase connection test warning:', error);
      } else {
        console.log('Supabase connection test successful');
      }
    }
  } catch (error) {
    console.warn('Supabase initialization warning:', error);
    // Don't throw, just log the warning
  }
};

// Initialize Supabase without throwing errors
initializeSupabase().catch(console.warn);