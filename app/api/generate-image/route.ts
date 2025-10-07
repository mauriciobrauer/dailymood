import { NextRequest, NextResponse } from 'next/server';
import * as genai from '@google/genai';

export async function POST(request: NextRequest) {
  try {
    const { note, moodType } = await request.json();

    if (!note || !moodType) {
      return NextResponse.json(
        { error: 'Note and moodType are required' },
        { status: 400 }
      );
    }

    const apiKey = 'AIzaSyAnJMCH6eYhEEnkNLox-lieemnMi-eXWtU';
    
    // Inicializar el cliente de Google Generative AI
    const genAI = new genai.GoogleGenAI(apiKey);
    
    // Crear prompt basado en la nota del usuario
    const prompt = createPromptFromNote(note, moodType);
    
    // Intentar diferentes modelos de Gemini que puedan generar imágenes
    const models = [
      'gemini-2.5-flash-image-preview',  // Modelo específico para imágenes
      'gemini-2.0-flash-exp',
      'gemini-1.5-flash',
      'gemini-1.5-pro'
    ];
    
    for (const modelName of models) {
      try {
        console.log(`Intentando modelo: ${modelName}`);
        
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        
        // Buscar URLs de imagen en la respuesta
        const text = response.text();
        const imageUrl = extractImageUrl(text);
        
        if (imageUrl) {
          console.log(`Imagen generada exitosamente con modelo: ${modelName}`);
          return NextResponse.json({ 
            success: true, 
            imageUrl,
            model: modelName 
          });
        }
        
        // Si no hay URL directa, buscar datos base64
        const base64Data = extractBase64Data(text);
        if (base64Data) {
          const blobUrl = convertBase64ToBlobUrl(base64Data);
          console.log(`Imagen generada desde base64 con modelo: ${modelName}`);
          return NextResponse.json({ 
            success: true, 
            imageUrl: blobUrl,
            model: modelName 
          });
        }
        
      } catch (modelError) {
        console.log(`Modelo ${modelName} falló:`, modelError);
        continue; // Intentar siguiente modelo
      }
    }
    
    // Si todos los modelos fallan, usar imagen placeholder
    console.log('Todos los modelos fallaron, usando imagen placeholder');
    const placeholderUrl = generatePlaceholderImage();
    
    return NextResponse.json({ 
      success: true, 
      imageUrl: placeholderUrl,
      model: 'placeholder' 
    });

  } catch (error) {
    console.error('Error en API Route generate-image:', error);
    
    // Fallback a imagen placeholder en caso de error
    const placeholderUrl = generatePlaceholderImage();
    
    return NextResponse.json({ 
      success: true, 
      imageUrl: placeholderUrl,
      model: 'placeholder',
      error: 'Fallback to placeholder due to error'
    });
  }
}

function createPromptFromNote(note: string, moodType: string): string {
  const animals = ['gatito', 'perrito'];
  const randomAnimal = animals[Math.floor(Math.random() * animals.length)];
  
  const moodContext = {
    happy: 'alegre y juguetón',
    neutral: 'tranquilo y sereno',
    sad: 'melancólico pero tierno'
  };
  
  const animalMood = moodContext[moodType as keyof typeof moodContext] || 'tierno';
  
  return `Crea una imagen cómica y tierna de un ${randomAnimal} ${animalMood}, inspirada en esta nota del usuario: "${note}"

La imagen debe expresar visualmente el sentimiento general de la nota de forma graciosa o exagerada. Usa un estilo ilustrativo colorido, tipo caricatura digital.

Ejemplos de lo que busco:
- Si la nota habla de productividad: un gato con lentes y laptop rodeado de tazas de café sonriendo
- Si habla de cansancio: un perrito dormido sobre un teclado con ojeras y una taza de café al lado
- Si habla de felicidad: un gatito saltando con confeti alrededor
- Si habla de tristeza: un perrito con paraguas bajo la lluvia pero con una sonrisa tierna

La imagen debe ser divertida, tierna y hacer alusión indirecta al contenido de la nota.`;
}

function extractImageUrl(text: string): string | null {
  // Buscar URLs de imagen en el texto
  const urlRegex = /https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp)/i;
  const match = text.match(urlRegex);
  return match ? match[0] : null;
}

function extractBase64Data(text: string): string | null {
  // Buscar datos base64 en el texto
  const base64Regex = /data:image\/[^;]+;base64,([A-Za-z0-9+/=]+)/;
  const match = text.match(base64Regex);
  return match ? match[1] : null;
}

function convertBase64ToBlobUrl(base64Data: string): string {
  try {
    // Convertir base64 a blob
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/png' });
    
    // Crear URL del blob
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error('Error convirtiendo base64 a blob:', error);
    return generatePlaceholderImage();
  }
}

function generatePlaceholderImage(): string {
  // Generar imagen placeholder usando Lorem Picsum
  const width = 400;
  const height = 300;
  const seed = Math.floor(Math.random() * 1000);
  return `https://picsum.photos/seed/${seed}/${width}/${height}`;
}
