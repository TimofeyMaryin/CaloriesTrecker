import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  Linking,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Application from 'expo-application';
import * as Clipboard from 'expo-clipboard';
import * as MailComposer from 'expo-mail-composer';
import { colors } from '../theme/colors';
import { FirebaseService } from '../services/firebase';
import KeyboardDoneButton, { KEYBOARD_ACCESSORY_VIEW_ID } from './KeyboardDoneButton';

interface FeedbackModalProps {
  visible: boolean;
  onClose: () => void;
}

const FEEDBACK_EMAIL = '7774282@gmail.com';

const FeedbackModal: React.FC<FeedbackModalProps> = ({ visible, onClose }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isFormValid = name.trim() && email.trim() && isEmailValid && rating > 0 && message.trim();

  const resetForm = () => {
    setName('');
    setEmail('');
    setRating(0);
    setMessage('');
    setShowSuccess(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const getDeviceInfo = () => {
    return `
App Version: ${Application.nativeApplicationVersion || 'N/A'}
Build: ${Application.nativeBuildVersion || 'N/A'}
Platform: ${Platform.OS} ${Platform.Version}
`;
  };

  const buildEmailBody = () => {
    return `Name: ${name}
Email: ${email}
Rating: ${'★'.repeat(rating)}${'☆'.repeat(5 - rating)} (${rating}/5)

Message:
${message}

---
${getDeviceInfo()}`;
  };

  const handleSubmit = async () => {
    if (!isFormValid) return;

    const subject = 'Feedback (iOS)';
    const body = buildEmailBody();

    try {
      // Try to use MailComposer
      const isAvailable = await MailComposer.isAvailableAsync();
      
      if (isAvailable) {
        await MailComposer.composeAsync({
          recipients: [FEEDBACK_EMAIL],
          subject,
          body,
        });
        FirebaseService.logEvent('feedback_sent', { rating });
        setShowSuccess(true);
      } else {
        // Fallback to mailto
        const mailtoUrl = `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        const canOpen = await Linking.canOpenURL(mailtoUrl);
        
        if (canOpen) {
          await Linking.openURL(mailtoUrl);
          FirebaseService.logEvent('feedback_sent', { rating });
          setShowSuccess(true);
        } else {
          // Copy to clipboard as last resort
          await Clipboard.setStringAsync(`To: ${FEEDBACK_EMAIL}\nSubject: ${subject}\n\n${body}`);
          Alert.alert(
            'Email Copied',
            'Email client not available. Feedback copied to clipboard.',
            [{ text: 'OK', onPress: handleClose }]
          );
          FirebaseService.logEvent('feedback_sent', { rating, method: 'clipboard' });
        }
      }
    } catch (error) {
      console.error('Feedback error:', error);
      Alert.alert('Error', 'Failed to send feedback. Please try again.');
    }
  };

  if (showSuccess) {
    return (
      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.container}>
          <View style={styles.successContainer}>
            <Text style={styles.successEmoji}>🎉</Text>
            <Text style={styles.successTitle}>Thank you!</Text>
            <Text style={styles.successMessage}>
              Your feedback has been sent. We appreciate you taking the time to help us improve!
            </Text>
            <TouchableOpacity style={styles.doneButton} onPress={handleClose}>
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        <KeyboardDoneButton />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleClose}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Feedback</Text>
            <View style={{ width: 60 }} />
          </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.content}>
              {/* Name */}
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Your name"
                placeholderTextColor={colors.textSecondary}
                inputAccessoryViewID={KEYBOARD_ACCESSORY_VIEW_ID}
              />

              {/* Email */}
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={[styles.input, email && !isEmailValid && styles.inputError]}
                value={email}
                onChangeText={setEmail}
                placeholder="your@email.com"
                placeholderTextColor={colors.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
                inputAccessoryViewID={KEYBOARD_ACCESSORY_VIEW_ID}
              />
              {email && !isEmailValid && (
                <Text style={styles.errorText}>Please enter a valid email</Text>
              )}

              {/* Rating */}
              <Text style={styles.label}>Rating</Text>
              <View style={styles.ratingContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setRating(star)}
                    style={styles.starButton}
                  >
                    <Text style={[styles.star, star <= rating && styles.starFilled]}>
                      {star <= rating ? '★' : '☆'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Message */}
              <Text style={styles.label}>Message</Text>
              <TextInput
                style={[styles.input, styles.messageInput]}
                value={message}
                onChangeText={setMessage}
                placeholder="Tell us what you think..."
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
                inputAccessoryViewID={KEYBOARD_ACCESSORY_VIEW_ID}
              />
            </View>
          </ScrollView>

          {/* Submit Button */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.submitButton, !isFormValid && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={!isFormValid}
            >
              <Text style={styles.submitButtonText}>Send Feedback</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  cancelButton: {
    fontSize: 16,
    color: colors.accent,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  inputError: {
    borderColor: '#FF6B6B',
  },
  errorText: {
    fontSize: 12,
    color: '#FF6B6B',
    marginTop: 4,
  },
  messageInput: {
    height: 120,
  },
  ratingContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  starButton: {
    padding: 4,
  },
  star: {
    fontSize: 32,
    color: '#DCDEDB',
  },
  starFilled: {
    color: '#FFD700',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  submitButton: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  successEmoji: {
    fontSize: 64,
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  successMessage: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  doneButton: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 48,
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
});

export default FeedbackModal;
