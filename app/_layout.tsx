import { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { supabase } from '@/lib/supabase';
import { View, ActivityIndicator } from 'react-native';

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync().catch(() => {
  /* ignore errors */
});

export default function RootLayout() {
  useFrameworkReady();

  useEffect(() => {
    // Initialize auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          // User is signed in
          console.log('User is signed in');
        } else {
          // User is signed out
          console.log('User is signed out');
        }
      }
    );

    return () => {
      // Cleanup subscription
      subscription.unsubscribe();
    };
  }, []);

  return (
    <>
      <Stack screenOptions={{ 
        headerShown: false,
        animation: 'fade',
      }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}