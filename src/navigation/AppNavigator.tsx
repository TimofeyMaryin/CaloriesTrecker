import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MainScreen from '../screens/MainScreen';
import SettingsScreen from '../screens/SettingsScreen';
import FavoriteScreen from '../screens/FavoriteScreen';
import ProfileSettings from '../screens/ProfileSettings';
import AppSettings from '../screens/AppSettings';
import DescribeDishScreen from '../screens/DescribeDishScreen';
import PhotoExampleScreen from '../screens/PhotoExampleScreen';
import ScanScreen from '../screens/ScanScreen';
import MealResultScreen from '../screens/MealResultScreen';
import CorrectionScreen from '../screens/CorrectionScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import FAQScreen from '../screens/FAQScreen';
import { colors } from '../theme/colors';
import { MealRecord } from '../types/meal';
import { usePremiumStore } from '../store/premiumStore';

export type RootStackParamList = {
  Onboarding: undefined;
  MainTabs: undefined;
  Favorite: undefined;
  ProfileSettings: undefined;
  AppSettings: undefined;
  FAQ: undefined;
  DescribeDish: undefined;
  PhotoExample: undefined;
  Scan: { mode: 'camera' | 'gallery'; locale: string };
  MealResult: { meal: MealRecord };
  Correction: { meal: MealRecord };
};

export type MainTabParamList = {
  Main: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' },
      }}
    >
      <Tab.Screen name="Main" component={MainScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  const hasCompletedOnboarding = usePremiumStore((state) => state.hasCompletedOnboarding);
  
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
        initialRouteName={hasCompletedOnboarding ? 'MainTabs' : 'Onboarding'}
      >
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="MainTabs" component={MainTabNavigator} />
        <Stack.Screen name="Favorite" component={FavoriteScreen} />
        <Stack.Screen name="ProfileSettings" component={ProfileSettings} />
        <Stack.Screen name="AppSettings" component={AppSettings} />
        <Stack.Screen name="FAQ" component={FAQScreen} />
        <Stack.Screen name="DescribeDish" component={DescribeDishScreen} />
        <Stack.Screen name="PhotoExample" component={PhotoExampleScreen} />
        <Stack.Screen name="Scan" component={ScanScreen} />
        <Stack.Screen name="MealResult" component={MealResultScreen} />
        <Stack.Screen name="Correction" component={CorrectionScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
