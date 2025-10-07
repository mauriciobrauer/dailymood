-- =====================================================
-- SCRIPT PARA CREAR BUCKET DE IMÁGENES EN SUPABASE
-- =====================================================

-- Crear el bucket 'images' si no existe
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'images',
  'images',
  true,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Crear política RLS para permitir acceso público a las imágenes
CREATE POLICY "Public Access for Images" ON storage.objects
FOR SELECT USING (bucket_id = 'images');

-- Crear política RLS para permitir subida de imágenes
CREATE POLICY "Allow Image Uploads" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'images');

-- Crear política RLS para permitir actualización de imágenes
CREATE POLICY "Allow Image Updates" ON storage.objects
FOR UPDATE USING (bucket_id = 'images');

-- Verificar que el bucket se creó correctamente
SELECT * FROM storage.buckets WHERE id = 'images';
