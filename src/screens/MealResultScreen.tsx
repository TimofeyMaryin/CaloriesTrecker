import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Share,
  Modal,
  Pressable,
  Alert,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../theme/colors';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useFavoriteStore } from '../store/favoriteStore';
import { useMealStore } from '../store/mealStore';
import { Ingredient } from '../types/meal';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type MealResultRouteProp = RouteProp<RootStackParamList, 'MealResult'>;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const IMAGE_HEIGHT = SCREEN_HEIGHT * 0.4;

const MealResultScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<MealResultRouteProp>();
  const insets = useSafeAreaInsets();
  const { meal } = route.params;

  const [servings, setServings] = useState(1);
  const [menuVisible, setMenuVisible] = useState(false);
  const [ingredients, setIngredients] = useState<Ingredient[]>(meal.ingredients);
  const [excludedIndices, setExcludedIndices] = useState<Set<number>>(new Set());

  // Stores
  const { isFavorite, toggleFavorite } = useFavoriteStore();
  const { removeMeal } = useMealStore();
  const [isLiked, setIsLiked] = useState(isFavorite(meal.id));

  // Calculate values based on non-excluded ingredients and servings
  const totals = ingredients.reduce(
    (acc, ing, index) => {
      if (excludedIndices.has(index)) return acc;
      return {
        calories: acc.calories + ing.calories,
        proteins: acc.proteins + ing.proteins,
        carbs: acc.carbs + ing.carbs,
        fats: acc.fats + ing.fats,
      };
    },
    { calories: 0, proteins: 0, carbs: 0, fats: 0 }
  );

  const calories = Math.round(totals.calories * servings);
  const proteins = Math.round(totals.proteins * servings * 10) / 10;
  const carbs = Math.round(totals.carbs * servings * 10) / 10;
  const fats = Math.round(totals.fats * servings * 10) / 10;

  const handleBack = () => {
    // Reset navigation stack to avoid accumulating screens
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainTabs' }],
    });
  };

  const handleLike = () => {
    const newState = toggleFavorite(meal);
    setIsLiked(newState);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${meal.title}\n\nCalories: ${calories}\nProteins: ${proteins}g\nCarbs: ${carbs}g\nFats: ${fats}g\n\nTracked with CaloriesTracker`,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleCorrectResult = () => {
    // Navigate to correction screen
    navigation.navigate('Correction', { meal });
  };

  const handleReset = () => {
    setMenuVisible(false);
    // Reset excluded ingredients
    setExcludedIndices(new Set());
  };

  const handleDelete = () => {
    setMenuVisible(false);
    Alert.alert(
      'Delete Meal',
      'Are you sure you want to delete this meal?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // Delete from store
            removeMeal(meal.id);
            // Navigate to main screen
            navigation.reset({
              index: 0,
              routes: [{ name: 'MainTabs' }],
            });
          },
        },
      ]
    );
  };

  // Toggle ingredient exclusion via swipe
  const handleToggleIngredient = useCallback((index: number, swipeableRef: Swipeable | null) => {
    setExcludedIndices(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
    // Close the swipeable
    swipeableRef?.close();
  }, []);

  // Render swipe action (exclude or restore)
  const renderRightActions = useCallback((index: number, swipeableRef: Swipeable | null) => {
    const isExcluded = excludedIndices.has(index);
    return (
      <TouchableOpacity
        style={[styles.swipeAction, isExcluded ? styles.restoreAction : styles.excludeAction]}
        onPress={() => handleToggleIngredient(index, swipeableRef)}
      >
        <Text style={styles.swipeActionIcon}>{isExcluded ? '↩' : '✕'}</Text>
        <Text style={styles.swipeActionText}>{isExcluded ? 'Restore' : 'Exclude'}</Text>
      </TouchableOpacity>
    );
  }, [excludedIndices, handleToggleIngredient]);

  return (
    <View style={styles.container}>
      {/* Background Image - Fixed Layer */}
      {meal.imageUri ? (
        <Image
          source={{ uri: meal.imageUri }}
          style={styles.backgroundImage}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.placeholderBackground}>
          <Image
            source={require('../assets/icons/ic_add_dish.png')}
            style={styles.placeholderIcon}
            resizeMode="contain"
          />
        </View>
      )}

      {/* Top Bar - Fixed */}
      <View style={[styles.topBar, { paddingTop: insets.top }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
        >
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <View style={styles.topBarRight}>
          <TouchableOpacity style={styles.topBarButton} onPress={handleLike}>
            <Text style={styles.heartIcon}>{isLiked ? '♥' : '♡'}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.topBarButton}
            onPress={() => setMenuVisible(true)}
          >
            <Text style={styles.moreIcon}>⋮</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Dropdown Menu */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable 
          style={styles.menuOverlay}
          onPress={() => setMenuVisible(false)}
        >
          <View style={[styles.menuContainer, { top: insets.top + 50, right: 16 }]}>
            <TouchableOpacity 
              style={[styles.menuItem, excludedIndices.size === 0 && styles.menuItemDisabled]} 
              onPress={handleReset}
              disabled={excludedIndices.size === 0}
            >
              <Text style={[styles.menuIcon, excludedIndices.size === 0 && styles.menuTextDisabled]}>↺</Text>
              <Text style={[styles.menuText, excludedIndices.size === 0 && styles.menuTextDisabled]}>Reset</Text>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity style={styles.menuItem} onPress={handleDelete}>
              <Text style={[styles.menuIcon, styles.deleteIcon]}>🗑</Text>
              <Text style={[styles.menuText, styles.deleteText]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Scrollable Content - On Top */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Spacer to show image initially */}
        <View style={styles.imageSpacer} />

        {/* Content Card */}
        <View style={styles.contentCard}>
          <View style={styles.handle} />

          {/* Title */}
          <Text style={styles.title}>{meal.title}</Text>

          {/* Servings Counter */}
          <View style={styles.servingsContainer}>
            <TouchableOpacity
              style={styles.servingButton}
              onPress={() => setServings(Math.max(0.25, servings - 0.25))}
            >
              <Text style={styles.servingButtonText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.servingsCount}>{servings}</Text>
            <TouchableOpacity
              style={styles.servingButton}
              onPress={() => setServings(servings + 0.25)}
            >
              <Text style={styles.servingButtonText}>+</Text>
            </TouchableOpacity>
          </View>

          {/* Calories Card */}
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Calories</Text>
            <Text style={styles.infoValue}>{calories}</Text>
          </View>

          {/* Health Assessment Card */}
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Health assessment</Text>
            <View style={styles.healthValue}>
              <Text style={styles.healthHeart}>💚</Text>
              <Text style={styles.infoValue}>{meal.health}/10</Text>
            </View>
          </View>

          {/* Macros Row */}
          <View style={styles.macrosRow}>
            <View style={styles.macroCard}>
              <View style={styles.macroHeader}>
                <Text style={styles.macroEmoji}>🐟</Text>
                <Text style={styles.macroLabel}>Proteins</Text>
              </View>
              <Text style={styles.macroValue}>{proteins} g</Text>
            </View>
            <View style={styles.macroCard}>
              <View style={styles.macroHeader}>
                <Text style={styles.macroEmoji}>🥦</Text>
                <Text style={styles.macroLabel}>Carbs</Text>
              </View>
              <Text style={styles.macroValue}>{carbs} g</Text>
            </View>
            <View style={styles.macroCard}>
              <View style={styles.macroHeader}>
                <Text style={styles.macroEmoji}>🥜</Text>
                <Text style={styles.macroLabel}>Fats</Text>
              </View>
              <Text style={styles.macroValue}>{fats} g</Text>
            </View>
          </View>

          {/* Ingredients Section */}
          <Text style={styles.sectionTitle}>Ingredients</Text>
          <Text style={styles.swipeHint}>Swipe left to exclude/restore</Text>
          {ingredients.map((ingredient, index) => {
            const isExcluded = excludedIndices.has(index);
            let swipeableRef: Swipeable | null = null;
            return (
              <Swipeable
                key={`${ingredient.title}-${index}`}
                ref={(ref) => { swipeableRef = ref; }}
                renderRightActions={() => renderRightActions(index, swipeableRef)}
                overshootRight={false}
              >
                <View style={[styles.ingredientCard, isExcluded && styles.ingredientCardExcluded]}>
                  <View style={styles.ingredientHeader}>
                    <Text style={[styles.ingredientName, isExcluded && styles.textExcluded]} numberOfLines={2}>
                      {ingredient.title}
                    </Text>
                    <Text style={[styles.ingredientCalories, isExcluded && styles.textExcluded]}>
                      {Math.round(ingredient.calories * servings)} Kcal
                    </Text>
                  </View>
                  <Text style={[styles.ingredientWeight, isExcluded && styles.textExcluded]}>
                    {Math.round(ingredient.weight * servings)} g per serving
                  </Text>
                  <View style={styles.ingredientMacros}>
                    <Text style={[styles.ingredientMacro, isExcluded && styles.textExcluded]}>
                      🐟 Prot - {Math.round(ingredient.proteins * servings * 10) / 10}
                    </Text>
                    <Text style={[styles.ingredientMacro, isExcluded && styles.textExcluded]}>
                      🥦 Carbs - {Math.round(ingredient.carbs * servings * 10) / 10}
                    </Text>
                    <Text style={[styles.ingredientMacro, isExcluded && styles.textExcluded]}>
                      🥜 Fats - {Math.round(ingredient.fats * servings * 10) / 10}
                    </Text>
                  </View>
                </View>
              </Swipeable>
            );
          })}
        </View>
      </ScrollView>

      {/* Bottom Buttons - Fixed */}
      <View style={[styles.bottomButtons, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={styles.correctButton}
          onPress={handleCorrectResult}
        >
          <Text style={styles.correctButtonText}>Correct result ✨</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.shareButton}
          onPress={handleShare}
        >
          <Text style={styles.shareButtonText}>Share ↗</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SCREEN_WIDTH,
    height: IMAGE_HEIGHT,
  },
  placeholderBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SCREEN_WIDTH,
    height: IMAGE_HEIGHT,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderIcon: {
    width: 64,
    height: 64,
    tintColor: '#A0A0A0',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 32,
    color: colors.white,
    fontWeight: '300',
  },
  topBarRight: {
    flexDirection: 'row',
    gap: 8,
  },
  topBarButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heartIcon: {
    fontSize: 24,
    color: colors.white,
  },
  moreIcon: {
    fontSize: 24,
    color: colors.white,
  },
  // Menu styles
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  menuContainer: {
    position: 'absolute',
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingVertical: 8,
    minWidth: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  menuIcon: {
    fontSize: 18,
    color: colors.text,
  },
  menuText: {
    fontSize: 16,
    color: colors.text,
  },
  menuItemDisabled: {
    opacity: 0.4,
  },
  menuTextDisabled: {
    color: colors.textSecondary,
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginHorizontal: 16,
  },
  deleteIcon: {
    color: '#FF3B30',
  },
  deleteText: {
    color: '#FF3B30',
  },
  scrollView: {
    flex: 1,
  },
  imageSpacer: {
    height: IMAGE_HEIGHT - 24,
  },
  contentCard: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    minHeight: SCREEN_HEIGHT * 0.7,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  servingsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  servingButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  servingButtonText: {
    fontSize: 24,
    color: colors.accent,
    fontWeight: '500',
  },
  servingsCount: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text,
    marginHorizontal: 24,
  },
  infoCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  infoLabel: {
    fontSize: 16,
    color: colors.text,
  },
  infoValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  healthValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  healthHeart: {
    fontSize: 20,
  },
  macrosRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    marginBottom: 20,
  },
  macroCard: {
    flex: 1,
    backgroundColor: '#F8FFF8',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E8F5E9',
  },
  macroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  macroEmoji: {
    fontSize: 16,
  },
  macroLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  macroValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  swipeHint: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  swipeAction: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    marginBottom: 8,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
  },
  excludeAction: {
    backgroundColor: '#FF3B30',
  },
  restoreAction: {
    backgroundColor: colors.accent,
  },
  swipeActionIcon: {
    color: colors.white,
    fontSize: 20,
    marginBottom: 4,
  },
  swipeActionText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 12,
  },
  ingredientCardExcluded: {
    opacity: 0.6,
    backgroundColor: '#F5F5F5',
  },
  textExcluded: {
    textDecorationLine: 'line-through',
    color: colors.textSecondary,
  },
  ingredientCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  ingredientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
    gap: 12,
  },
  ingredientName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    flexShrink: 1,
  },
  ingredientCalories: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flexShrink: 0,
  },
  ingredientWeight: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  ingredientMacros: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  ingredientMacro: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  bottomButtons: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  correctButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: colors.accent,
    alignItems: 'center',
  },
  correctButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.accent,
  },
  shareButton: {
    flex: 1.2,
    paddingVertical: 16,
    borderRadius: 28,
    backgroundColor: colors.accent,
    alignItems: 'center',
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
});

export default MealResultScreen;
