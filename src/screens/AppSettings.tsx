import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Switch,
  ScrollView,
  Linking,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as StoreReview from 'expo-store-review';
import { colors } from '../theme/colors';
import TopBar from '../components/TopBar';
import SettingsCard from '../components/SettingsCard';
import FeedbackModal from '../components/FeedbackModal';
import { RootStackParamList } from '../navigation/AppNavigator';
import { FirebaseService } from '../services/firebase';
import { AdaptyManager } from '../services/adapty';
import { useSettingsStore } from '../store/settingsStore';
import { useProfileStore, UnitSystem } from '../store/profileStore';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const PRIVACY_POLICY_URL = 'https://docs.google.com/document/d/1zxsY1-vby9rnDZ0A--OV1llUuKQfRPoEbDnz-ULxpQU/edit?tab=t.0';
const TERMS_OF_USE_URL = 'https://docs.google.com/document/d/1m_jf9YdeEFjuKJvWYybnRLsIIG9IILmxdtiGV-mlyaY/edit?tab=t.0';

const AppSettings = () => {
  const navigation = useNavigation<NavigationProp>();
  const { savePhotoEnabled, setSavePhotoEnabled } = useSettingsStore();
  const { unitSystem, setUnitSystem } = useProfileStore();
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  // Icon components
  const FaqIcon = () => (
    <Image
      source={require('../assets/icons/ic_faq.png')}
      style={styles.cardIcon}
      resizeMode="contain"
    />
  );
  const PrivacyPolicyIcon = () => (
    <Image
      source={require('../assets/icons/icon_privacy_policy.png')}
      style={styles.cardIcon}
      resizeMode="contain"
    />
  );
  const TermsOfUseIcon = () => (
    <Image
      source={require('../assets/icons/ic_terms_of_use.png')}
      style={styles.cardIcon}
      resizeMode="contain"
    />
  );
  const FeedbackIcon = () => (
    <Image
      source={require('../assets/icons/ic_feedback.png')}
      style={styles.cardIcon}
      resizeMode="contain"
    />
  );
  const RateUsIcon = () => (
    <Image
      source={require('../assets/icons/ic_rate_us.png')}
      style={styles.cardIcon}
      resizeMode="contain"
    />
  );
  const RestorePurchaseIcon = () => (
    <Image
      source={require('../assets/icons/ic_restore_purchase.png')}
      style={styles.cardIcon}
      resizeMode="contain"
    />
  );

  // Handlers
  const handleFAQ = useCallback(() => {
    navigation.navigate('FAQ');
  }, [navigation]);

  const handlePrivacyPolicy = useCallback(async () => {
    FirebaseService.logEvent('privacy_policy_opened');
    try {
      await Linking.openURL(PRIVACY_POLICY_URL);
    } catch (error) {
      Alert.alert('Error', 'Could not open Privacy Policy');
    }
  }, []);

  const handleTermsOfUse = useCallback(async () => {
    FirebaseService.logEvent('terms_opened');
    try {
      await Linking.openURL(TERMS_OF_USE_URL);
    } catch (error) {
      Alert.alert('Error', 'Could not open Terms of Use');
    }
  }, []);

  const handleFeedback = useCallback(() => {
    FirebaseService.logEvent('feedback_opened');
    setFeedbackModalVisible(true);
  }, []);

  const handleRateUs = useCallback(async () => {
    FirebaseService.logEvent('rate_app_requested');
    try {
      const isAvailable = await StoreReview.isAvailableAsync();
      if (isAvailable) {
        await StoreReview.requestReview();
      } else {
        Alert.alert('Rate Us', 'Rating is not available on this device');
      }
    } catch (error) {
      console.error('Rate us error:', error);
      Alert.alert('Error', 'Could not open rating dialog');
    }
  }, []);

  const handleRestorePurchase = useCallback(async () => {
    if (isRestoring) return;
    
    setIsRestoring(true);
    try {
      const result = await AdaptyManager.restorePurchases();
      
      if (result.error) {
        FirebaseService.logEvent('restore_failed', { error: result.error.message });
        Alert.alert('Restore Failed', 'Please try again later.');
      } else if (result.isPremium) {
        FirebaseService.logEvent('restore_success');
        Alert.alert('Success', 'Purchase restored successfully!');
      } else {
        FirebaseService.logEvent('restore_no_purchases');
        Alert.alert('No Purchases', 'No active purchases found.');
      }
    } catch (error) {
      console.error('Restore error:', error);
      FirebaseService.logEvent('restore_failed', { error: String(error) });
      Alert.alert('Error', 'Restore failed. Please try again.');
    } finally {
      setIsRestoring(false);
    }
  }, [isRestoring]);

  return (
    <View style={styles.container}>
      <TopBar
        title="App Settings"
        showBack={true}
        onBackPress={() => navigation.goBack()}
        backgroundColor={colors.background}
      />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <SafeAreaView style={styles.safeArea} edges={['bottom']}>
          <View style={styles.content}>
            {/* Units of Measurement */}
            <Text style={styles.sectionTitle}>Units of measurement</Text>
            <View style={styles.unitCard}>
              <TouchableOpacity
                style={[
                  styles.unitOption,
                  unitSystem === 'imperial' && styles.unitOptionSelected,
                ]}
                onPress={() => setUnitSystem('imperial')}
              >
                <Text style={[
                  styles.unitOptionText,
                  unitSystem === 'imperial' && styles.unitOptionTextSelected,
                ]}>
                  Imperial
                </Text>
                <View style={[
                  styles.radioOuter,
                  unitSystem === 'imperial' && styles.radioOuterSelected,
                ]}>
                  {unitSystem === 'imperial' && <View style={styles.radioInner} />}
                </View>
              </TouchableOpacity>
              <View style={styles.unitDivider} />
              <TouchableOpacity
                style={[
                  styles.unitOption,
                  unitSystem === 'metric' && styles.unitOptionSelected,
                ]}
                onPress={() => setUnitSystem('metric')}
              >
                <Text style={[
                  styles.unitOptionText,
                  unitSystem === 'metric' && styles.unitOptionTextSelected,
                ]}>
                  Metric
                </Text>
                <View style={[
                  styles.radioOuter,
                  unitSystem === 'metric' && styles.radioOuterSelected,
                ]}>
                  {unitSystem === 'metric' && <View style={styles.radioInner} />}
                </View>
              </TouchableOpacity>
            </View>

            {/* Save Photo Toggle */}
            <View style={styles.toggleCard}>
              <View style={styles.toggleTextBlock}>
                <Text style={styles.toggleTitle}>Save photo</Text>
                <Text style={styles.toggleDescription}>
                  Open to automatically save photos of dishes to your gallery
                </Text>
              </View>
              <Switch
                value={savePhotoEnabled}
                onValueChange={setSavePhotoEnabled}
                trackColor={{ false: '#DCDEDB', true: colors.accent }}
                thumbColor={colors.white}
                ios_backgroundColor="#DCDEDB"
              />
            </View>

            {/* Section Title */}
            <Text style={styles.sectionTitle}>Additional</Text>

            {/* Settings List */}
            <SettingsCard
              title="FAQ"
              description="Quiz help and app tips"
              icon={<FaqIcon />}
              onPress={handleFAQ}
            />
            <SettingsCard
              title="Privacy Policy"
              description="Read how we protect your data"
              icon={<PrivacyPolicyIcon />}
              onPress={handlePrivacyPolicy}
            />
            <SettingsCard
              title="Terms of Use"
              description="Review the app usage terms"
              icon={<TermsOfUseIcon />}
              onPress={handleTermsOfUse}
            />
            <SettingsCard
              title="Feedback"
              description="Get support or send feedback"
              icon={<FeedbackIcon />}
              onPress={handleFeedback}
            />
            <SettingsCard
              title="Rate Us"
              description="Like the app? Rate us!"
              icon={<RateUsIcon />}
              onPress={handleRateUs}
            />
            <SettingsCard
              title="Restore Purchase"
              description={isRestoring ? 'Checking purchases...' : undefined}
              icon={<RestorePurchaseIcon />}
              onPress={handleRestorePurchase}
            />
          </View>
        </SafeAreaView>
      </ScrollView>

      {/* Feedback Modal */}
      <FeedbackModal
        visible={feedbackModalVisible}
        onClose={() => setFeedbackModalVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingTop: 8,
    paddingHorizontal: 16,
  },
  toggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  toggleTextBlock: {
    flex: 1,
    marginRight: 12,
  },
  toggleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  toggleDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 12,
    marginTop: 8,
  },
  cardIcon: {
    width: 22,
    height: 22,
  },
  unitCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    marginBottom: 24,
    overflow: 'hidden',
  },
  unitOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  unitOptionSelected: {
    backgroundColor: colors.white,
  },
  unitOptionText: {
    fontSize: 16,
    color: colors.text,
  },
  unitOptionTextSelected: {
    fontWeight: '600',
  },
  unitDivider: {
    height: 1,
    backgroundColor: '#E8E8E8',
    marginLeft: 16,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#DCDEDB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuterSelected: {
    borderColor: colors.accent,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.accent,
  },
});

export default AppSettings;
