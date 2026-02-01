import { adapty, createPaywallView } from 'react-native-adapty';
import { PLACEMENT_IDS, ACCESS_LEVEL_PREMIUM } from './constants';
import { usePremiumStore } from '../../store/premiumStore';

/**
 * Shows native Adapty paywall directly without intermediate screen
 */
export async function showPaywall(
  placementId: string = PLACEMENT_IDS.PAYWALL_MAIN,
  onClose?: () => void,
  onPurchased?: () => void,
): Promise<void> {
  try {
    // Get paywall from Adapty
    const paywall = await adapty.getPaywall(placementId);
    console.log('[Paywall] Loaded paywall:', paywall.placementId, 'for placement:', placementId);
    
    // Create the paywall view
    const view = await createPaywallView(paywall);
    console.log('[Paywall] View created');
    
    // Track if callbacks were already called
    let closeCallbackCalled = false;
    let purchaseCallbackCalled = false;
    
    const callOnClose = async () => {
      console.log('[Paywall] callOnClose called, closeCallbackCalled:', closeCallbackCalled, 'purchaseCallbackCalled:', purchaseCallbackCalled);
      if (!closeCallbackCalled && !purchaseCallbackCalled) {
        closeCallbackCalled = true;
        // Dismiss the view first
        try {
          await view.dismiss();
          console.log('[Paywall] View dismissed');
        } catch (e) {
          console.log('[Paywall] Dismiss error:', e);
        }
        onClose?.();
      }
    };
    
    const callOnPurchased = async () => {
      if (!purchaseCallbackCalled) {
        purchaseCallbackCalled = true;
        try {
          await view.dismiss();
        } catch (e) {
          console.log('[Paywall] Dismiss error:', e);
        }
        onPurchased?.();
      }
    };
    
    // Set event handlers
    console.log('[Paywall] Setting event handlers...');
    const unsubscribe = view.setEventHandlers({
      onCloseButtonPress: () => {
        console.log('[Paywall] onCloseButtonPress triggered');
        callOnClose();
        return true;
      },
      onPaywallClosed: () => {
        console.log('[Paywall] onPaywallClosed triggered');
        callOnClose();
        return true;
      },
      onCustomAction: (actionId) => {
        console.log('[Paywall] onCustomAction triggered:', actionId);
        // Any custom action that's not handled specifically should close the paywall
        callOnClose();
        return true;
      },
      onPurchaseCompleted: (purchaseResult) => {
        console.log('[Paywall] onPurchaseCompleted triggered:', purchaseResult.type);
        if (purchaseResult.type === 'success' && purchaseResult.profile) {
          const isPremium = purchaseResult.profile.accessLevels?.[ACCESS_LEVEL_PREMIUM]?.isActive ?? false;
          usePremiumStore.getState().setIsPremium(isPremium);
          if (isPremium) {
            callOnPurchased();
          }
        }
        return purchaseResult.type !== 'user_cancelled';
      },
      onPurchaseFailed: (error) => {
        console.log('[Paywall] onPurchaseFailed triggered:', error);
        return false;
      },
      onRestoreCompleted: (profile) => {
        console.log('[Paywall] onRestoreCompleted triggered');
        const isPremium = profile.accessLevels?.[ACCESS_LEVEL_PREMIUM]?.isActive ?? false;
        usePremiumStore.getState().setIsPremium(isPremium);
        if (isPremium) {
          callOnPurchased();
        }
        return isPremium;
      },
      onRestoreFailed: (error) => {
        console.log('[Paywall] onRestoreFailed triggered:', error);
        return false;
      },
      onRenderingFailed: (error) => {
        console.log('[Paywall] onRenderingFailed triggered:', error);
        callOnClose();
        return true;
      },
      onAndroidSystemBack: () => {
        console.log('[Paywall] onAndroidSystemBack triggered');
        callOnClose();
        return true;
      },
    });
    console.log('[Paywall] Event handlers set');
    
    // Present the paywall
    console.log('[Paywall] Presenting...');
    await view.present({ iosPresentationStyle: 'full_screen' });
    console.log('[Paywall] Presented');
    
  } catch (error) {
    console.error('[Paywall] Error showing paywall:', error);
    onClose?.();
  }
}

export default showPaywall;
