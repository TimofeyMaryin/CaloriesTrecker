import {
  MealAnalysisRequest,
  MealAnalysisResponse,
} from '../types/meal';

const API_URL = 'https://n8n.40r93.com/webhook/calories';
const REQUEST_TIMEOUT = 60000; // 60 seconds

export class MealAnalysisError extends Error {
  constructor(
    message: string,
    public code: 'NETWORK' | 'SERVER' | 'DECODE' | 'NOT_FOOD',
    public validationError?: string,
  ) {
    super(message);
    this.name = 'MealAnalysisError';
  }
}


export async function analyzeMealFromImage(
  imageBase64: string,
  locale: string,
): Promise<MealAnalysisResponse> {
  return analyzeMeal({
    text: null,
    image: imageBase64,
    previous: null,
    locale,
  });
}

/**
 * Analyze meal from text (voice transcription or manual input)
 */
export async function analyzeMealFromText(
  text: string,
  locale: string,
): Promise<MealAnalysisResponse> {
  return analyzeMeal({
    text,
    image: null,
    previous: null,
    locale,
  });
}

/**
 * Core API call
 */
async function analyzeMeal(
  request: MealAnalysisRequest,
): Promise<MealAnalysisResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Check HTTP status
    if (!response.ok) {
      throw new MealAnalysisError(
        `Server error: ${response.status}`,
        'SERVER',
      );
    }

    // Parse response
    const text = await response.text();
    if (!text) {
      throw new MealAnalysisError('Empty response from server', 'DECODE');
    }

    let data: MealAnalysisResponse;
    try {
      data = JSON.parse(text);
    } catch {
      throw new MealAnalysisError('Invalid JSON response', 'DECODE');
    }

    // Validate response structure
    if (!data.title || !Array.isArray(data.ingredients)) {
      throw new MealAnalysisError('Invalid response structure', 'DECODE');
    }

    // Check if it's food
    if (data.isFood === false) {
      throw new MealAnalysisError(
        data.validationError || 'This is not food',
        'NOT_FOOD',
        data.validationError,
      );
    }

    return data;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof MealAnalysisError) {
      throw error;
    }

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new MealAnalysisError('Request timeout', 'NETWORK');
      }
      throw new MealAnalysisError(error.message, 'NETWORK');
    }

    throw new MealAnalysisError('Unknown error', 'NETWORK');
  }
}
