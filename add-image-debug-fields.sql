-- =====================================================
-- SCRIPT PARA AGREGAR CAMPOS DE DEBUG DE IMAGEN
-- =====================================================

-- Agregar columnas para información de debug de la imagen generada
ALTER TABLE mood_entries 
ADD COLUMN IF NOT EXISTS mood_image_model TEXT;

ALTER TABLE mood_entries 
ADD COLUMN IF NOT EXISTS mood_image_prompt TEXT;

-- Agregar comentarios descriptivos
COMMENT ON COLUMN mood_entries.mood_image_model IS 'Modelo de IA usado para generar la imagen (ej: gemini-2.5-flash-image-preview)';
COMMENT ON COLUMN mood_entries.mood_image_prompt IS 'Prompt completo usado para generar la imagen';

-- Crear índices para búsquedas por modelo (opcional)
CREATE INDEX IF NOT EXISTS idx_mood_entries_image_model ON mood_entries(mood_image_model) WHERE mood_image_model IS NOT NULL;

-- Verificar que las columnas se agregaron correctamente
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'mood_entries' 
AND column_name IN ('mood_image_model', 'mood_image_prompt')
ORDER BY column_name;
