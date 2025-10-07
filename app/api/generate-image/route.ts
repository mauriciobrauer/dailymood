import { NextResponse } from "next/server";

// Función para convertir cualquier nota en un prompt visual semántico universal CON PERRO/GATO
function convertNoteToPrompt(note: string, moodType: string): string {
  console.log(`🎨 Transformando nota semánticamente: "${note}"`);
  
  // Seleccionar animal aleatoriamente
  const animal = Math.random() > 0.5 ? "cute dog" : "cute cat";
  
  // Plantilla base universal que representa la idea de la nota CON EL ANIMAL
  const baseTemplate = `Una escena visual que representa la idea o situación descrita en: "${note}". Incluye un ${animal} como protagonista principal de la escena. Describe la escena de manera imaginativa, incluyendo elementos relevantes y el ambiente general.`;
  
  // Heurísticas ligeras para enriquecer el prompt (complementarias, no limitantes)
  const enhancements = [];
  
  // Detectar comida (heurística ligera)
  const foodKeywords = ["comí", "comer", "comida", "torta", "pan", "cena", "almuerzo", "desayuno", "pizza", "hamburguesa", "sandwich", "postre", "dulce", "helado", "pastel"];
  const hasFood = foodKeywords.some(keyword => note.toLowerCase().includes(keyword));
  if (hasFood) {
    enhancements.push("comida deliciosa", "mesa servida", "ambiente gastronómico");
  }
  
  // Detectar clima (heurística ligera)
  const weatherKeywords = ["llueve", "lluvia", "sol", "soleado", "nublado", "tormenta", "calor", "frío", "atardecer", "amanecer"];
  const hasWeather = weatherKeywords.some(keyword => note.toLowerCase().includes(keyword));
  if (hasWeather) {
    if (note.toLowerCase().includes("lluvia") || note.toLowerCase().includes("llueve")) {
      enhancements.push("día lluvioso", "paraguas", "reflejos en el pavimento");
    } else if (note.toLowerCase().includes("sol") || note.toLowerCase().includes("soleado")) {
      enhancements.push("día soleado", "luz dorada", "ambiente cálido");
    } else if (note.toLowerCase().includes("atardecer")) {
      enhancements.push("atardecer dorado", "cielo naranja", "luz cálida");
    }
  }
  
  // Detectar emociones (heurística ligera)
  const emotionKeywords = ["feliz", "triste", "cansado", "emocionado", "nervioso", "tranquilo", "melancólico"];
  const hasEmotion = emotionKeywords.some(keyword => note.toLowerCase().includes(keyword));
  if (hasEmotion) {
    if (note.toLowerCase().includes("feliz") || note.toLowerCase().includes("alegre")) {
      enhancements.push("ambiente alegre", "colores vibrantes");
    } else if (note.toLowerCase().includes("triste") || note.toLowerCase().includes("melancólico")) {
      enhancements.push("atmósfera melancólica", "tonos suaves");
    } else if (note.toLowerCase().includes("cansado") || note.toLowerCase().includes("agotado")) {
      enhancements.push("ambiente relajado", "luz tenue");
    }
  }
  
  // Detectar actividades (heurística ligera)
  const activityKeywords = ["trabajo", "gym", "ejercicio", "correr", "caminar", "estudiar", "leer", "soñé", "sueño"];
  const hasActivity = activityKeywords.some(keyword => note.toLowerCase().includes(keyword));
  if (hasActivity) {
    if (note.toLowerCase().includes("gym") || note.toLowerCase().includes("ejercicio")) {
      enhancements.push("ambiente deportivo", "energía activa");
    } else if (note.toLowerCase().includes("trabajo") || note.toLowerCase().includes("oficina")) {
      enhancements.push("ambiente profesional", "luz de oficina");
    } else if (note.toLowerCase().includes("soñé") || note.toLowerCase().includes("sueño")) {
      enhancements.push("atmósfera onírica", "elementos surrealistas");
    }
  }
  
  // Detectar lugares (heurística ligera)
  const placeKeywords = ["casa", "bosque", "playa", "montaña", "ciudad", "parque", "restaurante"];
  const hasPlace = placeKeywords.some(keyword => note.toLowerCase().includes(keyword));
  if (hasPlace) {
    if (note.toLowerCase().includes("bosque")) {
      enhancements.push("vegetación densa", "luz filtrada", "atmósfera natural");
    } else if (note.toLowerCase().includes("casa")) {
      enhancements.push("ambiente hogareño", "luz cálida interior");
    } else if (note.toLowerCase().includes("playa")) {
      enhancements.push("arena dorada", "mar azul", "brisa marina");
    }
  }
  
  // Construir el prompt final
  let finalPrompt = baseTemplate;
  
  if (enhancements.length > 0) {
    finalPrompt += ` Incluye: ${enhancements.join(", ")}.`;
  }
  
  // Añadir estilo visual consistente
  finalPrompt += " Estilo realista, iluminación cinematográfica, alta calidad, detallado, no caricatura, no anime.";
  
  console.log(`📝 Prompt semántico generado: ${finalPrompt}`);
  
  return finalPrompt;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { note, moodType } = body;

    if (!note) {
      return NextResponse.json({ error: "Falta la nota del usuario" }, { status: 400 });
    }

    console.log(`🎨 Generando imagen con Pollinations.AI para: "${note.substring(0, 50)}..."`);

    // Crear prompt semántico universal
    const prompt = convertNoteToPrompt(note, moodType);
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
