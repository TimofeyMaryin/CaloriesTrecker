import analytics from '@react-native-firebase/analytics';
import { AdaptyManager } from '../adapty';

/**
 * Firebase Service - handles analytics and integration with other services
 */
class FirebaseService {
  private static instance: FirebaseService;
  private isInitialized: boolean = false;

  private constructor() {}

  static getInstance(): FirebaseService {
    if (!FirebaseService.instance) {
      FirebaseService.instance = new FirebaseService();
    }
    return FirebaseService.instance;
  }

  /**
   * Initialize Firebase and sync with Adapty
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('[Firebase] Already initialized');
      return;
    }

    try {
      // Get Firebase App Instance ID
      const appInstanceId = await analytics().getAppInstanceId();
      
      if (appInstanceId) {
        // Sync with Adapty for attribution
        await AdaptyManager.setIntegrationIdentifier('firebase_app_instance_id', appInstanceId);
        console.log('[Firebase] App Instance ID synced with Adapty');
      }

      this.isInitialized = true;
      console.log('[Firebase] Initialized successfully');
    } catch (error) {
      console.error('[Firebase] Initialization error:', error);
    }
  }

  /**
   * Log custom event
   */
  async logEvent(name: string, params?: Record<string, any>): Promise<void> {
    try {
      await analytics().logEvent(name, params);
      console.log(`[Firebase] Event logged: ${name}`);
    } catch (error) {
      console.error('[Firebase] Log event error:', error);
    }
  }

  /**
   * Log screen view
   */
  async logScreenView(screenName: string, screenClass?: string): Promise<void> {
    try {
      await analytics().logScreenView({
        screen_name: screenName,
        screen_class: screenClass || screenName,
      });
    } catch (error) {
      console.error('[Firebase] Log screen view error:', error);
    }
  }

  /**
   * Set user property
   */
  async setUserProperty(name: string, value: string): Promise<void> {
    try {
      await analytics().setUserProperty(name, value);
    } catch (error) {
      console.error('[Firebase] Set user property error:', error);
    }
  }

  /**
   * Set user ID
   */
  async setUserId(userId: string | null): Promise<void> {
    try {
      await analytics().setUserId(userId);
    } catch (error) {
      console.error('[Firebase] Set user ID error:', error);
    }
  }

  // ============ Pre-defined Events ============

  /**
   * Log trial started event
   */
  async logTrialStarted(): Promise<void> {
    await this.logEvent('trial_started');
  }

  /**
   * Log trial converted event
   */
  async logTrialConverted(): Promise<void> {
    await this.logEvent('trial_converted');
  }

  /**
   * Log purchase event
   */
  async logPurchase(productId: string, price?: number, currency?: string): Promise<void> {
    await this.logEvent('purchase', {
      product_id: productId,
      price,
      currency,
    });
  }

  /**
   * Log meal scanned event
   */
  async logMealScanned(source: 'camera' | 'gallery' | 'voice'): Promise<void> {
    await this.logEvent('meal_scanned', { source });
  }

  /**
   * Log onboarding completed event
   */
  async logOnboardingCompleted(): Promise<void> {
    await this.logEvent('onboarding_completed');
  }

  /**
   * Log paywall shown event
   */
  async logPaywallShown(placementId: string): Promise<void> {
    await this.logEvent('paywall_shown', { placement_id: placementId });
  }

  /**
   * Log paywall closed event
   */
  async logPaywallClosed(placementId: string, purchased: boolean): Promise<void> {
    await this.logEvent('paywall_closed', {
      placement_id: placementId,
      purchased,
    });
  }
}

export default FirebaseService.getInstance();
