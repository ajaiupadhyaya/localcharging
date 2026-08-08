import '../global.css';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '@/lib/auth/AuthProvider';
import { AppProviders } from '@/providers/AppProviders';
import { StripeProviderWrapper } from '@/providers/StripeProvider';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <AppProviders>
          <AuthProvider>
            <StripeProviderWrapper>
              <StatusBar style="light" />
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="(auth)/sign-in" options={{ presentation: 'modal' }} />
                <Stack.Screen name="request/[chargerId]" options={{ presentation: 'modal' }} />
                <Stack.Screen name="booking/[id]" />
                <Stack.Screen name="charger/[id]" />
                <Stack.Screen name="host/onboarding/index" />
                <Stack.Screen name="legal/terms" />
                <Stack.Screen name="legal/privacy" />
                <Stack.Screen name="legal/safety" />
                <Stack.Screen name="admin/index" />
              </Stack>
            </StripeProviderWrapper>
          </AuthProvider>
        </AppProviders>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });
