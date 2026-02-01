import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../theme/colors';
import TopBar from '../components/TopBar';
import { FirebaseService } from '../services/firebase';

interface FAQItem {
  question: string;
  answer: string;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    question: 'How do I track my meals?',
    answer: 'Simply take a photo of your meal and our AI will automatically analyze and log the nutritional information.',
  },
  {
    question: 'Can I edit meal information?',
    answer: 'Yes! Tap on any logged meal to edit its details, including calories, macros, and serving size.',
  },
  {
    question: 'How accurate is the calorie counting?',
    answer: 'Our AI provides estimates based on visual analysis. For most accurate results, you can manually adjust values.',
  },
];

const FAQScreen = () => {
  const navigation = useNavigation();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  // Log analytics event on mount
  React.useEffect(() => {
    FirebaseService.logEvent('faq_opened');
  }, []);

  return (
    <View style={styles.container}>
      <TopBar
        title="FAQ"
        showBack={true}
        onBackPress={() => navigation.goBack()}
        backgroundColor={colors.background}
      />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <SafeAreaView style={styles.safeArea} edges={['bottom']}>
          <View style={styles.content}>
            {FAQ_ITEMS.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.faqItem}
                onPress={() => toggleExpand(index)}
                activeOpacity={0.7}
              >
                <View style={styles.questionRow}>
                  <Text style={styles.question}>{item.question}</Text>
                  <Text style={styles.expandIcon}>
                    {expandedIndex === index ? '−' : '+'}
                  </Text>
                </View>
                {expandedIndex === index && (
                  <Text style={styles.answer}>{item.answer}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </SafeAreaView>
      </ScrollView>
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
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  faqItem: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  questionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  question: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginRight: 12,
  },
  expandIcon: {
    fontSize: 24,
    fontWeight: '300',
    color: colors.accent,
  },
  answer: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginTop: 12,
  },
});

export default FAQScreen;
