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
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
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
import { MealRecord, Ingredient } from '../types/meal';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type CorrectionRouteProp = RouteProp<RootStackParamList, 'Correction'>;

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
  { code: 'pt', name: 'Português', flag: '🇧🇷', locale: 'pt-BR' },
  { code: 'ja', name: '日本語', flag: '🇯🇵', locale: 'ja-JP' },
  { code: 'zh', name: '中文', flag: '🇨🇳', locale: 'zh-CN' },
  { code: 'ko', name: '한국어', flag: '🇰🇷', locale: 'ko-KR' },
];

const QUICK_SUGGESTIONS = [
  'Add ingredient',
  'Remove ingredient',
  'Change weight',
];

const CorrectionScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<CorrectionRouteProp>();
  const { meal } = route.params;

  const [correctionText, setCorrectionText] = useState('');
  const [screenState, setScreenState] = useState<ScreenState>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(LANGUAGES[1]); // English
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [isManualEditing, setIsManualEditing] = useState(false);

  const { updateMeal } = useMealStore();

  // Animation
  const micScale = useSharedValue(1);
  const micAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: micScale.value }],
  }));

  // Voice recognition setup
  useEffect(() => {
    Voice.onSpeechResults = onSpeechResults;
    Voice.onSpeechError = onSpeechError;

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, [isManualEditing]);

  const onSpeechResults = (e: SpeechResultsEvent) => {
    if (e.value && e.value[0] && !isManualEditing) {
      setCorrectionText(e.value[0]);
    }
  };

  const onSpeechError = (e: SpeechErrorEvent) => {
    console.log('Speech error:', e.error);
    setIsListening(false);
    setScreenState('idle');
  };

  const startListening = async () => {
    try {
      const isAvailable = await Voice.isAvailable();
      if (!isAvailable) {
        Alert.alert(
          'Voice Recognition Unavailable',
          'Voice recognition is not available on this device or simulator.'
        );
        return;
      }

      setIsManualEditing(false);
      setScreenState('listening');
      setIsListening(true);
      micScale.value = withSpring(1.2);

      await Voice.start(selectedLanguage.locale);
    } catch (error) {
      console.error('Failed to start voice:', error);
      setIsListening(false);
      setScreenState('idle');
    }
  };

  const stopListening = async () => {
    try {
      await Voice.stop();
      setIsListening(false);
      setScreenState('idle');
      micScale.value = withSpring(1);
    } catch (error) {
      console.error('Failed to stop voice:', error);
    }
  };

  const handleMicPress = () => {
    Keyboard.dismiss();
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleTextInputFocus = () => {
    setIsManualEditing(true);
    if (isListening) {
      stopListening();
    }
  };

  const handleLanguageSelect = (lang: Language) => {
    setSelectedLanguage(lang);
    setLanguageModalVisible(false);
  };

  const handleQuickSuggestion = (suggestion: string) => {
    setCorrectionText(suggestion + ': ');
  };

  const buildCorrectionText = (): string => {
    const ingredientsList = meal.ingredients
      .map((ing) => `- ${ing.name} ${ing.weight}g (${ing.calories} kcal)`)
      .join('\n');

    return `Current meal: ${meal.title}
Ingredients:
${ingredientsList}

User correction: ${correctionText}`;
  };

  const handleApplyCorrection = async () => {
    const text = correctionText.trim();
    if (!text) {
      Alert.alert('Error', 'Please enter a correction.');
      return;
    }

    if (isListening) {
      await stopListening();
    }

    // Check network connection
    const isConnected = await checkNetworkConnection();
    if (!isConnected) {
      setScreenState('no_internet');
      return;
    }

    setScreenState('analyzing');
    setErrorMessage('');

    try {
      const correctionPayload = buildCorrectionText();
      const result = await analyzeMealFromText(correctionPayload, selectedLanguage.locale);

      if (!result.isFood) {
        setScreenState('error');
        setErrorMessage(result.validationError || 'Could not process the correction.');
        return;
      }

      // Update the meal in store
      updateMeal(meal.id, {
        title: result.title,
        health: result.health,
        ingredients: result.ingredients,
      });

      // Navigate back to MealResult with updated meal
      const updatedMeal: MealRecord = {
        ...meal,
        title: result.title,
        health: result.health,
        ingredients: result.ingredients,
      };

      navigation.replace('MealResult', { meal: updatedMeal });
    } catch (error) {
      console.error('Correction error:', error);
      setScreenState('error');
      setErrorMessage('Sorry, something went wrong. Please try again.');
    }
  };

  const handleRetry = () => {
    setScreenState('idle');
    setErrorMessage('');
  };

  const handleNetworkRetry = () => {
    setScreenState('idle');
    handleApplyCorrection();
  };

  const handleNetworkClose = () => {
    setScreenState('idle');
  };

  const isAnalyzing = screenState === 'analyzing';

  const GlobeIcon = () => (
    <Text style={{ fontSize: 20 }}>🌐</Text>
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
        title="Correct Result"
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
        <SafeAreaView style={styles.safeArea} edges={['bottom']}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <Text style={styles.headerTitle}>What needs to be corrected?</Text>
            <Text style={styles.headerSubtitle}>
              Describe what you want to add, remove, or change
            </Text>

            {/* Your corrections label with language */}
            <View style={styles.labelRow}>
              <Text style={styles.label}>Your corrections</Text>
              <TouchableOpacity
                style={styles.languageButton}
                onPress={() => setLanguageModalVisible(true)}
              >
                <Text style={styles.languageButtonIcon}>🌐</Text>
                <Text style={styles.languageButtonText}>Language</Text>
              </TouchableOpacity>
            </View>

            {/* Text input */}
            <TextInput
              style={styles.textInput}
              placeholder="e.g., Add 50g avocado, remove cheese..."
              placeholderTextColor={colors.textSecondary}
              value={correctionText}
              onChangeText={setCorrectionText}
              onFocus={handleTextInputFocus}
              multiline
              textAlignVertical="top"
              inputAccessoryViewID={KEYBOARD_ACCESSORY_VIEW_ID}
            />
            <KeyboardDoneButton />

            {/* Voice section */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Or use voice</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Mic button */}
            <View style={styles.micContainer}>
              <Animated.View style={micAnimatedStyle}>
                <TouchableOpacity
                  style={[
                    styles.micButton,
                    isListening && styles.micButtonActive,
                  ]}
                  onPress={handleMicPress}
                  activeOpacity={0.8}
                >
                  <Image
                    source={require('../assets/icons/ic_voice.png')}
                    style={[
                      styles.micIcon,
                      isListening && styles.micIconActive,
                    ]}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              </Animated.View>
              <Text style={styles.micLabel}>
                {isListening ? 'Listening...' : 'Push to speak'}
              </Text>
            </View>

            {/* Quick suggestions */}
            <Text style={styles.suggestionsLabel}>Quick suggestions</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.suggestionsScroll}
              contentContainerStyle={styles.suggestionsContent}
            >
              {QUICK_SUGGESTIONS.map((suggestion) => (
                <TouchableOpacity
                  key={suggestion}
                  style={styles.suggestionChip}
                  onPress={() => handleQuickSuggestion(suggestion)}
                >
                  <Text style={styles.suggestionText}>{suggestion}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </ScrollView>

          {/* Apply button */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.applyButton,
                !correctionText.trim() && styles.applyButtonDisabled,
              ]}
              onPress={handleApplyCorrection}
              disabled={!correctionText.trim()}
            >
              <Text style={styles.applyButtonIcon}>✓</Text>
              <Text style={styles.applyButtonText}>Apply Correction</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>

      {/* Language Bottom Sheet */}
      <BottomSheet
        visible={languageModalVisible}
        onClose={() => setLanguageModalVisible(false)}
        title="Select Language"
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          {LANGUAGES.map(renderLanguageItem)}
        </ScrollView>
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
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  languageButtonIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  languageButtonText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  textInput: {
    backgroundColor: '#E8EDE7',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    minHeight: 120,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#DCDEDB',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: colors.textSecondary,
  },
  micContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  micButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  micButtonActive: {
    backgroundColor: '#FF6B6B',
  },
  micIcon: {
    width: 32,
    height: 32,
    tintColor: colors.white,
  },
  micIconActive: {
    tintColor: colors.white,
  },
  micLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  suggestionsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  suggestionsScroll: {
    marginBottom: 24,
  },
  suggestionsContent: {
    gap: 8,
  },
  suggestionChip: {
    backgroundColor: '#E8F5E9',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  suggestionText: {
    fontSize: 14,
    color: colors.accent,
    fontWeight: '500',
  },
  buttonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  applyButton: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyButtonDisabled: {
    backgroundColor: '#A5A5A5',
  },
  applyButtonIcon: {
    fontSize: 18,
    color: colors.white,
    marginRight: 8,
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
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

export default CorrectionScreen;
