-- =====================================================
-- SCRIPT PARA ELIMINAR CAMPOS DE IMAGEN DE MOOD_ENTRIES
-- =====================================================

-- Eliminar columnas relacionadas con imágenes si existen
ALTER TABLE mood_entries 
DROP COLUMN IF EXISTS mood_image_url;

ALTER TABLE mood_entries 
DROP COLUMN IF EXISTS mood_image_model;

ALTER TABLE mood_entries 
DROP COLUMN IF EXISTS mood_image_prompt;

-- Verificar que las columnas se eliminaron correctamente
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'mood_entries' 
AND column_name IN ('mood_image_url', 'mood_image_model', 'mood_image_prompt')
ORDER BY column_name;

-- Mostrar la estructura final de la tabla
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'mood_entries' 
ORDER BY ordinal_position;
