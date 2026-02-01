import { adapty, AdaptyProfile, AdaptyPaywall, AdaptyPaywallProduct } from 'react-native-adapty';
import { ADAPTY_SDK_KEY, ACCESS_LEVEL_PREMIUM, PLACEMENT_IDS } from './constants';
import { usePremiumStore } from '../../store/premiumStore';
import { FirebaseService } from '../firebase';

/**
 * Adapty Manager - handles all Adapty SDK interactions
 */
class AdaptyManager {
  private static instance: AdaptyManager;
  private isInitialized: boolean = false;
  private previousProfile: AdaptyProfile | null = null;

  private constructor() {}

  static getInstance(): AdaptyManager {
    if (!AdaptyManager.instance) {
      AdaptyManager.instance = new AdaptyManager();
    }
    return AdaptyManager.instance;
  }

  /**
   * Initialize Adapty SDK
   */
  async initialize(customerUserId?: string): Promise<void> {
    if (this.isInitialized) {
      console.log('[Adapty] Already initialized');
      return;
    }

    try {
      await adapty.activate(ADAPTY_SDK_KEY, {
        customerUserId,
      });
      
      this.isInitialized = true;
      console.log('[Adapty] SDK initialized successfully');

      // Get initial profile
      await this.refreshProfile();
    } catch (error) {
      console.error('[Adapty] Initialization error:', error);
      throw error;
    }
  }

  /**
   * Set integration identifiers (Firebase, AppsFlyer, etc.)
   */
  async setIntegrationIdentifier(key: string, value: string): Promise<void> {
    try {
      await adapty.setIntegrationIdentifier(key, value);
      console.log(`[Adapty] Integration identifier set: ${key}`);
    } catch (error) {
      console.error('[Adapty] Set integration identifier error:', error);
    }
  }

  /**
   * Get and refresh user profile
   */
  async refreshProfile(): Promise<AdaptyProfile | null> {
    try {
      const profile = await adapty.getProfile();
      this.handleProfileUpdate(profile);
      return profile;
    } catch (error) {
      console.error('[Adapty] Get profile error:', error);
      return null;
    }
  }

  /**
   * Handle profile updates and track trial/purchase events
   */
  private handleProfileUpdate(profile: AdaptyProfile): void {
    const premiumAccess = profile.accessLevels?.[ACCESS_LEVEL_PREMIUM];
    const isPremium = premiumAccess?.isActive ?? false;
    const hasIntroOffer = !!premiumAccess?.activeIntroductoryOfferType;

    // Track trial/purchase events
    if (this.previousProfile) {
      const prevAccess = this.previousProfile.accessLevels?.[ACCESS_LEVEL_PREMIUM];
      const wasPremium = prevAccess?.isActive ?? false;
      const hadIntroOffer = !!prevAccess?.activeIntroductoryOfferType;

      if (!wasPremium && isPremium && hasIntroOffer) {
        console.log('[Adapty] Event: trial_started');
        FirebaseService.logTrialStarted();
      } else if (hadIntroOffer && !hasIntroOffer && isPremium) {
        console.log('[Adapty] Event: trial_converted');
        FirebaseService.logTrialConverted();
      } else if (!wasPremium && isPremium && !hasIntroOffer) {
        console.log('[Adapty] Event: purchase');
        FirebaseService.logPurchase('subscription');
      }
    }

    // Update store
    usePremiumStore.getState().setIsPremium(isPremium);
    usePremiumStore.getState().setHasActiveTrialOffer(hasIntroOffer);

    this.previousProfile = profile;
  }

  /**
   * Check if user has premium access
   */
  async checkPremiumAccess(): Promise<boolean> {
    const profile = await this.refreshProfile();
    if (!profile) return false;
    
    const premiumAccess = profile.accessLevels?.[ACCESS_LEVEL_PREMIUM];
    return premiumAccess?.isActive ?? false;
  }

  /**
   * Get paywall by placement ID
   */
  async getPaywall(placementId: string): Promise<AdaptyPaywall | null> {
    try {
      const paywall = await adapty.getPaywall(placementId);
      console.log(`[Adapty] Paywall loaded: ${placementId}`);
      return paywall;
    } catch (error) {
      console.error('[Adapty] Get paywall error:', error);
      return null;
    }
  }

  /**
   * Get products for a paywall
   */
  async getPaywallProducts(paywall: AdaptyPaywall): Promise<AdaptyPaywallProduct[]> {
    try {
      const products = await adapty.getPaywallProducts(paywall);
      console.log(`[Adapty] Products loaded: ${products.length}`);
      return products;
    } catch (error) {
      console.error('[Adapty] Get products error:', error);
      return [];
    }
  }

  /**
   * Make a purchase
   */
  async makePurchase(product: AdaptyPaywallProduct): Promise<{
    success: boolean;
    cancelled: boolean;
    profile?: AdaptyProfile;
    error?: Error;
  }> {
    try {
      const result = await adapty.makePurchase(product);
      
      if (result.profile) {
        this.handleProfileUpdate(result.profile);
      }

      return {
        success: true,
        cancelled: false,
        profile: result.profile,
      };
    } catch (error: any) {
      // Check if purchase was cancelled
      if (error?.adaptyCode === 'paymentCancelled') {
        return {
          success: false,
          cancelled: true,
        };
      }

      console.error('[Adapty] Purchase error:', error);
      return {
        success: false,
        cancelled: false,
        error: error as Error,
      };
    }
  }

  /**
   * Restore purchases
   */
  async restorePurchases(): Promise<{
    success: boolean;
    isPremium: boolean;
    error?: Error;
  }> {
    try {
      const profile = await adapty.restorePurchases();
      this.handleProfileUpdate(profile);

      const isPremium = profile.accessLevels?.[ACCESS_LEVEL_PREMIUM]?.isActive ?? false;

      return {
        success: true,
        isPremium,
      };
    } catch (error) {
      console.error('[Adapty] Restore error:', error);
      return {
        success: false,
        isPremium: false,
        error: error as Error,
      };
    }
  }

  /**
   * Get onboarding paywall
   */
  async getOnboardingPaywall(): Promise<AdaptyPaywall | null> {
    return this.getPaywall(PLACEMENT_IDS.PAYWALL_ONBOARDING);
  }

  /**
   * Get main paywall (from settings)
   */
  async getMainPaywall(): Promise<AdaptyPaywall | null> {
    return this.getPaywall(PLACEMENT_IDS.PAYWALL_MAIN);
  }

  /**
   * Get offer paywall
   */
  async getOfferPaywall(): Promise<AdaptyPaywall | null> {
    return this.getPaywall(PLACEMENT_IDS.PAYWALL_OFFER);
  }

  /**
   * Log paywall shown event
   */
  async logPaywallShown(paywall: AdaptyPaywall): Promise<void> {
    try {
      await adapty.logShowPaywall(paywall);
      console.log('[Adapty] Paywall shown logged');
    } catch (error) {
      console.error('[Adapty] Log paywall shown error:', error);
    }
  }
}

export default AdaptyManager.getInstance();
