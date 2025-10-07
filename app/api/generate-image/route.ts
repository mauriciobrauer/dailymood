import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase-server";

// Inicializar cliente de OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Función para crear prompt específico para gatitos/perritos
function createPromptFromNote(note: string, moodType: string): string {
  const animal = Math.random() > 0.5 ? "gatito" : "perrito";
  
  // Detectar palabras clave en la nota para contexto
  const keywords = {
    trabajo: ["trabajo", "oficina", "reunión", "jefe", "proyecto", "deadline"],
    cansado: ["cansado", "agotado", "fatiga", "sueño", "dormir"],
    feliz: ["feliz", "alegre", "contento", "genial", "increíble", "fantástico"],
    triste: ["triste", "deprimido", "melancólico", "llorar", "mal"],
    comida: ["comida", "cenar", "almorzar", "desayunar", "cocinar", "restaurante"],
    ejercicio: ["gym", "ejercicio", "correr", "caminar", "deporte"],
    familia: ["familia", "mamá", "papá", "hermano", "hermana", "abuela"],
    amigos: ["amigos", "amiga", "fiesta", "celebración", "reunión"]
  };

  let context = "";
  const noteLower = note.toLowerCase();
  
  for (const [category, words] of Object.entries(keywords)) {
    if (words.some(word => noteLower.includes(word))) {
      switch (category) {
        case "trabajo":
          context = "en una oficina con computadora y papeles";
          break;
        case "cansado":
          context = "dormido o bostezando";
          break;
        case "feliz":
          context = "sonriendo y jugando";
          break;
        case "triste":
          context = "con cara triste pero tierna";
          break;
        case "comida":
          context = "rodeado de comida deliciosa";
          break;
        case "ejercicio":
          context = "haciendo ejercicio o deporte";
          break;
        case "familia":
          context = "con su familia o seres queridos";
          break;
        case "amigos":
          context = "divirtiéndose con amigos";
          break;
      }
      break;
    }
  }

  // Si no se detectó contexto específico, usar el mood
  if (!context) {
    switch (moodType) {
      case "happy":
        context = "muy feliz y juguetón";
        break;
      case "neutral":
        context = "tranquilo y relajado";
        break;
      case "sad":
        context = "un poco triste pero muy tierno";
        break;
    }
  }

  return `Crea una imagen adorable y cómica de un ${animal} ${context}, con ojos grandes y expresivos. 
CONTEXTO ESPECÍFICO: El ${animal} está en una situación que refleje el contenido de la nota de manera creativa y humorística: "${note}"
La imagen debe ser tierna, colorida y estilo ilustración digital. El ${animal} debe verse muy expresivo y adorable.`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { note, moodType } = body;

    if (!note) {
      return NextResponse.json({ error: "Falta la nota del usuario" }, { status: 400 });
    }

    console.log(`🎨 Generando imagen con DALL-E 3 para: "${note.substring(0, 50)}..."`);

    // Crear prompt específico
    const prompt = createPromptFromNote(note, moodType);
    console.log(`📝 Prompt generado: ${prompt.substring(0, 200)}...`);

    // Generar imagen con DALL-E 3
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024", // 1:1 aspect ratio
      quality: "standard",
      response_format: "url"
    });

    const imageUrl = response.data[0]?.url;
    if (!imageUrl) {
      throw new Error("No se pudo generar la imagen con DALL-E 3");
    }

    console.log(`✅ Imagen generada con DALL-E 3: ${imageUrl}`);

    // Descargar la imagen desde OpenAI
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error("No se pudo descargar la imagen generada");
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const buffer = Buffer.from(imageBuffer);

    // Subir a Supabase Storage
    const supabase = createClient();
    const fileName = `mood-${Date.now()}.png`;
    
    const { error: uploadError } = await supabase.storage
      .from('images')
      .upload(fileName, buffer, {
        contentType: 'image/png',
        upsert: true
      });

    if (uploadError) {
      console.error('Error subiendo a Supabase:', uploadError);
      // Si falla la subida, devolver la URL temporal de OpenAI
      return NextResponse.json({
        success: true,
        imageUrl: imageUrl,
        model: "dall-e-3",
        prompt: prompt,
        debug: {
          model: "dall-e-3",
          prompt: prompt,
          uploadError: uploadError.message
        }
      });
    }

    // Obtener URL pública de Supabase
    const { data: publicUrlData } = supabase.storage
      .from('images')
      .getPublicUrl(fileName);

    const finalUrl = publicUrlData.publicUrl;
    console.log(`✅ Imagen subida a Supabase: ${finalUrl}`);

    return NextResponse.json({
      success: true,
      imageUrl: finalUrl,
      model: "dall-e-3",
      prompt: prompt,
      debug: {
        model: "dall-e-3",
        prompt: prompt
      }
    });

  } catch (error) {
    console.error(`❌ Error generando imagen con DALL-E 3:`, error);
    
    return NextResponse.json({
      success: false,
      error: "Error generando imagen con DALL-E 3",
      details: error instanceof Error ? error.message : "Error desconocido",
      debug: {
        model: "dall-e-3",
        error: error instanceof Error ? error.message : "Error desconocido"
      }
    }, { status: 500 });
  }
}