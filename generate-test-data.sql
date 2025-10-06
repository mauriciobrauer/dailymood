-- =====================================================
-- SCRIPT PARA GENERAR DATOS DE PRUEBA
-- Genera 30 puntos aleatorios de estados de ánimo para un usuario
-- =====================================================

-- Función para generar notas aleatorias según el estado de ánimo
CREATE OR REPLACE FUNCTION generate_mood_note(mood_type TEXT)
RETURNS TEXT AS $$
BEGIN
    CASE mood_type
        WHEN 'happy' THEN
            RETURN (ARRAY[
                '¡Qué día tan increíble! Me siento muy motivado.',
                'Hoy logré completar todos mis objetivos. ¡Genial!',
                'Tuve una reunión muy productiva con mi equipo.',
                'El clima está perfecto y mi ánimo también.',
                'Recibí buenas noticias que me alegraron mucho.',
                'Pasé tiempo de calidad con mi familia.',
                'Terminé un proyecto importante. ¡Qué satisfacción!',
                'Hoy me sentí muy creativo y productivo.',
                'Tuve una conversación muy inspiradora.',
                'Me siento agradecido por todo lo que tengo.'
            ])[floor(random() * 10) + 1];
        
        WHEN 'neutral' THEN
            RETURN (ARRAY[
                'Un día normal, sin altibajos emocionales.',
                'Nada especial que reportar hoy.',
                'Día tranquilo y relajado.',
                'Me siento equilibrado y centrado.',
                'Un día más en la rutina habitual.',
                'Sin emociones extremas, todo en calma.',
                'Día productivo pero sin sobresaltos.',
                'Me siento estable emocionalmente.',
                'Un día promedio, ni muy bueno ni muy malo.',
                'Estado de ánimo neutral y relajado.'
            ])[floor(random() * 10) + 1];
        
        WHEN 'sad' THEN
            RETURN (ARRAY[
                'Hoy me siento un poco desanimado.',
                'Tuve algunos contratiempos en el trabajo.',
                'Me siento cansado y sin mucha energía.',
                'El día no salió como esperaba.',
                'Estoy pasando por un momento difícil.',
                'Me siento un poco abrumado por las responsabilidades.',
                'Hoy fue un día complicado emocionalmente.',
                'Me siento nostálgico y melancólico.',
                'Tuve una discusión que me afectó.',
                'Me siento un poco perdido y confundido.'
            ])[floor(random() * 10) + 1];
        
        ELSE
            RETURN NULL;
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Script principal para generar datos de prueba
DO $$
DECLARE
    target_user_id UUID;
    mood_types TEXT[] := ARRAY['happy', 'neutral', 'sad'];
    current_date DATE;
    random_mood TEXT;
    random_hour INT;
    random_minute INT;
    mood_timestamp TIMESTAMP;
    mood_note TEXT;
    i INT;
BEGIN
    -- Seleccionar el primer usuario (Ana García) para los datos de prueba
    -- Puedes cambiar esto por el usuario que prefieras
    SELECT id INTO target_user_id 
    FROM users 
    WHERE username = 'ana_garcia' 
    LIMIT 1;
    
    -- Si no existe el usuario, crear uno de prueba
    IF target_user_id IS NULL THEN
        INSERT INTO users (username, display_name, emoji)
        VALUES ('ana_garcia', 'Ana García', '👩')
        RETURNING id INTO target_user_id;
    END IF;
    
    RAISE NOTICE 'Generando datos de prueba para usuario ID: %', target_user_id;
    
    -- Generar 30 entradas aleatorias en los últimos 30 días
    FOR i IN 1..30 LOOP
        -- Fecha aleatoria en los últimos 30 días
        current_date := CURRENT_DATE - (random() * 30)::INT;
        
        -- Hora aleatoria entre 6:00 y 22:00
        random_hour := 6 + (random() * 16)::INT;
        random_minute := (random() * 60)::INT;
        
        -- Crear timestamp
        mood_timestamp := current_date + (random_hour || ':' || random_minute || ':00')::TIME;
        
        -- Estado de ánimo aleatorio
        random_mood := mood_types[floor(random() * 3) + 1];
        
        -- Generar nota según el estado de ánimo
        mood_note := generate_mood_note(random_mood);
        
        -- Insertar el registro
        INSERT INTO mood_entries (
            user_id,
            mood_type,
            note,
            entry_date,
            mood_timestamp,
            created_at,
            updated_at
        ) VALUES (
            target_user_id,
            random_mood,
            mood_note,
            current_date,
            mood_timestamp,
            mood_timestamp,
            mood_timestamp
        ) ON CONFLICT (user_id, mood_timestamp) DO NOTHING;
        
        RAISE NOTICE 'Insertado: % - % - %', current_date, random_mood, LEFT(mood_note, 30);
    END LOOP;
    
    RAISE NOTICE '¡Datos de prueba generados exitosamente!';
    RAISE NOTICE 'Usuario: Ana García';
    RAISE NOTICE 'Total de entradas generadas: 30';
    RAISE NOTICE 'Rango de fechas: últimos 30 días';
END $$;

-- Verificar los datos generados
SELECT 
    u.display_name as usuario,
    COUNT(*) as total_entradas,
    COUNT(CASE WHEN me.mood_type = 'happy' THEN 1 END) as feliz,
    COUNT(CASE WHEN me.mood_type = 'neutral' THEN 1 END) as neutral,
    COUNT(CASE WHEN me.mood_type = 'sad' THEN 1 END) as triste,
    MIN(me.mood_timestamp) as fecha_mas_antigua,
    MAX(me.mood_timestamp) as fecha_mas_reciente
FROM mood_entries me
JOIN users u ON me.user_id = u.id
WHERE u.username = 'ana_garcia'
GROUP BY u.display_name;

-- Mostrar algunas entradas de ejemplo
SELECT 
    me.mood_timestamp,
    me.mood_type,
    LEFT(me.note, 50) || '...' as nota_preview
FROM mood_entries me
JOIN users u ON me.user_id = u.id
WHERE u.username = 'ana_garcia'
ORDER BY me.mood_timestamp DESC
LIMIT 10;

-- Limpiar función auxiliar
DROP FUNCTION IF EXISTS generate_mood_note(TEXT);

-- =====================================================
-- INSTRUCCIONES DE USO:
-- =====================================================
-- 1. Ejecuta este script completo en el SQL Editor de Supabase
-- 2. Los datos se generarán para el usuario "Ana García"
-- 3. Si quieres usar otro usuario, cambia 'ana_garcia' por el username deseado
-- 4. Los datos incluyen:
--    - 30 entradas distribuidas en los últimos 30 días
--    - Horas aleatorias entre 6:00 y 22:00
--    - Estados de ánimo aleatorios con notas realistas
--    - Timestamps precisos para el gráfico
-- =====================================================
