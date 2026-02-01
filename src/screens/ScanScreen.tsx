import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../theme/colors';
import { RootStackParamList } from '../navigation/AppNavigator';
import { processImageForUpload } from '../utils/imageProcessing';
import { analyzeMealFromImage, MealAnalysisError } from '../api/mealAnalysis';
import { useMealStore } from '../store/mealStore';
import { useSettingsStore } from '../store/settingsStore';
import AnalysisOverlay from '../components/AnalysisOverlay';
import NoInternetOverlay from '../components/NoInternetOverlay';
import { checkNetworkConnection } from '../utils/networkUtils';
import { saveToGallery } from '../utils/saveToGallery';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type ScanRouteProp = RouteProp<RootStackParamList, 'Scan'>;

type ScreenState = 'picking' | 'analyzing' | 'error' | 'no_internet';

const ScanScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ScanRouteProp>();
  const { mode, locale } = route.params;
  
  const [screenState, setScreenState] = useState<ScreenState>('picking');
  const [pendingImageUri, setPendingImageUri] = useState<string | null>(null);
  
  const addMeal = useMealStore((state) => state.addMeal);
  const savePhotoEnabled = useSettingsStore((state) => state.savePhotoEnabled);

  useEffect(() => {
    handleImagePick();
  }, []);

  const handleImagePick = async () => {
    try {
      let result: ImagePicker.ImagePickerResult;

      if (mode === 'camera') {
        // Request camera permission
        const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
        if (cameraStatus !== 'granted') {
          Alert.alert('Permission Required', 'Camera access is needed to scan food.');
          navigation.goBack();
          return;
        }

        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          quality: 1,
          allowsEditing: false,
        });
      } else {
        // Gallery mode
        const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (mediaStatus !== 'granted') {
          Alert.alert('Permission Required', 'Photo library access is needed.');
          navigation.goBack();
          return;
        }

        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          quality: 1,
          allowsEditing: false,
        });
      }

      if (result.canceled || !result.assets?.[0]) {
        navigation.goBack();
        return;
      }

      const imageUri = result.assets[0].uri;
      await processAndAnalyze(imageUri);
    } catch (err) {
      console.error('Image pick error:', err);
      setScreenState('error');
    }
  };

  const processAndAnalyze = async (imageUri: string) => {
    try {
      // Check network connection first
      const isConnected = await checkNetworkConnection();
      if (!isConnected) {
        setPendingImageUri(imageUri);
        setScreenState('no_internet');
        return;
      }

      // Show analyzing overlay
      setScreenState('analyzing');
      
      // Process image
      const base64Image = await processImageForUpload(imageUri);

      // Analyze with AI
      const response = await analyzeMealFromImage(base64Image, locale);

      // Check if it's food
      if (!response.isFood) {
        setScreenState('error');
        return;
      }

      // Save photo to gallery if enabled
      if (savePhotoEnabled) {
        await saveToGallery(imageUri);
      }

      // Save to store
      const meal = addMeal(
        response.title,
        response.health,
        response.ingredients,
        imageUri,
      );

      // Navigate to result
      navigation.replace('MealResult', { meal });
    } catch (err) {
      console.error('Analysis error:', err);
      
      if (err instanceof MealAnalysisError && err.code === 'NOT_FOOD') {
        setScreenState('error');
        return;
      }
      
      setScreenState('error');
    }
  };

  const handleNetworkRetry = async () => {
    if (pendingImageUri) {
      await processAndAnalyze(pendingImageUri);
    }
  };

  const handleNetworkClose = () => {
    navigation.goBack();
  };

  const handleRetry = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainTabs' }],
    });
  };

  // No internet state
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

  // Error state
  if (screenState === 'error') {
    return <AnalysisOverlay type="error" onRetry={handleRetry} />;
  }

  // Analyzing or picking state - show analyzing overlay
  return <AnalysisOverlay type="analyzing" />;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});

export default ScanScreen;
