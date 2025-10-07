import { NextResponse } from "next/server";

// Función para crear prompt específico para gatitos/perritos con Pollinations.AI
function createPollinationsPrompt(note: string, moodType: string): string {
  const animal = Math.random() > 0.5 ? "cute cat" : "cute dog";
  
  // Detectar palabras clave en la nota para contexto
  const keywords = {
    trabajo: ["trabajo", "oficina", "reunión", "jefe", "proyecto", "deadline", "laboral"],
    cansado: ["cansado", "agotado", "fatiga", "sueño", "dormir", "agotado"],
    feliz: ["feliz", "alegre", "contento", "genial", "increíble", "fantástico", "maravilloso"],
    triste: ["triste", "deprimido", "melancólico", "llorar", "mal", "deprimido"],
    comida: ["comida", "cenar", "almorzar", "desayunar", "cocinar", "restaurante", "cena"],
    ejercicio: ["gym", "ejercicio", "correr", "caminar", "deporte", "entrenar"],
    familia: ["familia", "mamá", "papá", "hermano", "hermana", "abuela", "padres"],
    amigos: ["amigos", "amiga", "fiesta", "celebración", "reunión", "compañeros"],
    lluvia: ["llueve", "lluvia", "lluvioso", "tormenta", "llover", "mojado", "paraguas"],
    sol: ["sol", "soleado", "calor", "playa", "verano", "soleado", "caliente"]
  };

  let context = "";
  const noteLower = note.toLowerCase();
  
  // Debug: mostrar qué palabras se están buscando
  console.log(`🔍 Buscando palabras clave en: "${noteLower}"`);
  
  for (const [category, words] of Object.entries(keywords)) {
    const foundWords = words.filter(word => noteLower.includes(word));
    if (foundWords.length > 0) {
      console.log(`✅ Categoría detectada: ${category} - Palabras encontradas: ${foundWords.join(', ')}`);
      
      switch (category) {
        case "trabajo":
          context = "wearing a tie and sitting at a computer desk with coffee";
          break;
        case "cansado":
          context = "sleeping or yawning with tired eyes";
          break;
        case "feliz":
          context = "smiling and playing with toys";
          break;
        case "triste":
          context = "looking sad but still adorable with big eyes";
          break;
        case "comida":
          context = "surrounded by delicious food";
          break;
        case "ejercicio":
          context = "doing exercise or sports";
          break;
        case "familia":
          context = "with family members or loved ones";
          break;
        case "amigos":
          context = "having fun with friends";
          break;
        case "lluvia":
          context = "playing in the rain with an umbrella";
          break;
        case "sol":
          context = "enjoying sunny weather at the beach";
          break;
      }
      break;
    }
  }
  
  if (!context) {
    console.log(`❌ No se detectó contexto específico, usando mood por defecto`);
  }

  // Si no se detectó contexto específico, usar el mood
  if (!context) {
    switch (moodType) {
      case "happy":
        context = "very happy and playful with a big smile";
        break;
      case "neutral":
        context = "calm and relaxed";
        break;
      case "sad":
        context = "a little sad but very cute with big expressive eyes";
        break;
    }
  }

  // Pollinations.AI funciona mejor con prompts en inglés y más directos
  return `${animal}, ${context}, cartoon style, colorful, adorable, funny, expressive, high quality, digital art`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { note, moodType } = body;

    if (!note) {
      return NextResponse.json({ error: "Falta la nota del usuario" }, { status: 400 });
    }

    console.log(`🎨 Generando imagen con Pollinations.AI para: "${note.substring(0, 50)}..."`);

    // Crear prompt específico
    const prompt = createPollinationsPrompt(note, moodType);
    console.log(`📝 Prompt generado: ${prompt}`);

    // Pollinations.AI URL - API gratuita sin necesidad de API key
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=512&height=512&seed=${Math.floor(Math.random() * 10000)}`;
    
    console.log(`✅ URL de Pollinations.AI generada: ${pollinationsUrl}`);

    return NextResponse.json({
      success: true,
      imageUrl: pollinationsUrl,
      model: "pollinations-ai",
      prompt: prompt,
      debug: {
        model: "pollinations-ai",
        prompt: prompt,
        note: note,
        moodType: moodType
      }
    });

  } catch (error) {
    console.error(`❌ Error generando imagen con Pollinations.AI:`, error);
    
    return NextResponse.json({
      success: false,
      error: "Error generando imagen con Pollinations.AI",
      details: error instanceof Error ? error.message : "Error desconocido",
      debug: {
        model: "pollinations-ai",
        error: error instanceof Error ? error.message : "Error desconocido"
      }
    }, { status: 500 });
  }
}
