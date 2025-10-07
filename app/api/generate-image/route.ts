import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

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
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Crear prompt basado en la nota del usuario
    const prompt = createPromptFromNote(note, moodType);
    
    console.log(`🎨 Generando imagen para: "${prompt.substring(0, 50)}..."`);
    
    // Intentar diferentes modelos de Gemini que puedan generar imágenes
    const models = [
      'gemini-2.5-flash-image-preview',  // Modelo específico para imágenes
      'gemini-2.0-flash-exp',
      'gemini-1.5-flash',
      'gemini-1.5-pro'
    ];
    
    for (const modelName of models) {
      try {
        console.log(`🎨 Intentando modelo: ${modelName}`);
        console.log(`📝 Prompt generado: ${prompt.substring(0, 200)}...`);
        
        // Configuración para generación de imágenes
        const config = {
          responseMimeType: 'image/jpeg',
          imageGenerationConfig: {
            numberOfImages: 1,
            aspectRatio: '1:1',
          }
        };
        
        // Crear modelo específico con configuración de imagen
        const model = genAI.getGenerativeModel({ 
          model: modelName,
          generationConfig: config
        });
        
        // Usar la API correcta de @google/generative-ai para generar imágenes
        const result = await model.generateContent(prompt);
        
        console.log(`✅ Respuesta del modelo ${modelName}:`, JSON.stringify(result, null, 2));
        
        // Procesar la Respuesta Multimodal
        const imagePart = result.response.candidates?.[0]?.content?.parts?.find(
          (part: any) => part.inlineData && part.inlineData.mimeType.startsWith('image/')
        );

        if (imagePart && imagePart.inlineData) {
          const imageBase64 = imagePart.inlineData.data;
          const mimeType = imagePart.inlineData.mimeType || 'image/jpeg';
          
          // Convertir base64 a blob URL
          const blobUrl = convertBase64ToBlobUrl(imageBase64);
          
          console.log(`🎉 Imagen generada exitosamente con modelo: ${modelName}`);
          console.log(`🔗 Tipo MIME: ${mimeType}`);
          
          return NextResponse.json({ 
            success: true, 
            imageUrl: blobUrl,
            model: modelName,
            prompt: prompt,
            debug: {
              model: modelName,
              prompt: prompt,
              mimeType: mimeType,
              response: result
            }
          });
        }
        
        // Si no hay imagen en la respuesta, buscar en el texto
        const text = result.response.text() || '';
        const imageUrl = extractImageUrl(text);
        
        if (imageUrl) {
          console.log(`🎉 Imagen encontrada en texto con modelo: ${modelName}`);
          console.log(`🔗 URL de imagen: ${imageUrl}`);
          return NextResponse.json({ 
            success: true, 
            imageUrl,
            model: modelName,
            prompt: prompt,
            debug: {
              model: modelName,
              prompt: prompt,
              response: result
            }
          });
        }
        
        // Si no hay URL directa, buscar datos base64 en el texto
        const base64Data = extractBase64Data(text);
        if (base64Data) {
          const blobUrl = convertBase64ToBlobUrl(base64Data);
          console.log(`🎉 Imagen generada desde base64 con modelo: ${modelName}`);
          return NextResponse.json({ 
            success: true, 
            imageUrl: blobUrl,
            model: modelName,
            prompt: prompt,
            debug: {
              model: modelName,
              prompt: prompt,
              response: result
            }
          });
        }
        
      } catch (modelError) {
        console.log(`❌ Modelo ${modelName} falló:`, modelError);
        continue; // Intentar siguiente modelo
      }
    }
    
    // Si todos los modelos fallan, usar imagen placeholder
    console.log('Todos los modelos fallaron, usando imagen placeholder');
    const placeholderUrl = generatePlaceholderImage();
    
    return NextResponse.json({ 
      success: true, 
      imageUrl: placeholderUrl,
      model: 'placeholder',
      prompt: prompt,
      debug: {
        model: 'placeholder',
        prompt: prompt,
        response: 'All models failed'
      }
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
    happy: 'muy feliz y juguetón, con una gran sonrisa',
    neutral: 'tranquilo y sereno, con una expresión calmada',
    sad: 'un poco triste pero muy tierno, con ojos grandes y expresivos'
  };
  
  const animalMood = moodContext[moodType as keyof typeof moodContext] || 'tierno';
  
  // Crear contexto específico basado en palabras clave de la nota
  let specificContext = '';
  const noteLower = note.toLowerCase();
  
  if (noteLower.includes('trabajo') || noteLower.includes('oficina') || noteLower.includes('productivo')) {
    specificContext = `El ${randomAnimal} está en una oficina o con elementos de trabajo como computadora, papeles, o tazas de café.`;
  } else if (noteLower.includes('cansado') || noteLower.includes('sueño') || noteLower.includes('dormir')) {
    specificContext = `El ${randomAnimal} está bostezando, con ojeras, o durmiendo en una posición cómica.`;
  } else if (noteLower.includes('comida') || noteLower.includes('cena') || noteLower.includes('almuerzo')) {
    specificContext = `El ${randomAnimal} está comiendo o rodeado de comida, con expresión muy satisfecha.`;
  } else if (noteLower.includes('ejercicio') || noteLower.includes('gym') || noteLower.includes('correr')) {
    specificContext = `El ${randomAnimal} está haciendo ejercicio, corriendo, o con ropa deportiva.`;
  } else if (noteLower.includes('lluvia') || noteLower.includes('mal tiempo')) {
    specificContext = `El ${randomAnimal} está bajo la lluvia con paraguas o refugiándose, pero manteniendo su ternura.`;
  } else if (noteLower.includes('amigos') || noteLower.includes('familia') || noteLower.includes('personas')) {
    specificContext = `El ${randomAnimal} está rodeado de otros animalitos o en una situación social divertida.`;
  } else {
    specificContext = `El ${randomAnimal} está en una situación que refleje el contenido de la nota de manera creativa y divertida.`;
  }
  
  return `Crea una imagen adorable y cómica de un ${randomAnimal} ${animalMood}. 

CONTEXTO ESPECÍFICO: ${specificContext}

NOTA DEL USUARIO: "${note}"

REQUISITOS DE LA IMAGEN:
- Estilo: Ilustración digital colorida, tipo caricatura tierna
- Expresión: El animal debe tener una expresión que refleje el estado de ánimo (${moodType})
- Composición: La imagen debe ser divertida y hacer alusión al contenido de la nota
- Calidad: Alta resolución, colores vibrantes, muy tierno y adorable
- Elementos: Incluir detalles que conecten con la nota del usuario

La imagen debe ser tan tierna que haga sonreír a cualquiera que la vea, pero también debe ser graciosa y relacionada con la nota del usuario.`;
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
    const blob = new Blob([byteArray], { type: 'image/jpeg' });
    
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