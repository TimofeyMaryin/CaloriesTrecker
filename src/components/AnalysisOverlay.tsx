import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_WIDTH = SCREEN_WIDTH * 0.8;

interface AnalysisOverlayProps {
  type: 'analyzing' | 'error';
  onRetry?: () => void;
}

const AnalysisOverlay: React.FC<AnalysisOverlayProps> = ({ type, onRetry }) => {
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (type === 'analyzing') {
      // Animate progress bar infinitely
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(progressAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: false,
          }),
          Animated.timing(progressAnim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: false,
          }),
        ]),
      );
      animation.start();

      return () => animation.stop();
    }
  }, [type, progressAnim]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  if (type === 'analyzing') {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.content}>
          <Image
            source={require('../assets/mascout_happy.png')}
            style={styles.mascotImage}
            resizeMode="contain"
          />
          <Text style={styles.title}>Analysing...</Text>
          <Text style={styles.subtitle}>Please wait</Text>
          <View style={styles.progressContainer}>
            <Animated.View
              style={[styles.progressBar, { width: progressWidth }]}
            />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // Error state
  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.content}>
        <Image
          source={require('../assets/mascout_sad.png')}
          style={styles.mascotImage}
          resizeMode="contain"
        />
        <Text style={styles.title}>Sorry, I didn't catch that</Text>
        <Text style={styles.subtitle}>Please, try again</Text>
      </SafeAreaView>
      <SafeAreaView style={styles.bottomSection} edges={['bottom']}>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={onRetry}
          activeOpacity={0.8}
        >
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  mascotImage: {
    width: IMAGE_WIDTH,
    height: IMAGE_WIDTH,
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  progressContainer: {
    width: '80%',
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: 4,
  },
  bottomSection: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  retryButton: {
    backgroundColor: colors.accent,
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
});

export default AnalysisOverlay;
