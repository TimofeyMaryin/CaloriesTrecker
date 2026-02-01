import React, { useEffect } from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import AppNavigator from './navigation/AppNavigator';
import { colors } from './theme/colors';
import { AdaptyManager } from './services/adapty';
import { FirebaseService } from './services/firebase';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  // Initialize SDKs on app start
  useEffect(() => {
    const initServices = async () => {
      try {
        // Initialize Adapty first
        await AdaptyManager.initialize();
        console.log('[App] Adapty initialized');

        // Initialize Firebase and sync with Adapty
        await FirebaseService.initialize();
        console.log('[App] Firebase initialized');
      } catch (error) {
        console.error('[App] SDK initialization failed:', error);
      }
    };

    initServices();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <BottomSheetModalProvider>
          <StatusBar
            barStyle={isDarkMode ? 'light-content' : 'dark-content'}
            backgroundColor={colors.background}
          />
          <AppNavigator />
        </BottomSheetModalProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default App;
