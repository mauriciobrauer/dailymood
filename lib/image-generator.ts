/**
 * Servicio para generar imágenes de gatitos y perritos basadas en notas del usuario
 * Nota: Google NanoBanana no es una API real, por lo que usamos una implementación alternativa
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
 * Esta es una implementación simulada que retorna imágenes de placeholder
 * En un entorno real, se conectaría a una API de IA como DALL-E, Midjourney, etc.
 */
export async function generateMoodImage(options: ImageGenerationOptions): Promise<ImageGenerationResult> {
  const { note, moodType } = options;
  
  try {
    // Determinar si usar gatito o perrito basado en el estado de ánimo
    const animalType = moodType === 'sad' ? 'cat' : Math.random() > 0.5 ? 'cat' : 'dog';
    
    // Crear un prompt basado en la nota y el estado de ánimo
    const prompt = createPromptFromNote(note, moodType, animalType);
    
    // En un entorno real, aquí harías la llamada a la API de IA:
    // const response = await callAIAPI(prompt);
    
    // Por ahora, usamos un servicio de imágenes placeholder que simula la generación
    const imageUrl = await generatePlaceholderImage(prompt, animalType);
    
    return {
      success: true,
      imageUrl
    };
    
  } catch (error) {
    console.error('Error generating mood image:', error);
    return {
      success: false,
      error: 'Failed to generate image'
    };
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
 * Genera una imagen placeholder usando un servicio de imágenes
 * En un entorno real, esto sería reemplazado por la llamada a la API de IA
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
 * Función alternativa usando una API real de imágenes de mascotas
 * Descomenta y configura si tienes acceso a una API como:
 * - OpenAI DALL-E
 * - Stability AI
 * - Midjourney API
 * - Custom AI service
 */
/*
async function callRealAIAPI(prompt: string): Promise<string> {
  // Ejemplo con OpenAI DALL-E (requiere API key)
  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt: prompt,
      n: 1,
      size: '512x512',
      response_format: 'url'
    })
  });
  
  const data = await response.json();
  return data.data[0].url;
}
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
