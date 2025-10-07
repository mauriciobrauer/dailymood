-- =====================================================
-- SCRIPT PARA AGREGAR CAMPO DE IMAGEN A MOOD_ENTRIES
-- =====================================================

-- Agregar columna para URL de imagen generada
ALTER TABLE mood_entries 
ADD COLUMN IF NOT EXISTS mood_image_url TEXT;

-- Agregar comentario descriptivo
COMMENT ON COLUMN mood_entries.mood_image_url IS 'URL de imagen generada por IA basada en la nota del usuario';

-- Crear índice para búsquedas por imagen (opcional)
CREATE INDEX IF NOT EXISTS idx_mood_entries_image_url ON mood_entries(mood_image_url) WHERE mood_image_url IS NOT NULL;

-- Verificar que la columna se agregó correctamente
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'mood_entries' 
AND column_name = 'mood_image_url';

-- =====================================================
-- INSTRUCCIONES:
-- 1. Ejecuta este script en el SQL Editor de Supabase
-- 2. La columna mood_image_url se agregará a la tabla
-- 3. Los registros existentes tendrán NULL en este campo
-- 4. Las nuevas entradas podrán incluir URLs de imágenes
-- =====================================================
