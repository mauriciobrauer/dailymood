/**
 * Servicio para generar imágenes de gatitos y perritos basadas en notas del usuario
 * Utiliza Google Gemini 2.5 Flash Image a través de API Route de Next.js
 */

interface ImageGenerationResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

interface ImageGenerationOptions {
  note: string;
  moodType: 'happy' | 'neutral' | 'sad';
}

/**
 * Genera una imagen de gatito o perrito basada en la nota del usuario
 * Utiliza Google Gemini 2.5 para generación de imágenes con IA
 */
export async function generateMoodImage(options: ImageGenerationOptions): Promise<ImageGenerationResult> {
  const { note, moodType } = options;
  
  try {
    console.log('Generando imagen para nota:', note);
    
    // Llamar a la API Route de Next.js
    const response = await fetch('/api/generate-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        note,
        moodType
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Route error response:', errorText);
      throw new Error(`API Route error: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    const result = await response.json();
    console.log('API Route result:', result);
    
    if (result.success && result.imageUrl) {
      return {
        success: true,
        imageUrl: result.imageUrl
      };
    } else {
      console.error('API Route returned unsuccessful result:', result);
      throw new Error(`API Route returned unsuccessful result: ${result.error || 'Unknown error'}`);
    }
    
  } catch (error) {
    console.error('Error generando imagen:', error);
    
    // Fallback a imagen placeholder
    const placeholderUrl = generatePlaceholderImage();
    
    return {
      success: true,
      imageUrl: placeholderUrl,
      error: 'Fallback to placeholder due to error'
    };
  }
}

/**
 * Genera una imagen placeholder usando Lorem Picsum
 */
function generatePlaceholderImage(): string {
  const width = 400;
  const height = 300;
  const seed = Math.floor(Math.random() * 1000);
  return `https://picsum.photos/seed/${seed}/${width}/${height}`;
}

/**
 * Imagen por defecto para mostrar cuando no se puede generar una imagen
 */
export const DEFAULT_MOOD_IMAGE = 'https://picsum.photos/400/300?random=1';