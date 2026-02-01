import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../theme/colors';
import TopBar from '../components/TopBar';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useFavoriteStore } from '../store/favoriteStore';
import { MealRecord } from '../types/meal';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const FavoriteScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { favorites } = useFavoriteStore();

  const handleMealPress = (meal: MealRecord) => {
    navigation.navigate('MealResult', { meal });
  };

  const renderMealCard = ({ item }: { item: MealRecord }) => (
    <TouchableOpacity
      style={styles.mealCard}
      onPress={() => handleMealPress(item)}
      activeOpacity={0.7}
    >
      {item.imageUri ? (
        <Image
          source={{ uri: item.imageUri }}
          style={styles.mealImage}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.mealImage, styles.placeholderImage]}>
          <Text style={styles.placeholderEmoji}>🍽️</Text>
        </View>
      )}
      <View style={styles.mealInfo}>
        <Text style={styles.mealTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.mealCalories}>
          {Math.round(item.totals.totalCalories)} kcal
        </Text>
        <View style={styles.mealMacros}>
          <Text style={styles.macroText}>
            🐟 {Math.round(item.totals.totalProteins)}g
          </Text>
          <Text style={styles.macroText}>
            🥦 {Math.round(item.totals.totalCarbs)}g
          </Text>
          <Text style={styles.macroText}>
            🥜 {Math.round(item.totals.totalFats)}g
          </Text>
        </View>
      </View>
      <View style={styles.heartContainer}>
        <Text style={styles.heartIcon}>♥</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <TopBar
        title="Favorite"
        showBack={true}
        onBackPress={() => navigation.goBack()}
      />
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        {favorites.length > 0 ? (
          <FlatList
            data={favorites}
            renderItem={renderMealCard}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyContent}>
            <Image
              source={require('../assets/mascout.png')}
              style={styles.emptyImage}
              resizeMode="contain"
            />
            <Text style={styles.emptyTitle}>
              Your favorites will appear here.
            </Text>
            <Text style={styles.emptySubtitle}>
              Save meals to find them faster!
            </Text>
          </View>
        )}
      </SafeAreaView>
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
  listContent: {
    padding: 16,
    gap: 12,
  },
  mealCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  mealImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  placeholderImage: {
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderEmoji: {
    fontSize: 32,
  },
  mealInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  mealTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  mealCalories: {
    fontSize: 14,
    color: colors.accent,
    fontWeight: '600',
    marginBottom: 6,
  },
  mealMacros: {
    flexDirection: 'row',
    gap: 8,
  },
  macroText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  heartContainer: {
    justifyContent: 'center',
    paddingLeft: 8,
  },
  heartIcon: {
    fontSize: 20,
    color: '#FF3B30',
  },
  emptyContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyImage: {
    width: 200,
    height: 200,
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

export default FavoriteScreen;
