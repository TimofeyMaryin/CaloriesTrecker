import * as ImageManipulator from 'expo-image-manipulator';

const TARGET_PIXELS = 1024 * 32 * 32; // ~1 megapixel
const INITIAL_QUALITY = 0.7;

interface ImageDimensions {
  width: number;
  height: number;
}

/**
 * Resize and compress image for API upload
 * Returns base64 string with data URI prefix
 */
export async function processImageForUpload(uri: string): Promise<string> {
  // Get image dimensions
  const dimensions = await getImageDimensions(uri);
  
  // Calculate scale factor
  const currentPixels = dimensions.width * dimensions.height;
  const scaleFactor = Math.sqrt(TARGET_PIXELS / currentPixels);
  const scale = Math.min(scaleFactor, 1.0); // Don't upscale
  
  // Calculate new dimensions
  const newWidth = Math.round(dimensions.width * scale);
  const newHeight = Math.round(dimensions.height * scale);
  
  // Resize image and get base64 directly
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: newWidth, height: newHeight } }],
    { compress: INITIAL_QUALITY, format: ImageManipulator.SaveFormat.JPEG, base64: true },
  );
  
  if (!result.base64) {
    throw new Error('Failed to convert image to base64');
  }
  
  return `data:image/jpeg;base64,${result.base64}`;
}

/**
 * Get image dimensions from URI
 */
async function getImageDimensions(uri: string): Promise<ImageDimensions> {
  // For expo-image-manipulator, we can get dimensions by doing a no-op manipulation
  const result = await ImageManipulator.manipulateAsync(uri, [], { base64: false });
  return { width: result.width, height: result.height };
}
