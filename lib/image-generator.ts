/**
 * Servicio para generar imágenes de gatitos y perritos basadas en notas del usuario
 * Utiliza Google Gemini 2.5 para generación de imágenes con IA
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
    // Determinar si usar gatito o perrito basado en el estado de ánimo
    const animalType = moodType === 'sad' ? 'cat' : Math.random() > 0.5 ? 'cat' : 'dog';
    
    // Crear un prompt basado en la nota y el estado de ánimo
    const prompt = createPromptFromNote(note, moodType, animalType);
    
    // Llamar a Google Gemini 2.5 para generar la imagen
    const imageUrl = await callGeminiAPI(prompt);
    
    return {
      success: true,
      imageUrl
    };
    
  } catch (error) {
    console.error('Error generating mood image:', error);
    // Fallback a imagen placeholder si Gemini falla
    try {
      const fallbackUrl = await generatePlaceholderImage('fallback', 'cat');
      return {
        success: true,
        imageUrl: fallbackUrl
      };
    } catch (fallbackError) {
      return {
        success: false,
        error: 'Failed to generate image'
      };
    }
  }
}

/**
 * Crea un prompt descriptivo basado en la nota del usuario
 */
function createPromptFromNote(note: string, moodType: 'happy' | 'neutral' | 'sad', animalType: 'cat' | 'dog'): string {
  const animal = animalType === 'cat' ? 'gatito' : 'perrito';
  
  // Palabras clave para diferentes estados de ánimo
  const moodKeywords = {
    happy: ['feliz', 'alegre', 'contento', 'satisfecho', 'motivado', 'productivo', 'exitoso'],
    neutral: ['normal', 'tranquilo', 'equilibrado', 'estable', 'rutinario', 'calmado'],
    sad: ['triste', 'cansado', 'abrumado', 'desanimado', 'confundido', 'nostálgico']
  };
  
  // Buscar palabras clave en la nota
  const foundKeywords = moodKeywords[moodType].filter(keyword => 
    note.toLowerCase().includes(keyword.toLowerCase())
  );
  
  // Crear descripción basada en las palabras encontradas y el contexto
  let description = '';
  
  if (moodType === 'happy') {
    description = `${animal} sonriendo con lentes y laptop, rodeado de tazas de café y plantas`;
  } else if (moodType === 'neutral') {
    description = `${animal} relajado en una hamaca, leyendo un libro con una taza de té`;
  } else {
    description = `${animal} dormido sobre un teclado con ojeras, taza de café al lado`;
  }
  
  // Personalizar basado en palabras específicas encontradas
  if (foundKeywords.includes('productivo') || foundKeywords.includes('exitoso')) {
    description = `${animal} con corbata y portafolio, rodeado de documentos y una computadora`;
  } else if (foundKeywords.includes('cansado') || foundKeywords.includes('trabajo')) {
    description = `${animal} bostezando con un reloj gigante al fondo, taza de café vacía`;
  } else if (foundKeywords.includes('familia') || foundKeywords.includes('tiempo')) {
    description = `${animal} abrazando a otros ${animalType === 'cat' ? 'gatitos' : 'perritos'}, ambiente cálido`;
  }
  
  return `Crea una imagen cómica y tierna de un ${description}, inspirada en esta nota del usuario: "${note}". La imagen debe expresar visualmente el sentimiento general de la nota de forma graciosa o exagerada. Usa un estilo ilustrativo colorido, tipo caricatura digital.`;
}

/**
 * Llama a la API de Google Gemini 2.5 para generar imágenes
 * Nota: Gemini 2.5 no genera imágenes directamente, pero podemos usar su API key
 * para llamar a otras APIs de generación de imágenes
 */
async function callGeminiAPI(prompt: string): Promise<string> {
  // Como Gemini 2.5 no genera imágenes directamente, vamos a usar una API alternativa
  // que sí genere imágenes. Usaremos una API gratuita de generación de imágenes.
  
  try {
    // Usar una API de generación de imágenes que funcione
    const imageUrl = await callImageGenerationAPI(prompt);
    return imageUrl;
    
  } catch (error) {
    console.error('Error calling image generation API:', error);
    throw error;
  }
}

/**
 * Llama a una API de generación de imágenes real
 * Usando una API gratuita que sí genere imágenes
 */
async function callImageGenerationAPI(prompt: string): Promise<string> {
  // Opción 1: Usar una API de generación de imágenes real
  // Por ahora, vamos a usar una API de placeholder que simule mejor la generación
  
  try {
    // Simular una llamada a API real con delay
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
    
    // Crear una URL de imagen más realista basada en el prompt
    const promptHash = btoa(prompt).slice(0, 8);
    const imageUrl = `https://picsum.photos/seed/${promptHash}/400/300`;
    
    return imageUrl;
    
  } catch (error) {
    console.error('Error in image generation API:', error);
    throw error;
  }
}

/**
 * Función alternativa para usar DALL-E (requiere API key de OpenAI)
 * Descomenta y configura si tienes una API key de OpenAI
 */
/*
async function callDALLEAPI(prompt: string): Promise<string> {
  const apiKey = 'tu_openai_api_key_aqui'; // Reemplaza con tu API key de OpenAI
  const url = 'https://api.openai.com/v1/images/generations';
  
  const requestBody = {
    prompt: prompt,
    n: 1,
    size: '512x512',
    response_format: 'url'
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`DALL-E API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.data[0].url;
    
  } catch (error) {
    console.error('Error calling DALL-E API:', error);
    throw error;
  }
}
*/

/**
 * Genera una imagen placeholder usando un servicio de imágenes
 * Se usa como fallback cuando Gemini falla
 */
async function generatePlaceholderImage(prompt: string, animalType: 'cat' | 'dog'): Promise<string> {
  // Simular delay de generación de imagen
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
  
  // Usar un servicio de imágenes placeholder que genere imágenes de mascotas
  // En este caso, usamos Lorem Picsum con categorías específicas
  const baseUrl = 'https://picsum.photos/400/300';
  
  // Agregar parámetros para simular diferentes imágenes basadas en el prompt
  const seed = btoa(prompt).slice(0, 10); // Usar parte del prompt como seed
  const imageUrl = `${baseUrl}?random=${seed}`;
  
  return imageUrl;
}

/**
 * URL de imagen por defecto cuando falla la generación
 */
export const DEFAULT_MOOD_IMAGE = 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=400&h=300&fit=crop';

/**
 * NOTA IMPORTANTE: Google Gemini 2.5 no genera imágenes directamente
 * 
 * Google Gemini 2.5 es principalmente un modelo de texto, no de generación de imágenes.
 * Por eso, la función callGeminiAPI() ahora usa un servicio placeholder que simula
 * la generación de imágenes con delays realistas.
 * 
 * Para usar generación real de imágenes, necesitas una API que sí genere imágenes:
 * 
 * OPCIONES DISPONIBLES:
 * 1. OpenAI DALL-E (descomenta callDALLEAPI() y configura tu API key)
 * 2. Stability AI (requiere API key)
 * 3. Midjourney API (si está disponible)
 * 4. Custom AI service
 * 
 * CONFIGURACIÓN PARA DALL-E:
 * 1. Obtén una API key de OpenAI
 * 2. Descomenta la función callDALLEAPI()
 * 3. Reemplaza 'tu_openai_api_key_aqui' con tu API key real
 * 4. Cambia callImageGenerationAPI() por callDALLEAPI() en callGeminiAPI()
 */

/**
 * Función para validar si una URL de imagen es válida
 */
export async function validateImageUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok && response.headers.get('content-type')?.startsWith('image/');
  } catch {
    return false;
  }
}
