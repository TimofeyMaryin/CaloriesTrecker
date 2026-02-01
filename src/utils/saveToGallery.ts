import * as MediaLibrary from 'expo-media-library';
import { Alert } from 'react-native';

/**
 * Save an image to the device's photo gallery
 * @param imageUri - The URI of the image to save
 * @returns true if saved successfully, false otherwise
 */
export async function saveToGallery(imageUri: string): Promise<boolean> {
  try {
    // Request permission
    const { status } = await MediaLibrary.requestPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please allow access to your photo library to save images.'
      );
      return false;
    }

    // Save the image
    await MediaLibrary.saveToLibraryAsync(imageUri);
    console.log('[Gallery] Image saved successfully');
    return true;
  } catch (error) {
    console.error('[Gallery] Error saving image:', error);
    return false;
  }
}
