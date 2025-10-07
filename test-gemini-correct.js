const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGeminiImageGeneration() {
  try {
    console.log('🧪 Probando generación de imágenes con @google/generative-ai...');
    
    const apiKey = 'AIzaSyAnJMCH6eYhEEnkNLox-lieemnMi-eXWtU';
    const genAI = new GoogleGenerativeAI(apiKey);
    
    const prompt = 'Crea una imagen adorable y cómica de un gatito muy feliz y juguetón, con una gran sonrisa. El gatito está en una oficina o con elementos de trabajo como computadora, papeles, o tazas de café.';
    
    console.log('📝 Prompt:', prompt.substring(0, 100) + '...');
    console.log('🎨 Intentando generar imagen...');
    
    // Crear modelo específico
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash-image-preview'
    });
    
    const result = await model.generateContent(prompt);
    
    console.log('✅ Resultado:', JSON.stringify(result, null, 2));
    
    // Procesar la Respuesta Multimodal
    const imagePart = result.response.candidates?.[0]?.content?.parts?.find(
      (part) => part.inlineData && part.inlineData.mimeType.startsWith('image/')
    );

    if (imagePart && imagePart.inlineData) {
      const imageBase64 = imagePart.inlineData.data;
      const mimeType = imagePart.inlineData.mimeType || 'image/jpeg';
      
      console.log('🎉 ¡Imagen generada exitosamente!');
      console.log('🔗 Tipo MIME:', mimeType);
      console.log('📏 Tamaño base64:', imageBase64.length, 'caracteres');
      
      // Guardar imagen para verificar
      const fs = require('fs');
      const buffer = Buffer.from(imageBase64, 'base64');
      fs.writeFileSync('test-gemini-image.jpg', buffer);
      console.log('💾 Imagen guardada como test-gemini-image.jpg');
      
    } else {
      console.log('❌ No se encontró imagen en la respuesta');
      console.log('📄 Texto de respuesta:', result.response.text());
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testGeminiImageGeneration();
