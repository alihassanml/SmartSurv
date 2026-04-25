import React, { useEffect } from 'react';
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import 'react-native-reanimated';

// Optional font imports with fallbacks
let SpaceGrotesk_700Bold: any;
let Inter_400Regular: any;
let Inter_700Bold: any;
let useFonts: any;

try {
  const FontPkg = require('@expo-google-fonts/space-grotesk');
  const InterPkg = require('@expo-google-fonts/inter');
  const ExpoFont = require('expo-font');
  
  SpaceGrotesk_700Bold = FontPkg.SpaceGrotesk_700Bold;
  Inter_400Regular = InterPkg.Inter_400Regular;
  Inter_700Bold = InterPkg.Inter_700Bold;
  useFonts = ExpoFont.useFonts;
} catch (e) {
  console.log('Fonts not available yet, using system fallback');
}

export {
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: 'login',
};

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [loaded, error] = useFonts ? useFonts({
    SpaceGrotesk_700Bold,
    Inter_400Regular,
    Inter_700Bold,
  }) : [true, null];

  useEffect(() => {
    if (error) console.log('Font load error:', error);
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [loaded]);

  // If useFonts is missing, we just proceed with system fonts
  if (!loaded && useFonts) {
    return null;
  }

  return (
    <ThemeProvider value={DefaultTheme}>
      <Stack initialRouteName="login">
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="signup" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'DETAILS' }} />
      </Stack>
      <StatusBar style="dark" />
    </ThemeProvider>
  );
}
