import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
  Keyboard,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import Voice, {
  SpeechResultsEvent,
  SpeechErrorEvent,
} from '@react-native-voice/voice';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../theme/colors';
import TopBar from '../components/TopBar';
import BottomSheet from '../components/BottomSheet';
import AnalysisOverlay from '../components/AnalysisOverlay';
import NoInternetOverlay from '../components/NoInternetOverlay';
import KeyboardDoneButton, { KEYBOARD_ACCESSORY_VIEW_ID } from '../components/KeyboardDoneButton';
import { RootStackParamList } from '../navigation/AppNavigator';
import { analyzeMealFromText } from '../api/mealAnalysis';
import { useMealStore } from '../store/mealStore';
import { checkNetworkConnection } from '../utils/networkUtils';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type ScreenState = 'idle' | 'listening' | 'analyzing' | 'error' | 'no_internet';

interface Language {
  code: string;
  name: string;
  flag: string;
  locale: string;
}

const LANGUAGES: Language[] = [
  { code: 'ru', name: 'Русский', flag: '🇷🇺', locale: 'ru-RU' },
  { code: 'en', name: 'English', flag: '🇺🇸', locale: 'en-US' },
  { code: 'en-gb', name: 'English (UK)', flag: '🇬🇧', locale: 'en-GB' },
  { code: 'es', name: 'Español', flag: '🇪🇸', locale: 'es-ES' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪', locale: 'de-DE' },
  { code: 'fr', name: 'Français', flag: '🇫🇷', locale: 'fr-FR' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹', locale: 'it-IT' },
  { code: 'pt', name: 'Português', flag: '🇵🇹', locale: 'pt-BR' },
  { code: 'ja', name: '日本語', flag: '🇯🇵', locale: 'ja-JP' },
  { code: 'zh', name: '中文', flag: '🇨🇳', locale: 'zh-CN' },
  { code: 'ko', name: '한국어', flag: '🇰🇷', locale: 'ko-KR' },
];

const DescribeDishScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const addMeal = useMealStore((state) => state.addMeal);

  const [dishDescription, setDishDescription] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(LANGUAGES[1]);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [screenState, setScreenState] = useState<ScreenState>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [isManualEditing, setIsManualEditing] = useState(false);

  // Animation for voice button scale
  const buttonScale = useSharedValue(1);

  const isListening = screenState === 'listening';
  const isAnalyzing = screenState === 'analyzing';

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  useEffect(() => {
    buttonScale.value = withSpring(isListening ? 1.1 : 1, {
      damping: 15,
      stiffness: 150,
    });
  }, [isListening, buttonScale]);

  // Voice recognition setup
  useEffect(() => {
    Voice.onSpeechResults = onSpeechResults;
    Voice.onSpeechPartialResults = onSpeechPartialResults;
    Voice.onSpeechError = onSpeechError;
    Voice.onSpeechEnd = onSpeechEnd;

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, [isManualEditing]);

  const onSpeechResults = (e: SpeechResultsEvent) => {
    if (e.value && e.value[0] && !isManualEditing) {
      setDishDescription(e.value[0]);
    }
  };

  const onSpeechPartialResults = (e: SpeechResultsEvent) => {
    if (e.value && e.value[0] && !isManualEditing) {
      setDishDescription(e.value[0]);
    }
  };

  const onSpeechError = (e: SpeechErrorEvent) => {
    console.error('Speech error:', e.error);
    setScreenState('idle');
    
    // Don't show alert for common simulator errors
    const errorMessage = e.error?.message || '';
    if (errorMessage.includes('IsFormatSampleRateAndChannelCountValid')) {
      // Simulator limitation - already handled in startListening
      return;
    }
  };

  const onSpeechEnd = () => {
    setScreenState('idle');
  };

  const startListening = async () => {
    try {
      // Check if voice recognition is available
      const isAvailable = await Voice.isAvailable();
      if (!isAvailable) {
        Alert.alert(
          'Not Available',
          'Voice recognition is not available on this device. Please use a real device or type your description.',
        );
        return;
      }

      Keyboard.dismiss();
      setIsManualEditing(false);
      setScreenState('listening');

      await Voice.start(selectedLanguage.locale);
    } catch (error: any) {
      console.error('Failed to start voice recognition:', error);
      setScreenState('idle');
      
      // Check if it's a simulator error
      if (error?.message?.includes('IsFormatSampleRateAndChannelCountValid') || 
          error?.code === 'start_recording') {
        Alert.alert(
          'Simulator Limitation',
          'Voice recognition does not work on iOS Simulator. Please test on a real device or type your description manually.',
        );
      } else {
        Alert.alert('Error', 'Failed to start voice recognition. Please try again.');
      }
    }
  };

  const stopListening = async () => {
    try {
      await Voice.stop();
      setScreenState('idle');
    } catch (error) {
      console.error('Failed to stop voice recognition:', error);
      setScreenState('idle');
    }
  };

  const handleVoiceButton = async () => {
    if (isListening) {
      await stopListening();
    } else {
      await startListening();
    }
  };

  const handleTextInputFocus = () => {
    setIsManualEditing(true);
    if (isListening) {
      stopListening();
    }
  };

  const handleAnalyze = async () => {
    const text = dishDescription.trim();
    if (!text) {
      Alert.alert('Error', 'Please enter or speak a description.');
      return;
    }

    // Stop listening if active
    if (isListening) {
      await stopListening();
    }

    // Check network connection first
    const isConnected = await checkNetworkConnection();
    if (!isConnected) {
      setScreenState('no_internet');
      return;
    }

    setScreenState('analyzing');
    setErrorMessage('');

    try {
      const result = await analyzeMealFromText(text, selectedLanguage.locale);

      if (!result.isFood) {
        setScreenState('error');
        setErrorMessage(result.validationError || 'This does not appear to be food.');
        return;
      }

      // Save meal to store
      const meal = addMeal(
        result.title,
        result.health,
        result.ingredients,
        undefined, // No image for text input
      );

      setScreenState('idle');
      setDishDescription('');

      // Navigate to result (replace to avoid stacking screens)
      navigation.replace('MealResult', { meal });
    } catch (error) {
      console.error('Analysis error:', error);
      setScreenState('error');
      setErrorMessage('Sorry, something went wrong. Please try again.');
    }
  };

  const handleNetworkRetry = () => {
    setScreenState('idle');
    handleAnalyze();
  };

  const handleNetworkClose = () => {
    setScreenState('idle');
  };

  const handleRetry = () => {
    setScreenState('idle');
    setErrorMessage('');
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainTabs' }],
    });
  };

  const handleLanguageSelect = (language: Language) => {
    setSelectedLanguage(language);
    setLanguageModalVisible(false);
  };

  const GlobeIcon = () => (
    <View style={styles.globeButton}>
      <Text style={styles.globeIcon}>🌐</Text>
    </View>
  );

  const renderLanguageItem = (item: Language) => (
    <TouchableOpacity
      key={item.code}
      style={[
        styles.languageItem,
        selectedLanguage.code === item.code && styles.languageItemSelected,
      ]}
      activeOpacity={0.7}
      onPress={() => handleLanguageSelect(item)}
    >
      <Text style={styles.languageFlag}>{item.flag}</Text>
      <Text style={styles.languageName}>{item.name}</Text>
      {selectedLanguage.code === item.code && (
        <Text style={styles.checkmark}>✓</Text>
      )}
    </TouchableOpacity>
  );

  // No internet overlay
  if (screenState === 'no_internet') {
    return (
      <View style={styles.container}>
        <NoInternetOverlay
          visible={true}
          onRetry={handleNetworkRetry}
          onClose={handleNetworkClose}
        />
      </View>
    );
  }

  // Analyzing overlay
  if (isAnalyzing) {
    return <AnalysisOverlay type="analyzing" />;
  }

  // Error overlay
  if (screenState === 'error') {
    return <AnalysisOverlay type="error" onRetry={handleRetry} />;
  }

  return (
    <View style={styles.container}>
      <TopBar
        title="Describe the dish"
        showBack={true}
        onBackPress={() => navigation.goBack()}
        backgroundColor={colors.background}
        rightIcon={<GlobeIcon />}
        onRightPress={() => setLanguageModalVisible(true)}
      />
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            {/* Header text */}
            <Text style={styles.headerText}>
              Please describe your dish in detail
            </Text>

            {/* Example hint */}
            <View style={styles.exampleContainer}>
              <Text style={styles.exampleText}>
                Blueberries - 50 g, strawberries - 50 g, banana - 100 g,
                fat-free protein - 25 g, water - 150 ml.
              </Text>
            </View>

            {/* Text input */}
            <TextInput
              style={styles.textInput}
              placeholder="Type your dish details here..."
              placeholderTextColor={colors.textSecondary}
              value={dishDescription}
              onChangeText={setDishDescription}
              onFocus={handleTextInputFocus}
              multiline
              textAlignVertical="top"
              inputAccessoryViewID={KEYBOARD_ACCESSORY_VIEW_ID}
            />
            <KeyboardDoneButton />

            {/* Analyze button */}
            <TouchableOpacity
              style={[
                styles.analyzeButton,
                !dishDescription.trim() && styles.analyzeButtonDisabled,
              ]}
              activeOpacity={0.8}
              onPress={handleAnalyze}
              disabled={!dishDescription.trim()}
            >
              <Text style={styles.analyzeButtonText}>Analyze</Text>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Or use{'\n'}Voice Log</Text>
              <View style={styles.dividerLine} />
            </View>
          </View>
        </ScrollView>

        {/* Bottom voice section - fixed at bottom */}
        <SafeAreaView style={styles.bottomSection} edges={['bottom']}>
          {/* Voice button */}
          <Animated.View style={animatedButtonStyle}>
            <TouchableOpacity
              style={[
                styles.voiceButton,
                isListening && styles.voiceButtonRecording,
              ]}
              activeOpacity={0.8}
              onPress={handleVoiceButton}
            >
              <View
                style={[
                  styles.voiceButtonInner,
                  isListening && styles.voiceButtonInnerRecording,
                ]}
              >
                <Image
                  source={require('../assets/icons/ic_voice.png')}
                  style={[
                    styles.voiceIconImage,
                    isListening && styles.voiceIconImageRecording,
                  ]}
                  resizeMode="contain"
                />
              </View>
            </TouchableOpacity>
          </Animated.View>
          <Text style={styles.voiceLabel}>
            {isListening ? 'Listening..' : 'Push to speak'}
          </Text>

          {/* Language button */}
          <TouchableOpacity
            style={styles.languageButton}
            activeOpacity={0.7}
            onPress={() => setLanguageModalVisible(true)}
          >
            <Text style={styles.languageButtonFlag}>{selectedLanguage.flag}</Text>
            <Text style={styles.languageButtonText}>{selectedLanguage.name}</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </KeyboardAvoidingView>

      {/* Language selection bottom sheet */}
      <BottomSheet
        visible={languageModalVisible}
        onClose={() => setLanguageModalVisible(false)}
        title="Select Language"
        snapPoints={['70%']}
        scrollable
      >
        {LANGUAGES.map(renderLanguageItem)}
      </BottomSheet>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 16,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  globeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  globeIcon: {
    fontSize: 20,
  },
  headerText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  exampleContainer: {
    backgroundColor: '#D4F5D5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  exampleText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  textInput: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    minHeight: 120,
    marginBottom: 16,
  },
  analyzeButton: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  analyzeButtonDisabled: {
    backgroundColor: '#C0C0C0',
  },
  analyzeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  bottomSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  voiceButton: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(53, 192, 58, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  voiceButtonRecording: {
    backgroundColor: 'rgba(255, 59, 48, 0.15)',
  },
  voiceButtonInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceButtonInnerRecording: {
    backgroundColor: '#FF3B30',
  },
  voiceIconImage: {
    width: 32,
    height: 32,
    tintColor: colors.white,
  },
  voiceIconImageRecording: {
    tintColor: colors.white,
  },
  voiceLabel: {
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  languageButtonFlag: {
    fontSize: 16,
    marginRight: 6,
  },
  languageButtonText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 4,
  },
  languageItemSelected: {
    backgroundColor: '#E8F5E9',
  },
  languageFlag: {
    fontSize: 24,
    marginRight: 12,
  },
  languageName: {
    fontSize: 16,
    color: colors.text,
    flex: 1,
  },
  checkmark: {
    fontSize: 18,
    color: colors.accent,
    fontWeight: '600',
  },
});

export default DescribeDishScreen;
