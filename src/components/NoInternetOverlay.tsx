import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { colors } from '../theme/colors';

interface NoInternetOverlayProps {
  visible: boolean;
  onRetry: () => void;
  onClose: () => void;
}

const NoInternetOverlay: React.FC<NoInternetOverlayProps> = ({
  visible,
  onRetry,
  onClose,
}) => {
  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Image
            source={require('../assets/mascout_sad.png')}
            style={styles.mascot}
            resizeMode="contain"
          />
          <Text style={styles.title}>No Internet Connection</Text>
          <Text style={styles.message}>
            Please check your internet connection and try again.
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 32,
    marginHorizontal: 32,
    alignItems: 'center',
  },
  mascot: {
    width: 120,
    height: 120,
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 48,
    marginBottom: 12,
    width: '100%',
    alignItems: 'center',
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  closeButton: {
    paddingVertical: 12,
  },
  closeButtonText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});

export default NoInternetOverlay;
