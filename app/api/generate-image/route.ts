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
    comida: ["comida", "cenar", "almorzar", "desayunar", "cocinar", "restaurante", "cena", "pan", "comí", "comer", "hambre", "hambriento", "desayuno", "almuerzo", "cena", "snack", "merienda"],
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
          context = "wearing a tiny business suit and sitting at a computer desk with coffee, looking stressed but determined";
          break;
        case "cansado":
          context = "sleeping peacefully with droopy eyes and a cute yawn, looking exhausted but adorable";
          break;
        case "feliz":
          context = "jumping with joy and a huge smile, playing with colorful toys, looking absolutely delighted";
          break;
        case "triste":
          context = "looking melancholic with big sad eyes, maybe holding a tissue, but still incredibly cute";
          break;
        case "comida":
          context = "eating bread or food, with crumbs around mouth, looking satisfied and happy, sitting at a table with food";
          break;
        case "ejercicio":
          context = "wearing tiny workout clothes, lifting weights or running, looking determined and sweaty but cute";
          break;
        case "familia":
          context = "surrounded by other cute animals representing family, looking happy and loved";
          break;
        case "amigos":
          context = "playing and laughing with other cute animals, having a great time together";
          break;
        case "lluvia":
          context = "holding a tiny umbrella, splashing in puddles, looking playful despite the rain";
          break;
        case "sol":
          context = "wearing sunglasses and relaxing at the beach, looking happy and sun-kissed";
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
        context = "jumping with joy and a huge smile, looking absolutely delighted and energetic";
        break;
      case "neutral":
        context = "sitting calmly with a peaceful expression, looking content and relaxed";
        break;
      case "sad":
        context = "looking melancholic with big sad eyes, maybe holding a tissue, but still incredibly cute and lovable";
        break;
    }
  }

  // Pollinations.AI funciona mejor con prompts en inglés y más directos
  // Hacer más realista y menos caricaturesco
  return `${animal}, ${context}, realistic photography style, natural expression, real fur texture, authentic look, humorous but believable, high quality, detailed, soft natural lighting, not cartoon, not anime, not illustration`;
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
