import React, { useState } from 'react';
import { View, StyleSheet, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../theme/colors';
import BottomBar from '../components/BottomBar';
import BottomSheet from '../components/BottomSheet';
import AddActionSheet from '../components/AddActionSheet';
import type { AddActionId } from '../components/AddActionSheet';
import TopBar from '../components/TopBar';
import SettingsCard from '../components/SettingsCard';
import {
  MainTabParamList,
  RootStackParamList,
} from '../navigation/AppNavigator';
import { useSettingsStore } from '../store/settingsStore';
import { usePremiumStore } from '../store/premiumStore';
import { showPaywall, PLACEMENT_IDS } from '../services/adapty';

type NavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList>,
  NativeStackNavigationProp<RootStackParamList>
>;

const SettingsScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [addSheetVisible, setAddSheetVisible] = useState(false);
  const dontShowPhotoExample = useSettingsStore((state) => state.dontShowPhotoExample);
  const { canUseFeature, consumeFreeAttempt } = usePremiumStore();

  const handleAddAction = (id: AddActionId) => {
    setAddSheetVisible(false);

    // Default locale
    const locale = 'en_US';

    switch (id) {
      case 'scan':
      case 'gallery':
      case 'voice':
        // Check if user can use AI features (premium or has free attempts)
        if (!canUseFeature()) {
          // Show paywall if no free attempts left
          showPaywall(PLACEMENT_IDS.PAYWALL_MAIN);
          return;
        }
        
        // Consume a free attempt (does nothing if premium)
        consumeFreeAttempt();
        
        if (id === 'scan') {
          // Show photo example if user hasn't disabled it
          if (dontShowPhotoExample) {
            navigation.navigate('Scan', { mode: 'camera', locale });
          } else {
            navigation.navigate('PhotoExample');
          }
        } else if (id === 'gallery') {
          navigation.navigate('Scan', { mode: 'gallery', locale });
        } else {
          navigation.navigate('DescribeDish');
        }
        break;
      case 'favorites':
        navigation.navigate('Favorite');
        break;
    }
  };

  const SettingsTabIcon = () => (
    <Image
      source={require('../assets/icons/ic_settings_black.png')}
      style={styles.tabIcon}
      resizeMode="contain"
    />
  );

  const ProfileCardIcon = () => (
    <Image
      source={require('../assets/icons/ic_profile.png')}
      style={styles.cardIcon}
      resizeMode="contain"
    />
  );

  const AppSettingsCardIcon = () => (
    <Image
      source={require('../assets/icons/ic_settings.png')}
      style={styles.cardIcon}
      resizeMode="contain"
    />
  );

  const CenterIcon = () => (
    <Image
      source={require('../assets/icons/ic_add_dish.png')}
      style={styles.centerIcon}
      resizeMode="contain"
    />
  );

  const HomeIcon = () => (
    <Image
      source={require('../assets/icons/ic_home.png')}
      style={styles.tabIcon}
      resizeMode="contain"
    />
  );

  return (
    <View style={styles.container}>
      <TopBar title="Settings" backgroundColor={colors.background} />
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <View style={styles.content}>
          <SettingsCard
            title="Profile Settings"
            icon={<ProfileCardIcon />}
            onPress={() => navigation.navigate('ProfileSettings')}
          />
          <SettingsCard
            title="App Settings"
            icon={<AppSettingsCardIcon />}
            onPress={() => navigation.navigate('AppSettings')}
          />
        </View>
      </SafeAreaView>
      <BottomBar
        onLeftPress={() => navigation.navigate('Main')}
        onCenterPress={() => setAddSheetVisible(true)}
        onRightPress={() => {}}
        leftIcon={<HomeIcon />}
        leftLabel="Home"
        rightIcon={<SettingsTabIcon />}
        rightLabel="Settings"
        centerIcon={<CenterIcon />}
        activeTab="right"
      />

      <BottomSheet
        visible={addSheetVisible}
        onClose={() => setAddSheetVisible(false)}
        backgroundColor={colors.background}
      >
        <AddActionSheet onSelect={handleAddAction} />
      </BottomSheet>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingTop: 8,
    paddingHorizontal: 16,
  },
  tabIcon: {
    width: 24,
    height: 24,
  },
  cardIcon: {
    width: 22,
    height: 22,
  },
  centerIcon: {
    width: 32,
    height: 32,
  },
});

export default SettingsScreen;
