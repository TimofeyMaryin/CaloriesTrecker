import NetInfo from '@react-native-community/netinfo';

/**
 * Check if device has internet connection
 */
export async function checkNetworkConnection(): Promise<boolean> {
  try {
    const state = await NetInfo.fetch();
    return state.isConnected ?? false;
  } catch (error) {
    console.error('[Network] Error checking connection:', error);
    return false;
  }
}

/**
 * Subscribe to network state changes
 */
export function subscribeToNetworkChanges(
  callback: (isConnected: boolean) => void
): () => void {
  return NetInfo.addEventListener((state) => {
    callback(state.isConnected ?? false);
  });
}
